/** Shared between the assistant engine (main) and the panel (renderer). */

export const ASSISTANT_MODELS = [
  { id: 'default', label: 'Default (Claude Code)' },
  { id: 'opus', label: 'Opus' },
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'haiku', label: 'Haiku' },
  { id: 'fable', label: 'Fable' },
] as const;
export type AssistantModel = (typeof ASSISTANT_MODELS)[number]['id'];

export const ASSISTANT_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type AssistantEffort = (typeof ASSISTANT_EFFORTS)[number];

export type AssistantEvent =
  | { type: 'init'; model: string; sessionId: string }
  | { type: 'text'; delta: string }
  | { type: 'tool'; id: string; name: string; input?: Record<string, unknown> }
  | { type: 'toolDone'; id: string; isError: boolean }
  | { type: 'done'; isError: boolean; text?: string; sessionId?: string }
  | { type: 'error'; kind: 'not-found' | 'signed-out' | 'failed'; message: string };

export const isAssistantModel = (v: unknown): v is AssistantModel => ASSISTANT_MODELS.some((m) => m.id === v);
export const isAssistantEffort = (v: unknown): v is AssistantEffort => (ASSISTANT_EFFORTS as readonly unknown[]).includes(v);

/** Quick commands: "/name extra words" expands to a full prompt (the extra words are kept). */
export const COMMANDS: { name: string; hint: string; prompt: string }[] = [
  {
    name: 'brief',
    hint: 'Your day across all accounts',
    prompt:
      "Brief me on today across all my accounts. 1) Today's meetings from calendar_events (all shared accounts), in time order, flagging overlaps or back-to-back meetings between different clients. 2) unread_counts per account. 3) For the accounts with unread mail or messages, read the inbox / mentions (read_page) and list what actually needs my reply or action, per client, most urgent first. End with the 3 things I should do first.",
  },
  {
    name: 'waiting',
    hint: 'Who is waiting on you',
    prompt:
      "Find who is waiting on me: for each shared account, look at the inbox and recent conversations (read_page; for Gmail you can open https://mail.google.com/mail/u/0/#inbox) and list threads where the last message is from someone else and asks me something or expects an answer. Group by client/account, oldest first, with one line each saying what they need.",
  },
  {
    name: 'prep',
    hint: 'Prepare your next meeting',
    prompt:
      "Prepare me for my next meeting: find the next event in calendar_events (from now, all shared accounts). Then in that event's account, search the mail for recent messages with its participants or about its topic (open a Gmail search URL, then read_page) and summarise: purpose, what was said recently, open questions, and what I should bring. Include the Meet link if there is one.",
  },
  {
    name: 'schedule',
    hint: 'Find a time and book it',
    prompt:
      "Help me schedule this. Use find_free_time across ALL my shared calendars (so it doesn't clash with any client), propose the 3 best slots (prefer mornings and avoid back-to-back meetings), and once I pick one, create it with create_event in the right account (Mission Desk will ask me to confirm). Request:",
  },
  {
    name: 'reply',
    hint: 'Draft a reply to the open thread',
    prompt:
      "Draft a reply to the conversation I have open: call current_context, read the page, then write a concise reply in the same language and tone as the thread. Put it in the reply box (click Reply, then type) but DO NOT send it; tell me it's ready to review. Extra instructions:",
  },
  {
    name: 'summarize',
    hint: 'Summarise what is on screen',
    prompt:
      'Summarise what I have on screen (current_context, then read_page): the key points, decisions, who needs what from me, and any dates or deadlines.',
  },
  {
    name: 'catchup',
    hint: 'What happened in an account',
    prompt:
      "Catch me up on this account: read its inbox / recent conversations and its calendar for the next days, and tell me what's new, what needs me, and what's coming up. Account:",
  },
];

export function expandCommand(input: string): string {
  const m = /^\/(\w+)\b\s*([\s\S]*)$/.exec(input.trim());
  const cmd = m && COMMANDS.find((c) => c.name === m[1].toLowerCase());
  if (!m || !cmd) return input;
  const extra = m[2].trim();
  return extra ? `${cmd.prompt} ${extra}` : cmd.prompt;
}

/** Is the user's Claude Code ready for the assistant (setup steps)? */
export type ClaudeStatus = { state: 'not-installed' } | { state: 'signed-out' | 'ready'; version?: string };
