import type { CalEvent, Todo } from './types';

export const localDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Open to-dos (carried over from earlier days first) and today's done ones. */
export function todayView(todos: Todo[], today: string): { open: (Todo & { carried: boolean })[]; done: Todo[] } {
  const byCreated = (a: Todo, b: Todo) => a.createdAt.localeCompare(b.createdAt);
  const open = todos
    .filter((t) => !t.done)
    .map((t) => ({ ...t, carried: t.day < today }))
    .sort((a, b) => Number(b.carried) - Number(a.carried) || byCreated(a, b));
  const done = todos.filter((t) => t.done && t.doneAt && localDay(new Date(t.doneAt)) === today).sort(byCreated);
  return { open, done };
}

/** Pairs of overlapping timed events from different accounts (client clashes). */
export function clashes(events: CalEvent[]): [CalEvent, CalEvent][] {
  const timed = events.filter((e) => !e.allDay && !e.free).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const out: [CalEvent, CalEvent][] = [];
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (Date.parse(timed[j].start) >= Date.parse(timed[i].end)) break;
      if (timed[i].accountId !== timed[j].accountId) out.push([timed[i], timed[j]]);
    }
  }
  return out;
}

/** The meeting happening now, or the next one to start. */
export function nextEvent(events: CalEvent[], now: Date): CalEvent | undefined {
  const t = now.getTime();
  return events
    .filter((e) => !e.allDay && Date.parse(e.end) > t)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
}

/** How long a meeting that just ended stays in the list (dimmed). */
export const RECENT_MINUTES = 30;

export interface AgendaView {
  /** Meetings happening now (the headline; "free" blocks never are). */
  current: CalEvent[];
  /** The next meeting to start today. */
  next: CalEvent | null;
  /** Ended in the last RECENT_MINUTES: shown dimmed. */
  recent: CalEvent[];
  /** The rest of today (ongoing free blocks and meetings after the next one). */
  upcoming: CalEvent[];
  /** Ended earlier today: counted, shown only on request. */
  earlier: CalEvent[];
  allDay: CalEvent[];
  /** Tomorrow's meetings, when nothing is left today. */
  tomorrow: CalEvent[];
}

/** The agenda around now: what's happening and what's next first; the past tucked away. */
export function agendaView(events: CalEvent[], now: Date): AgendaView {
  const t = now.getTime();
  const today = localDay(now);
  const tomorrowDay = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const s = (e: CalEvent) => Date.parse(e.start);
  const e_ = (e: CalEvent) => Date.parse(e.end);
  const timed = events.filter((e) => !e.allDay).sort((a, b) => s(a) - s(b));
  const onToday = timed.filter((e) => localDay(new Date(e.start)) === today || (s(e) <= t && e_(e) > t));
  const current = onToday.filter((e) => !e.free && s(e) <= t && e_(e) > t);
  const next = onToday.find((e) => !e.free && s(e) > t) ?? null;
  const headline = new Set([...current, ...(next ? [next] : [])]);
  const recent = onToday.filter((e) => e_(e) <= t && e_(e) > t - RECENT_MINUTES * 60_000);
  const earlier = onToday.filter((e) => e_(e) <= t - RECENT_MINUTES * 60_000);
  const upcoming = onToday.filter((e) => e_(e) > t && !headline.has(e));
  const allDay = events.filter((e) => e.allDay && e.start <= today && e.end > today);
  const tomorrow = current.length || next ? [] : timed.filter((e) => localDay(new Date(e.start)) === tomorrowDay && !e.free);
  return { current, next, recent, upcoming, earlier, allDay, tomorrow };
}

export function greeting(now: Date): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Open on Today at launch: on by default, never on first run (the welcome screen shows instead). */
export function opensOnToday(state: { accounts: unknown[]; openOnToday?: boolean }): boolean {
  return state.accounts.length > 0 && state.openOnToday !== false;
}
