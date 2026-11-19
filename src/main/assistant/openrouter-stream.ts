// Reads an OpenAI-style chat completion stream (Server-Sent Events), as OpenRouter sends it:
// text deltas as they come, tool calls assembled from their pieces, errors, and [DONE].

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface StreamResult {
  text: string;
  toolCalls: ToolCall[];
  finish: string | null;
  done: boolean;
  error?: string;
  /** Reasoning blocks (Claude's thinking, Gemini's signatures): sent back with tool calls. */
  reasoningDetails: unknown[];
}

type Delta = {
  content?: string | null;
  reasoning_details?: unknown[];
  tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[];
};

export function createChatStream() {
  let carry = '';
  const r: StreamResult = { text: '', toolCalls: [], finish: null, done: false, reasoningDetails: [] };
  const calls: ToolCall[] = [];
  const slotOf = new Map<number, number>(); // the provider's index → our call

  function line(raw: string): { type: 'text'; delta: string }[] {
    if (!raw.startsWith('data:')) return []; // ": comments" keep the connection alive
    const data = raw.slice(5).trim();
    if (data === '[DONE]') {
      r.done = true;
      return [];
    }
    let msg: { error?: { message?: string }; choices?: { delta?: Delta; finish_reason?: string | null }[] };
    try {
      msg = JSON.parse(data);
    } catch {
      return [];
    }
    if (msg.error) {
      r.error = msg.error.message ?? 'The model returned an error.';
      return [];
    }
    const out: { type: 'text'; delta: string }[] = [];
    for (const ch of msg.choices ?? []) {
      const d = ch.delta ?? {};
      if (d.content) {
        r.text += d.content;
        out.push({ type: 'text', delta: d.content });
      }
      if (Array.isArray(d.reasoning_details)) r.reasoningDetails.push(...d.reasoning_details);
      for (const tc of d.tool_calls ?? []) {
        // By the provider's index; without one, a new id is a new call (some send whole calls that way).
        let i: number;
        if (tc.index === undefined) {
          const last = calls.length - 1;
          i = last >= 0 && (!tc.id || calls[last].id === tc.id) ? last : calls.length;
        } else {
          const known = slotOf.get(tc.index);
          i = known !== undefined && !(tc.id && calls[known].id && calls[known].id !== tc.id) ? known : calls.length;
          slotOf.set(tc.index, i);
        }
        calls[i] ??= { id: '', name: '', arguments: '' };
        if (tc.id) calls[i].id = tc.id;
        if (tc.function?.name) calls[i].name = tc.function.name; // sent whole (some providers repeat it)
        if (tc.function?.arguments) calls[i].arguments += tc.function.arguments;
      }
      if (ch.finish_reason) r.finish = ch.finish_reason;
      if (ch.finish_reason === 'error' && !r.error) r.error = 'The model stopped with an error.';
    }
    return out;
  }

  return {
    /** Feeds a chunk of the body; returns the text deltas it completed. */
    push(chunk: string): { type: 'text'; delta: string }[] {
      const text = carry + chunk;
      const lines = text.split('\n');
      carry = lines.pop() ?? '';
      return lines.flatMap((l) => line(l.replace(/\r$/, '')));
    },
    result(): StreamResult {
      if (carry) {
        line(carry);
        carry = '';
      }
      r.toolCalls = calls.filter(Boolean).map((c, i) => ({ ...c, id: c.id || `call_${i}` }));
      return r;
    },
  };
}
