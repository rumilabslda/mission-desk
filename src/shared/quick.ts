import type { EventDraft } from './types';

// The quick-entry pop-ups (sidebar ⚡ and its shortcuts): a new to-do or a new event, drawn
// over the page the user is on (main/views/quick-overlay.ts), so nothing navigates away.

export type TodoTag = { kind: 'space' | 'account'; id: string };
export type QuickRequest = { kind: 'todo'; tag: TodoTag | null } | { kind: 'event'; accountId: string | null };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** A request as main sent it, or null when it isn't one. */
export function parseQuickRequest(v: unknown): QuickRequest | null {
  if (!isObj(v)) return null;
  if (v.kind === 'event') return v.accountId === null || typeof v.accountId === 'string' ? { kind: 'event', accountId: v.accountId } : null;
  if (v.kind !== 'todo') return null;
  if (v.tag === null) return { kind: 'todo', tag: null };
  const t = v.tag;
  if (isObj(t) && (t.kind === 'space' || t.kind === 'account') && typeof t.id === 'string') return { kind: 'todo', tag: { kind: t.kind, id: t.id } };
  return null;
}

/** A new event's draft: from the next half hour, for an hour (as the calendar's Create button). */
export function eventDraftAt(now: Date): EventDraft {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() < 30 ? 30 : 60);
  const end = new Date(start.getTime() + 60 * 60_000);
  return { calendarId: 'primary', title: '', allDay: false, start: start.toISOString(), end: end.toISOString(), location: '', description: '', guests: [], meet: false };
}
