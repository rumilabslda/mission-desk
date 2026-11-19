import type { AssistantEvent } from './assistant';

export interface ToolStep {
  id: string;
  name: string;
  input?: Record<string, unknown>;
  /** Where in the message's text the step ran, so the chat shows it between the words before and after it (older saved steps have none: shown first). */
  at?: number;
  done: boolean;
  isError: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  tools: ToolStep[];
}

/** A conversation as listed in the history. */
export interface ConversationMeta {
  id: string;
  scope: string;
  title: string;
  updatedAt: string;
}

/** The chat after one engine event (shared by the chat and the saved history). */
export function applyEvent(messages: ChatMessage[], e: AssistantEvent): ChatMessage[] {
  if (e.type !== 'text' && e.type !== 'tool' && e.type !== 'toolDone') return messages;
  const last = messages[messages.length - 1];
  const cur: ChatMessage = last && last.role === 'assistant' ? { ...last, tools: [...last.tools] } : { role: 'assistant', text: '', tools: [] };
  if (e.type === 'text') {
    // Words after tool steps begin a new paragraph, never run on from the sentence before them.
    const afterTools = cur.text && cur.tools.length > 0 && cur.tools[cur.tools.length - 1].at === cur.text.length;
    cur.text += (afterTools && !cur.text.endsWith('\n\n') ? (cur.text.endsWith('\n') ? '\n' : '\n\n') : '') + e.delta;
  } else if (e.type === 'tool')
    cur.tools.push({ id: e.id, name: e.name, ...(e.input ? { input: e.input } : {}), at: cur.text.length, done: false, isError: false });
  else cur.tools = cur.tools.map((t) => (t.id === e.id ? { ...t, done: true, isError: e.isError } : t));
  return last && last.role === 'assistant' ? [...messages.slice(0, -1), cur] : [...messages, cur];
}
