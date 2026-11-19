import type { EditableEvent, EventDraft, WritableCalendar } from '../../shared/types';
import { meetUrlOf, WRITABLE_ROLES } from './normalize';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Calendars of an account the user can write to, primary first. */
export function writableCalendars(items: unknown[]): WritableCalendar[] {
  return items
    .filter(isObj)
    .filter((c) => !!str(c.id) && c.deleted !== true && WRITABLE_ROLES.has(str(c.accessRole)))
    .sort((a, b) => Number(b.primary === true) - Number(a.primary === true))
    .map((c) => ({ id: str(c.id), name: str(c.summaryOverride) || str(c.summary) || str(c.id), primary: c.primary === true }));
}

function when(v: unknown): { value: string; allDay: boolean } {
  if (!isObj(v)) return { value: '', allDay: false };
  return v.date ? { value: str(v.date), allDay: true } : { value: str(v.dateTime), allDay: false };
}

const selfIsOrganizer = (item: Obj): boolean => !isObj(item.organizer) || item.organizer.self === true;

/** An API event → what the editor needs (guests without the user and without rooms). */
export function toEditable(item: Obj, calendar: { id: string; accessRole: string }): EditableEvent {
  const start = when(item.start);
  const end = when(item.end);
  const attendees = Array.isArray(item.attendees) ? item.attendees.filter(isObj) : [];
  const meetUrl = meetUrlOf(item);
  const event: EditableEvent = {
    calendarId: calendar.id,
    eventId: str(item.id),
    title: str(item.summary),
    allDay: start.allDay,
    start: start.value,
    end: end.value,
    location: str(item.location),
    description: str(item.description),
    guests: attendees.filter((a) => a.self !== true && a.resource !== true && !!str(a.email)).map((a) => str(a.email)),
    meet: !!meetUrl,
    editable: WRITABLE_ROLES.has(calendar.accessRole) && (selfIsOrganizer(item) || item.guestsCanModify === true),
  };
  if (str(item.recurringEventId)) event.seriesId = str(item.recurringEventId);
  if (meetUrl) event.meetUrl = meetUrl;
  return event;
}

const timeField = (allDay: boolean, value: string) => (allDay ? { date: value, dateTime: null } : { dateTime: value, date: null });

/**
 * A draft → the API body. Existing attendees keep their entries (and replies);
 * Meet is added or removed only when it changed.
 */
export function draftToBody(
  draft: EventDraft,
  opts: { hadMeet: boolean; requestId: string; existingAttendees?: unknown[] },
): Record<string, unknown> {
  const keep = (opts.existingAttendees ?? []).filter(isObj);
  const wanted = new Set(draft.guests.map((g) => g.toLowerCase()));
  // The user's own entry and booked rooms are always kept; other guests follow the draft.
  const attendees: Obj[] = keep.filter((a) => a.self === true || a.resource === true || wanted.has(str(a.email).toLowerCase()));
  const have = new Set(attendees.map((a) => str(a.email).toLowerCase()));
  for (const g of draft.guests) if (!have.has(g.toLowerCase())) attendees.push({ email: g });
  const body: Record<string, unknown> = {
    summary: draft.title,
    location: draft.location,
    description: draft.description,
    start: timeField(draft.allDay, draft.start),
    end: timeField(draft.allDay, draft.end),
    attendees,
  };
  if (draft.meet && !opts.hadMeet) {
    body.conferenceData = { createRequest: { requestId: opts.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  } else if (!draft.meet && opts.hadMeet) {
    body.conferenceData = null;
  }
  return body;
}

const DAY = 86_400_000;
const dayMs = (d: string): number => Date.parse(`${d}T00:00:00Z`);
const dayStr = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Calendar-day and minute difference between two instants, in local wall-clock time (DST-safe). */
export function wallDelta(before: string, after: string): { days: number; minutes: number } {
  const b = new Date(before);
  const a = new Date(after);
  const days = Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / DAY);
  const minutes = a.getHours() * 60 + a.getMinutes() - (b.getHours() * 60 + b.getMinutes());
  return { days, minutes };
}

/**
 * "All events": the series moves by however much the instance moved (calendar
 * days and wall-clock minutes), and takes the instance's new duration, keeping
 * its own first date. Both sides must be all-day, or both timed.
 */
export function shiftSeries(
  series: { allDay: boolean; start: string; end: string },
  before: { start: string; end: string },
  after: { start: string; end: string },
): { start: string; end: string } {
  if (series.allDay) {
    const delta = dayMs(after.start) - dayMs(before.start);
    const length = dayMs(after.end) - dayMs(after.start);
    const start = dayMs(series.start) + Math.round(delta / DAY) * DAY;
    return { start: dayStr(start), end: dayStr(start + length) };
  }
  const { days, minutes } = wallDelta(before.start, after.start);
  const s = new Date(series.start);
  const start = new Date(s.getFullYear(), s.getMonth(), s.getDate() + days, s.getHours(), s.getMinutes() + minutes, s.getSeconds());
  const length = Date.parse(after.end) - Date.parse(after.start);
  return { start: start.toISOString(), end: new Date(start.getTime() + length).toISOString() };
}
