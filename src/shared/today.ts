import { t } from './i18n';
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

export function greeting(now: Date, name?: string): string {
  const h = now.getHours();
  const g = t(h < 12 ? 'home.greeting.morning' : h < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening');
  return name ? t('home.greeting.named', { greeting: g, name }) : g;
}

/** Open on Today at launch: on by default, never on first run (the welcome screen shows instead). */
export function opensOnToday(state: { accounts: unknown[]; openOnToday?: boolean }): boolean {
  return state.accounts.length > 0 && state.openOnToday !== false;
}

/** An event placed on the Today timeline (minutes from the window's start, clipped to it). */
export interface TimelineBlock {
  event: CalEvent;
  top: number;
  bottom: number;
  col: number;
  cols: number;
}

/** Free time from now on, at least FREE_MINUTES long. `open`: it runs to the window's edge (its true length is unknown). */
export interface TimelineGap {
  top: number;
  bottom: number;
  open: boolean;
}

export interface TimelineView {
  start: Date;
  end: Date;
  blocks: TimelineBlock[];
  gaps: TimelineGap[];
  /** Today's meetings outside the window, before and after it. */
  earlier: number;
  later: number;
}

export const TIMELINE_BACK_MINUTES = 30;
export const TIMELINE_AHEAD_MINUTES = 4 * 60;
const FREE_MINUTES = 30;

/**
 * Today's timed events on a scale, around now: from half an hour back to a few hours ahead,
 * stretched to the start or end of the day's events on request. Overlaps sit side by side.
 */
export function timelineView(events: CalEvent[], now: Date, opts: { earlier?: boolean; later?: boolean } = {}): TimelineView {
  const t = now.getTime();
  const MIN = 60_000;
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const s = (e: CalEvent) => Date.parse(e.start);
  const e_ = (e: CalEvent) => Date.parse(e.end);
  const timed = events
    .filter((e) => !e.allDay && e_(e) - s(e) < 24 * 60 * MIN && e_(e) > dayStart && s(e) < dayEnd)
    .sort((a, b) => s(a) - s(b) || e_(b) - e_(a));

  const quarter = 15 * MIN;
  let start = Math.floor((t - TIMELINE_BACK_MINUTES * MIN) / quarter) * quarter;
  let end = Math.ceil((t + TIMELINE_AHEAD_MINUTES * MIN) / quarter) * quarter;
  if (opts.earlier && timed.length) start = Math.min(start, Math.max(dayStart, Math.floor(s(timed[0]) / quarter) * quarter));
  if (opts.later && timed.length) end = Math.max(end, Math.min(dayEnd, Math.ceil(Math.max(...timed.map(e_)) / quarter) * quarter));

  const inside = timed.filter((e) => e_(e) > start && s(e) < end);
  const earlier = timed.filter((e) => !e.free && e_(e) <= start).length;
  const later = timed.filter((e) => !e.free && s(e) >= end).length;

  // Side-by-side columns within each run of overlapping events.
  const blocks: TimelineBlock[] = [];
  let cluster: TimelineBlock[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;
  const flush = (): void => {
    for (const b of cluster) b.cols = colEnds.length;
    blocks.push(...cluster);
    cluster = [];
    colEnds = [];
  };
  for (const e of inside) {
    const top = Math.max(0, (s(e) - start) / MIN);
    const bottom = Math.min(end - start, e_(e) - start) / MIN;
    if (top >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    let col = colEnds.findIndex((c) => c <= top);
    if (col < 0) col = colEnds.push(bottom) - 1;
    else colEnds[col] = bottom;
    cluster.push({ event: e, top, bottom, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, bottom);
  }
  flush();

  // Free time from now to the window's end ("free" events don't take time).
  const gaps: TimelineGap[] = [];
  let cursor = Math.max(0, (t - start) / MIN);
  for (const b of blocks.filter((x) => !x.event.free)) {
    if (b.bottom <= cursor) continue;
    if (b.top - cursor >= FREE_MINUTES) gaps.push({ top: cursor, bottom: b.top, open: false });
    cursor = Math.max(cursor, b.bottom);
  }
  const total = (end - start) / MIN;
  if (total - cursor >= FREE_MINUTES) gaps.push({ top: cursor, bottom: total, open: true });

  return { start: new Date(start), end: new Date(end), blocks, gaps, earlier, later };
}
