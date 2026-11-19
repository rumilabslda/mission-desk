import type { CalEvent } from '../../../shared/types';
import { addDays, startOfDay } from './dates';

const DAY_MIN = 24 * 60;
const MIN_HEIGHT = 15;

export interface TimedBlock {
  event: CalEvent;
  /** Minutes from midnight. */
  top: number;
  height: number;
  col: number;
  cols: number;
}

export interface AllDayBar {
  event: CalEvent;
  startCol: number;
  span: number;
  row: number;
}

/** Local start and end of an event (all-day dates are local midnights, end exclusive). */
function bounds(e: CalEvent): { start: Date; end: Date } {
  if (e.allDay) {
    const [ys, ms, ds] = e.start.split('-').map(Number);
    const [ye, me, de] = e.end.split('-').map(Number);
    return { start: new Date(ys, ms - 1, ds), end: new Date(ye, me - 1, de) };
  }
  return { start: new Date(e.start), end: new Date(e.end) };
}

/** Shown in the all-day row: all-day events and timed events of 24 hours or more. */
export function isAllDayLike(e: CalEvent): boolean {
  if (e.allDay) return true;
  const { start, end } = bounds(e);
  return end.getTime() - start.getTime() >= DAY_MIN * 60_000;
}

function overlapsDay(e: CalEvent, day: Date): boolean {
  const { start, end } = bounds(e);
  const s = startOfDay(day);
  const next = addDays(s, 1);
  return start < next && (end > s || (end.getTime() === start.getTime() && start >= s));
}

/** Clock minutes (what the grid's hour labels show), so DST days line up too. */
const clockMinutes = (t: Date): number => t.getHours() * 60 + t.getMinutes();

export function timedBlocksForDay(events: CalEvent[], day: Date): TimedBlock[] {
  const s = startOfDay(day);
  const next = addDays(s, 1);
  const items = events
    .filter((e) => !isAllDayLike(e) && overlapsDay(e, s))
    .map((e) => {
      const { start, end } = bounds(e);
      const top = start <= s ? 0 : clockMinutes(start);
      const bottom = end >= next ? DAY_MIN : Math.max(top, clockMinutes(end));
      return { event: e, top, end: bottom, height: Math.max(MIN_HEIGHT, bottom - top) };
    })
    .sort((a, b) => a.top - b.top || b.end - a.end);

  const out: TimedBlock[] = [];
  let cluster: { item: (typeof items)[number]; col: number }[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const c of cluster) out.push({ event: c.item.event, top: c.item.top, height: c.item.height, col: c.col, cols: colEnds.length });
    cluster = [];
    colEnds = [];
  };
  for (const item of items) {
    const visualEnd = item.top + item.height;
    if (cluster.length && item.top >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= item.top);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(visualEnd);
    } else colEnds[col] = visualEnd;
    cluster.push({ item, col });
    clusterEnd = Math.max(cluster.length === 1 ? 0 : clusterEnd, visualEnd);
  }
  flush();
  return out;
}

export function allDayFor(events: CalEvent[], days: Date[]): AllDayBar[] {
  const bars: AllDayBar[] = [];
  const rows: number[][] = []; // row → occupied columns
  const items = events
    .filter(isAllDayLike)
    .map((event) => {
      const cols = days.map((d, i) => (overlapsDay(event, d) ? i : -1)).filter((i) => i >= 0);
      return { event, cols };
    })
    .filter((x) => x.cols.length > 0)
    .sort((a, b) => a.cols[0] - b.cols[0] || b.cols.length - a.cols.length);
  for (const { event, cols } of items) {
    const startCol = cols[0];
    const span = cols[cols.length - 1] - startCol + 1;
    let row = rows.findIndex((used) => !used.some((c) => c >= startCol && c < startCol + span));
    if (row === -1) {
      row = rows.length;
      rows.push([]);
    }
    for (let c = startCol; c < startCol + span; c++) rows[row].push(c);
    bars.push({ event, startCol, span, row });
  }
  return bars;
}

/** Events on one month-grid day: all-day-like first, then by start; "+N more" uses the last row. */
export function monthCell(events: CalEvent[], day: Date, maxRows: number): { shown: CalEvent[]; more: number } {
  const list = events
    .filter((e) => overlapsDay(e, day))
    .sort((a, b) => Number(isAllDayLike(b)) - Number(isAllDayLike(a)) || bounds(a).start.getTime() - bounds(b).start.getTime());
  if (list.length <= maxRows) return { shown: list, more: 0 };
  return { shown: list.slice(0, maxRows - 1), more: list.length - (maxRows - 1) };
}

export function eventTimes(e: CalEvent): { start: Date; end: Date } {
  return bounds(e);
}
