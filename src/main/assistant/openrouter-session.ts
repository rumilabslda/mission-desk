import type { AssistantEffort, AssistantEvent } from '../../shared/assistant';
import type { ChatMessage } from '../../shared/assistant-history';
import { t } from '../../shared/i18n';
import type { AssistantSession } from './engine';
import { createChatStream, type ToolCall } from './openrouter-stream';

const URL = 'https://openrouter.ai/api/v1/chat/completions';
/** Rounds of tool calls in one answer before it is cut short (a model looping on tools). */
const MAX_STEPS = 16;
const MAX_TOOL_RESULT = 30_000;

export interface ToolDef {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface OpenRouterIO {
  fetch: typeof fetch;
  /** The user's OpenRouter key (from the Keychain), or null when not connected. */
  apiKey(): Promise<string | null>;
  /** The scope's Mission Desk tools (the same ones Claude Code gets, limited to the space). */
  tools(): Promise<{ defs: ToolDef[]; call(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<{ text: string; isError: boolean }> }>;
  systemPrompt(): string;
  /** The saved conversation (its text is the context of the next message). */
  history: ChatMessage[];
}

type Msg =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]; reasoning_details?: unknown[] }
  | { role: 'tool'; tool_call_id: string; content: string };

const EFFORT: Record<AssistantEffort, string> = { low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'high' };

/** One assistant conversation on OpenRouter: Mission Desk runs the tool loop itself. */
export function createOpenRouterSession(io: OpenRouterIO, initial: { model: string; effort?: AssistantEffort }): AssistantSession {
  let model = initial.model;
  let effort: AssistantEffort = initial.effort ?? 'medium';
  // The saved conversation, without its last user message(s): the controller saves a message before
  // sending it, and send() adds it again.
  const saved = [...io.history];
  while (saved.length && saved[saved.length - 1].role === 'user') saved.pop();
  const messages: Msg[] = saved.filter((m) => m.text.trim()).map((m) => ({ role: m.role, content: m.text }) as Msg);
  let working = false;
  let controller: AbortController | null = null;
  const listeners = new Set<(e: AssistantEvent) => void>();
  const emit = (e: AssistantEvent): void => listeners.forEach((l) => l(e));

  async function step(key: string, defs: ToolDef[], signal: AbortSignal): Promise<{ toolCalls: ToolCall[] } | null> {
    const res = await io.fetch(URL, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rumilabs.pt',
        'X-Title': 'Mission Desk',
        'X-OpenRouter-Title': 'Mission Desk',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'system', content: io.systemPrompt() }, ...messages],
        tools: defs.map((d) => {
          const { $schema: _s, ...parameters } = d.inputSchema; // some providers refuse "$schema"
          return { type: 'function', function: { name: d.name, description: d.description ?? '', parameters } };
        }),
        reasoning: { effort: EFFORT[effort] },
      }),
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      let message = t('assistant.error.openRouterStatus', { status: String(res.status) });
      try {
        message = (JSON.parse(detail) as { error?: { message?: string } }).error?.message ?? message;
      } catch {
        // not JSON
      }
      emit({ type: 'error', kind: res.status === 401 ? 'signed-out' : 'failed', message });
      return null;
    }
    const stream = createChatStream();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const e of stream.push(decoder.decode(value, { stream: true }))) emit(e);
    }
    const r = stream.result();
    if (signal.aborted) return null;
    if (r.error) {
      emit({ type: 'error', kind: 'failed', message: r.error });
      return null;
    }
    const valid = (a: string): boolean => {
      try {
        return typeof JSON.parse(a || '{}') === 'object';
      } catch {
        return false;
      }
    };
    messages.push({
      role: 'assistant',
      content: r.text || null,
      // Arguments stored as valid JSON (a provider re-reading them would refuse broken ones).
      ...(r.toolCalls.length ? { tool_calls: r.toolCalls.map((c) => ({ id: c.id, type: 'function' as const, function: { name: c.name, arguments: valid(c.arguments) ? c.arguments || '{}' : '{}' } })) } : {}),
      ...(r.reasoningDetails.length ? { reasoning_details: r.reasoningDetails } : {}),
    });
    return { toolCalls: r.toolCalls };
  }

  async function answer(): Promise<void> {
    const ctl = new AbortController(); // before any await: Stop must reach this run
    controller = ctl;
    const key = await io.apiKey();
    if (ctl.signal.aborted) return;
    if (!key) {
      controller = null;
      working = false;
      emit({ type: 'error', kind: 'signed-out', message: t('assistant.error.openRouterConnect') });
      return;
    }
    try {
      const { defs, call } = await io.tools();
      emit({ type: 'init', model, sessionId: '' });
      for (let i = 0; i < MAX_STEPS; i++) {
        const r = await step(key, defs, ctl.signal);
        if (!r) return;
        if (r.toolCalls.length === 0) break;
        for (const c of r.toolCalls) {
          if (ctl.signal.aborted) return; // stopped: nothing more runs or is added
          let args: Record<string, unknown> | null = null;
          try {
            const parsed = JSON.parse(c.arguments || '{}') as unknown;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) args = parsed as Record<string, unknown>;
          } catch {
            // broken arguments (e.g. cut off): the tool isn't run
          }
          if (!args) {
            messages.push({ role: 'tool', tool_call_id: c.id, content: 'Error: the arguments were not valid JSON. Call the tool again with valid arguments.' });
            continue;
          }
          emit({ type: 'tool', id: c.id, name: c.name, input: args });
          const out = await call(c.name, args, ctl.signal).catch((e: Error) => ({ text: `Error: ${e.message}`, isError: true }));
          if (ctl.signal.aborted) return;
          emit({ type: 'toolDone', id: c.id, isError: out.isError });
          messages.push({ role: 'tool', tool_call_id: c.id, content: out.text.slice(0, MAX_TOOL_RESULT) });
        }
        if (i === MAX_STEPS - 1) emit({ type: 'text', delta: `\n\n${t('assistant.error.tooManySteps')}` });
      }
      emit({ type: 'done', isError: false });
    } catch (e) {
      if (!ctl.signal.aborted) emit({ type: 'error', kind: 'failed', message: (e as Error).message });
    } finally {
      if (controller === ctl) {
        controller = null;
        working = false; // only this run's flag (a newer run may be going)
      }
    }
  }

  const api: AssistantSession = {
    async send(text) {
      if (working) return;
      working = true;
      messages.push({ role: 'user', content: text });
      void answer();
    },
    stop() {
      controller?.abort();
      controller = null;
      working = false;
      emit({ type: 'done', isError: false });
    },
    setModel(m, e) {
      model = m;
      effort = e;
    },
    close() {
      controller?.abort();
      controller = null;
      working = false;
      messages.length = 0;
    },
    release() {
      controller?.abort();
      controller = null;
      working = false;
    },
    sessionId: () => null,
    onEvent(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    busy: () => working,
  };
  return api;
}
