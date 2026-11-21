import type { EventDraft } from './types';

// The quick-entry pop-ups (sidebar ⚡ and its shortcuts): a new to-do or a new event, drawn
// over the page the user is on (main/views/quick-overlay.ts), so nothing navigates away.

export type TodoTag = { kind: 'space' | 'account'; id: string };
/** A short confirmation beside the floating button (a Meet link on its way, then copied). */
export type FabToast = { state: 'busy' | 'done' | 'error'; title: string; detail?: string };
/** As the button's page gets it: which side the toast opens towards. */
export type FabToastShown = FabToast & { side: 'left' | 'right' };

/** The floating button's quick actions, nearest the button last. */
export const DIAL_ACTIONS = ['meet', 'event', 'todo', 'assistant'] as const;
export type DialAction = (typeof DIAL_ACTIONS)[number];
export const isDialAction = (v: unknown): v is DialAction => typeof v === 'string' && (DIAL_ACTIONS as readonly string[]).includes(v);
/** The floating button opened as a menu: where it sits (window coordinates), and what may be offered. */
export type DialRequest = {
  kind: 'dial';
  fab: { x: number; y: number; width: number; height: number };
  side: 'left' | 'right';
  label: string | null;
  actions: DialAction[];
};
export type QuickRequest = { kind: 'todo'; tag: TodoTag | null } | { kind: 'event'; accountId: string | null } | DialRequest;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** A request as main sent it, or null when it isn't one. */
export function parseQuickRequest(v: unknown): QuickRequest | null {
  if (!isObj(v)) return null;
  if (v.kind === 'event') return v.accountId === null || typeof v.accountId === 'string' ? { kind: 'event', accountId: v.accountId } : null;
  if (v.kind === 'dial') return parseDial(v);
  if (v.kind !== 'todo') return null;
  if (v.tag === null) return { kind: 'todo', tag: null };
  const t = v.tag;
  if (isObj(t) && (t.kind === 'space' || t.kind === 'account') && typeof t.id === 'string') return { kind: 'todo', tag: { kind: t.kind, id: t.id } };
  return null;
}

function parseDial(v: Record<string, unknown>): DialRequest | null {
  const f = v.fab;
  const num = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  if (!isObj(f) || !num(f.x) || !num(f.y) || !num(f.width) || !num(f.height)) return null;
  if (v.side !== 'left' && v.side !== 'right') return null;
  if (v.label !== null && typeof v.label !== 'string') return null;
  if (!Array.isArray(v.actions) || !v.actions.every(isDialAction)) return null;
  return { kind: 'dial', fab: { x: f.x, y: f.y, width: f.width, height: f.height }, side: v.side, label: v.label, actions: v.actions };
}

/** A new event's draft: from the next half hour, for an hour (as the calendar's Create button). */
export function eventDraftAt(now: Date): EventDraft {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() < 30 ? 30 : 60);
  const end = new Date(start.getTime() + 60 * 60_000);
  return { calendarId: 'primary', title: '', allDay: false, start: start.toISOString(), end: end.toISOString(), location: '', description: '', guests: [], meet: false };
}
