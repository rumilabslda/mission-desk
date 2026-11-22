/** Shared between the assistant engine (main) and the panel (renderer). */

import { type MessageKey, t } from './i18n';

/** The models in the menu (`label` is read when shown, in the interface language). */
export const ASSISTANT_MODELS = [
  {
    id: 'default',
    get label(): string {
      return t('assistant.model.default');
    },
  },
  { id: 'opus', label: 'Opus' },
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'haiku', label: 'Haiku' },
  { id: 'fable', label: 'Fable' },
] as const;
export type AssistantModel = (typeof ASSISTANT_MODELS)[number]['id'];

export const ASSISTANT_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type AssistantEffort = (typeof ASSISTANT_EFFORTS)[number];

const EFFORT_LABEL: Record<AssistantEffort, MessageKey> = {
  low: 'assistant.effort.low',
  medium: 'assistant.effort.medium',
  high: 'assistant.effort.high',
  xhigh: 'assistant.effort.xhigh',
  max: 'assistant.effort.max',
};
/** An effort as the menus show it. */
export const effortLabel = (e: AssistantEffort): string => t(EFFORT_LABEL[e]);

export type AssistantEvent =
  | { type: 'init'; model: string; sessionId: string }
  | { type: 'text'; delta: string }
  | { type: 'tool'; id: string; name: string; input?: Record<string, unknown> }
  | { type: 'toolDone'; id: string; isError: boolean }
  | { type: 'done'; isError: boolean; text?: string; sessionId?: string }
  | { type: 'error'; kind: 'not-found' | 'signed-out' | 'failed'; message: string };

export const isAssistantModel = (v: unknown): v is AssistantModel => ASSISTANT_MODELS.some((m) => m.id === v);
export const isAssistantEffort = (v: unknown): v is AssistantEffort => (ASSISTANT_EFFORTS as readonly unknown[]).includes(v);

/** A built-in command: its hint (shown in the "/" menu, in the interface language) and its prompt (sent to the model, in English). */
interface Command {
  name: string;
  readonly hint: string;
  prompt: string;
}

const command = (name: string, hintKey: MessageKey, prompt: string): Command => ({
  name,
  get hint() {
    return t(hintKey);
  },
  prompt,
});

/** Quick commands: "/name extra words" expands to a full prompt (the extra words are kept). */
export const COMMANDS: Command[] = [
  command(
    'brief',
    'assistant.command.brief',
    "Brief me on today across all my accounts. 1) Today's meetings from calendar_events (all shared accounts), in time order, flagging overlaps or back-to-back meetings between different clients. 2) recent_messages and unread_counts: what came in and from whom. 3) My open to-dos (todos). 4) Only where a message needs more context, read that thread (read_page). List what actually needs my reply or action, per client, most urgent first. End with the 3 things I should do first.",
  ),
  command(
    'waiting',
    'assistant.command.waiting',
    "Find who is waiting on me, and who I'm waiting on: start with recent_messages and the to-dos marked waiting on someone (from meetings), then check the inbox and recent conversations of the accounts with unread messages (read_page; for Gmail you can open https://mail.google.com/mail/u/0/#inbox). List threads where the last message is from someone else and asks me something or expects an answer. Group by client/account, oldest first, with one line each saying what they need.",
  ),
  command(
    'prep',
    'assistant.command.prep',
    "Prepare me for my next meeting: find the next event in calendar_events (from now, all shared accounts). Then in that event's account, search the mail for recent messages with its participants or about its topic (open a Gmail search URL, then read_page) and summarise: purpose, what was said recently, open questions, and what I should bring. Include the Meet link if there is one.",
  ),
  command(
    'schedule',
    'assistant.command.schedule',
    "Help me schedule this. Use find_free_time across ALL my shared calendars (so it doesn't clash with any client), propose the 3 best slots (prefer mornings and avoid back-to-back meetings), and once I pick one, create it with create_event in the right account (Mission Desk will ask me to confirm). Request:",
  ),
  command(
    'reply',
    'assistant.command.reply',
    "Draft a reply to the conversation I have open: call current_context, read the page, then write a concise reply in the same language and tone as the thread. Put it in the reply box (click Reply, then type) but DO NOT send it; tell me it's ready to review. Extra instructions:",
  ),
  command(
    'summarize',
    'assistant.command.summarize',
    'Summarise what I have on screen (current_context, then read_page): the key points, decisions, who needs what from me, and any dates or deadlines.',
  ),
  command(
    'catchup',
    'assistant.command.catchup',
    "Catch me up on this account: read its inbox / recent conversations and its calendar for the next days, and tell me what's new, what needs me, and what's coming up. Account:",
  ),
];

export function expandCommand(input: string): string {
  const m = /^\/(\w+)\b\s*([\s\S]*)$/.exec(input.trim());
  const cmd = m && COMMANDS.find((c) => c.name === m[1].toLowerCase());
  // Any other "/word" is the user's text, not a command: Claude Code would take it as one of its own
  // (and drop it when it doesn't know it), so it goes as a quoted message.
  if (!m || !cmd) return input.trimStart().startsWith('/') ? `The user wrote: ${input.trim()}` : input;
  const extra = m[2].trim();
  return extra ? `${cmd.prompt} ${extra}` : cmd.prompt;
}

/** Is the user's Claude Code ready for the assistant (setup steps)? */
export type ClaudeStatus = { state: 'not-installed' } | { state: 'signed-out' | 'ready'; version?: string };

/** A note the assistant keeps for one scope (a space, "No space" or "All spaces"), never shown to another. */
export interface MemoryNote {
  id: string;
  text: string;
  createdAt: string;
}
