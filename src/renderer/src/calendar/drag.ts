/** Pure maths for creating, moving and resizing events in the time grid (local time). */

export const SNAP_MIN = 15;
const DAY_MIN = 24 * 60;

const at = (day: Date, minutes: number): Date => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
const snap = (minutes: number): number => Math.round(minutes / SNAP_MIN) * SNAP_MIN;

/** Minutes from midnight under a y offset (px), snapped down to 15 and kept inside the day. */
export function minutesAt(y: number, pxPerMin: number): number {
  const m = Math.floor(y / pxPerMin / SNAP_MIN) * SNAP_MIN;
  return Math.max(0, Math.min(DAY_MIN - SNAP_MIN, m));
}

/** A click (a === b) makes one hour; a drag covers both slots. */
export function createRange(day: Date, a: number, b: number): { start: Date; end: Date } {
  if (a === b) return { start: at(day, a), end: at(day, a + 60) };
  return { start: at(day, Math.min(a, b)), end: at(day, Math.max(a, b) + SNAP_MIN) };
}

/** Moves an event by a snapped number of minutes and whole days, keeping its duration. */
export function moveBy(start: Date, end: Date, deltaMinutes: number, deltaDays: number): { start: Date; end: Date } {
  const d = snap(deltaMinutes);
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate() + deltaDays, start.getHours(), start.getMinutes() + d);
  return { start: s, end: new Date(s.getTime() + (end.getTime() - start.getTime())) };
}

/** A new end after dragging the bottom edge: at least 15 minutes after the start. */
export function resizeTo(start: Date, end: Date, deltaMinutes: number): Date {
  const e = new Date(end.getTime() + snap(deltaMinutes) * 60_000);
  const min = new Date(start.getTime() + SNAP_MIN * 60_000);
  return e < min ? min : e;
}

export const isDrag = (dx: number, dy: number): boolean => Math.hypot(dx, dy) >= 4;

export interface EditorFields {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const dateField = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeField = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const addDays = (s: string, n: number): string => {
  const d = parseDate(s)!;
  return dateField(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

/** Event times → the editor's date and time fields (all-day end shown as its last day). */
export function editorFields(allDay: boolean, start: string, end: string): EditorFields {
  if (allDay) return { startDate: start, startTime: '09:00', endDate: addDays(end, -1), endTime: '10:00' };
  const s = new Date(start);
  const e = new Date(end);
  return { startDate: dateField(s), startTime: timeField(s), endDate: dateField(e), endTime: timeField(e) };
}

/** The editor's fields → draft times, or null if they don't make a valid range. */
export function draftTimes(allDay: boolean, f: EditorFields): { start: string; end: string } | null {
  const sd = parseDate(f.startDate);
  const ed = parseDate(f.endDate);
  if (!sd || !ed) return null;
  if (allDay) return ed < sd ? null : { start: f.startDate, end: addDays(f.endDate, 1) };
  const [sh, sm] = f.startTime.split(':').map(Number);
  const [eh, em] = f.endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => !Number.isFinite(n))) return null;
  const s = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), sh, sm);
  const e = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), eh, em);
  return e <= s ? null : { start: s.toISOString(), end: e.toISOString() };
}
