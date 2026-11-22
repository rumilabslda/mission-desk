import type { AssistantEffort, AssistantEvent } from '../../shared/assistant';
import { t } from '../../shared/i18n';

/**
 * The user's own Claude Code, run headless. Mission Desk never touches its
 * credentials: Claude Code signs in by itself and uses the user's own plan.
 */

export interface RunOptions {
  /** An alias ('opus', 'sonnet', …) or 'default' for Claude Code's own choice. */
  model: string;
  effort: AssistantEffort;
  /** JSON for --mcp-config (the Mission Desk server only). */
  mcpConfig: string;
  systemPrompt: string;
  /** Continue this Claude Code session. */
  resume?: string;
}

export function buildArgs(o: RunOptions): string[] {
  const args = [
    '-p',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--effort', o.effort,
    '--tools', '', // no file system, shell or web tools: only Mission Desk's
    '--strict-mcp-config',
    '--mcp-config', o.mcpConfig,
    '--allowedTools', 'mcp__missiondesk', // every tool of the Mission Desk server (documented server-level rule)
    '--permission-mode', 'dontAsk',
    '--setting-sources', 'local', // not the user's hooks/plugins; the working folder is empty
    '--append-system-prompt', o.systemPrompt,
  ];
  if (o.model !== 'default') args.push('--model', o.model);
  if (o.resume) args.push('--resume', o.resume);
  return args;
}

const DROP = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
  'ELECTRON_RUN_AS_NODE',
];

/** The environment for Claude Code: without variables that would change how it signs in. */
export function cleanEnv(env: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) if (v !== undefined && !DROP.includes(k)) out[k] = v;
  return out;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const shortName = (name: string): string => name.replace(/^mcp__missiondesk__/, '');

/** One line of Claude Code's stream-json output → what the panel needs. */
export function parseEvent(line: string): AssistantEvent[] {
  let e: unknown;
  try {
    e = JSON.parse(line);
  } catch {
    return [];
  }
  if (!isObj(e)) return [];
  switch (e.type) {
    case 'system':
      return e.subtype === 'init' ? [{ type: 'init', model: str(e.model), sessionId: str(e.session_id) }] : [];
    case 'stream_event': {
      const ev = isObj(e.event) ? e.event : {};
      const delta = isObj(ev.delta) ? ev.delta : {};
      // A new text block (e.g. after a tool call) starts a new paragraph.
      if (ev.type === 'content_block_start' && isObj(ev.content_block) && ev.content_block.type === 'text') return [{ type: 'text', delta: '\n\n' }];
      return ev.type === 'content_block_delta' && delta.type === 'text_delta' && str(delta.text) ? [{ type: 'text', delta: str(delta.text) }] : [];
    }
    case 'assistant': {
      const content = isObj(e.message) && Array.isArray(e.message.content) ? e.message.content : [];
      return content
        .filter((b): b is Obj => isObj(b) && b.type === 'tool_use')
        .map((b) => ({ type: 'tool' as const, id: str(b.id), name: shortName(str(b.name)), ...(isObj(b.input) ? { input: b.input } : {}) }));
    }
    case 'user': {
      const content = isObj(e.message) && Array.isArray(e.message.content) ? e.message.content : [];
      return content
        .filter((b): b is Obj => isObj(b) && b.type === 'tool_result')
        .map((b) => ({ type: 'toolDone' as const, id: str(b.tool_use_id), isError: b.is_error === true }));
    }
    case 'result': {
      const done: AssistantEvent = { type: 'done', isError: e.is_error === true || e.subtype !== 'success' };
      if (str(e.result)) done.text = str(e.result);
      if (str(e.session_id)) done.sessionId = str(e.session_id);
      return [done];
    }
    default:
      return [];
  }
}

/**
 * "Default" runs Claude Code with its own model setting (~/.claude/settings.json). When that names a
 * model this Claude Code can't use, say so and what to do, instead of only Claude Code's message.
 */
export function explainModelError(message: string, model: string): string {
  if (model !== 'default') return message;
  if (!/(selected model|model).{0,80}(not exist|not found|doesn't exist|does not exist|invalid|not available|access)/i.test(message)) return message;
  return t('assistant.error.defaultModel', { message: message.trim() });
}

/** Errors that mean "sign in to Claude Code again". */
export function classifyError(text: string): 'signed-out' | 'failed' {
  return /authenticat|log ?in|logged in|oauth|api key|credential|unauthori[sz]ed|\/login/i.test(text) ? 'signed-out' : 'failed';
}
