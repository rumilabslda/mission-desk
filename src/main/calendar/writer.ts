import { randomUUID } from 'node:crypto';
import type { EditableEvent, EventDraft, Reply, SendUpdates, WritableCalendar, WriteError, WriteResult, WriteScope } from '../../shared/types';
import { draftToBody, shiftSeries, toEditable, wallDelta, writableCalendars } from './editable';
import type { ApiMethod, ApiResult } from './fetcher';
import { meetUrlOf } from './normalize';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export interface CalendarApi {
  request(accountId: string, method: ApiMethod, path: string, query?: Record<string, string>, body?: unknown): Promise<ApiResult>;
}

const enc = encodeURIComponent;
const eventPath = (calendarId: string, eventId: string): string => `/calendars/${enc(calendarId)}/events/${enc(eventId)}`;
const fail = (r: ApiResult): { ok: false; error: WriteError } => ({ ok: false, error: r.ok ? 'error' : r.state });
const times = (item: Obj): { allDay: boolean; start: string; end: string } => {
  const s = isObj(item.start) ? item.start : {};
  const e = isObj(item.end) ? item.end : {};
  return s.date ? { allDay: true, start: str(s.date), end: str(e.date) } : { allDay: false, start: str(s.dateTime), end: str(e.dateTime) };
};
const timeField = (allDay: boolean, value: string) => (allDay ? { date: value, dateTime: null } : { dateTime: value, date: null });
const badId = (...ids: string[]): boolean => ids.some((id) => !id || /^\.+$/.test(id));
const BAD: { ok: false; error: WriteError } = { ok: false, error: 'error' };
const UNSUPPORTED: { ok: false; error: WriteError } = { ok: false, error: 'unsupported' };
/** Where an occurrence was before any change made to it alone (for "All events" maths). */
const originalTimes = (item: Obj): { start: string; end: string } => {
  const t = times(item);
  const o = isObj(item.originalStartTime) ? item.originalStartTime : null;
  const start = o ? str(o.dateTime) || str(o.date) : '';
  return start ? { start, end: t.end } : t;
};
const QUICK_CALL_MS = 30 * 60_000;
const MEET_POLLS = 5;
const MEET_POLL_MS = 600;
const DAY_RULES = /BY(DAY|MONTHDAY|YEARDAY|WEEKNO|SETPOS)=/;
/** A day change for a series whose rule names weekdays or dates would leave the rule behind. */
function seriesChangeUnsupported(series: Obj, before: { start: string }, after: { start: string; allDay: boolean }): boolean {
  if (times(series).allDay !== after.allDay) return true; // switching all-day for a whole series
  const rules = Array.isArray(series.recurrence) ? series.recurrence.map(str).join(';') : '';
  const days = after.allDay
    ? Math.round((Date.parse(`${after.start}T00:00:00Z`) - Date.parse(`${before.start.slice(0, 10)}T00:00:00Z`)) / 86_400_000)
    : wallDelta(before.start, after.start).days;
  return days !== 0 && DAY_RULES.test(rules);
}

/** Writes to an account's Google Calendar. Never throws. */
export function createCalendarWriter(
  api: CalendarApi,
  opts: { requestId?: () => string; now?: () => Date; sleep?: (ms: number) => Promise<void> } = {},
) {
  const requestId = opts.requestId ?? (() => randomUUID());
  const now = opts.now ?? (() => new Date());
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  async function read(accountId: string, calendarId: string, eventId: string): Promise<Obj | { ok: false; error: WriteError }> {
    const r = await api.request(accountId, 'GET', eventPath(calendarId, eventId));
    return r.ok && isObj(r.json) ? r.json : fail(r);
  }
  const isFailure = (v: unknown): v is { ok: false; error: WriteError } => isObj(v) && v.ok === false;
  const done = (r: ApiResult): WriteResult => (r.ok ? { ok: true } : fail(r));

  /** The event a change applies to: the instance, or for "all" its series. */
  async function target(accountId: string, calendarId: string, eventId: string, scope: WriteScope) {
    const instance = await read(accountId, calendarId, eventId);
    if (isFailure(instance)) return instance;
    const seriesId = str(instance.recurringEventId);
    if (scope !== 'all' || !seriesId) return { instance, item: instance, id: eventId };
    const series = await read(accountId, calendarId, seriesId);
    if (isFailure(series)) return series;
    return { instance, item: series, id: seriesId };
  }

  const api_ = {
    async calendars(accountId: string): Promise<{ ok: true; calendars: WritableCalendar[] } | { ok: false; error: WriteError }> {
      const r = await api.request(accountId, 'GET', '/users/me/calendarList');
      if (!r.ok || !isObj(r.json)) return fail(r);
      return { ok: true, calendars: writableCalendars(Array.isArray(r.json.items) ? r.json.items : []) };
    },

    async getEvent(accountId: string, calendarId: string, eventId: string): Promise<{ ok: true; event: EditableEvent } | { ok: false; error: WriteError }> {
      if (badId(calendarId, eventId)) return BAD;
      const cal = await api.request(accountId, 'GET', `/users/me/calendarList/${enc(calendarId)}`);
      const item = await read(accountId, calendarId, eventId);
      if (isFailure(item)) return item;
      const accessRole = cal.ok && isObj(cal.json) ? str(cal.json.accessRole) : 'reader';
      return { ok: true, event: toEditable(item, { id: calendarId, accessRole }) };
    },

    async create(accountId: string, draft: EventDraft, sendUpdates: SendUpdates): Promise<WriteResult> {
      if (badId(draft.calendarId)) return BAD;
      const body = draftToBody(draft, { hadMeet: false, requestId: requestId() });
      return done(
        await api.request(accountId, 'POST', `/calendars/${enc(draft.calendarId)}/events`, { conferenceDataVersion: '1', sendUpdates }, body),
      );
    },

    /** Saves the editor's draft over an event (`draft.calendarId` is the event's calendar). */
    async update(accountId: string, eventId: string, draft: EventDraft, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult> {
      if (badId(draft.calendarId, eventId)) return BAD;
      const t = await target(accountId, draft.calendarId, eventId, scope);
      if (isFailure(t)) return t;
      let next = draft;
      if (t.item !== t.instance) {
        const before = originalTimes(t.instance);
        if (seriesChangeUnsupported(t.item, before, draft)) return UNSUPPORTED;
        next = { ...draft, ...shiftSeries(times(t.item), before, draft) };
      }
      const body = draftToBody(next, {
        hadMeet: !!meetUrlOf(t.item),
        requestId: requestId(),
        existingAttendees: Array.isArray(t.item.attendees) ? t.item.attendees : [],
      });
      return done(
        await api.request(accountId, 'PATCH', eventPath(draft.calendarId, t.id), { conferenceDataVersion: '1', sendUpdates }, body),
      );
    },

    /** A drag: only the times change. */
    async moveTimes(
      accountId: string,
      calendarId: string,
      eventId: string,
      start: string,
      end: string,
      allDay: boolean,
      scope: WriteScope,
    ): Promise<WriteResult> {
      if (badId(calendarId, eventId)) return BAD;
      const t = await target(accountId, calendarId, eventId, scope);
      if (isFailure(t)) return t;
      let next = { start, end };
      if (t.item !== t.instance) {
        const before = originalTimes(t.instance);
        if (seriesChangeUnsupported(t.item, before, { start, allDay })) return UNSUPPORTED;
        next = shiftSeries(times(t.item), before, { start, end });
      }
      const body = { start: timeField(allDay, next.start), end: timeField(allDay, next.end) };
      return done(await api.request(accountId, 'PATCH', eventPath(calendarId, t.id), { sendUpdates: 'none' }, body));
    },

    async remove(accountId: string, calendarId: string, eventId: string, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult> {
      if (badId(calendarId, eventId)) return BAD;
      let id = eventId;
      if (scope === 'all') {
        const t = await target(accountId, calendarId, eventId, scope);
        if (isFailure(t)) return t;
        id = t.id;
      }
      return done(await api.request(accountId, 'DELETE', eventPath(calendarId, id), { sendUpdates }));
    },

    /** Replies to an invitation: only the user's own attendee entry changes. */
    async respond(accountId: string, calendarId: string, eventId: string, reply: Reply): Promise<WriteResult> {
      if (badId(calendarId, eventId)) return BAD;
      const item = await read(accountId, calendarId, eventId);
      if (isFailure(item)) return item;
      const attendees = Array.isArray(item.attendees) ? item.attendees.filter(isObj) : [];
      if (!attendees.some((a) => a.self === true)) return { ok: false, error: 'error' };
      const body = { attendees: attendees.map((a) => (a.self === true ? { ...a, responseStatus: reply } : a)) };
      return done(await api.request(accountId, 'PATCH', eventPath(calendarId, eventId), { sendUpdates: 'none' }, body));
    },

    /**
     * A Google Meet link to paste anywhere: a 30-minute "Quick call" from now on the primary
     * calendar (the event keeps the link alive), with no guests and no invitations sent.
     */
    async quickMeet(accountId: string): Promise<{ ok: true; url: string } | { ok: false; error: WriteError }> {
      const start = now();
      const body = {
        summary: 'Quick call',
        start: { dateTime: start.toISOString() },
        end: { dateTime: new Date(start.getTime() + QUICK_CALL_MS).toISOString() },
        conferenceData: { createRequest: { requestId: requestId(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      };
      const r = await api.request(accountId, 'POST', '/calendars/primary/events', { conferenceDataVersion: '1', sendUpdates: 'none' }, body);
      if (!r.ok || !isObj(r.json)) return fail(r);
      let item: Obj = r.json;
      const id = str(item.id);
      // Google can still be preparing the Meet ("pending"): ask again a few times.
      for (let i = 0; !meetUrlOf(item) && id && i < MEET_POLLS; i++) {
        await sleep(MEET_POLL_MS);
        const next = await read(accountId, 'primary', id);
        if (isFailure(next)) return next;
        item = next;
      }
      const url = meetUrlOf(item);
      return url ? { ok: true, url } : BAD;
    },

    /** Moves an event to another calendar of the same account. */
    async changeCalendar(accountId: string, fromCalendarId: string, eventId: string, toCalendarId: string): Promise<WriteResult> {
      if (badId(fromCalendarId, eventId, toCalendarId)) return BAD;
      return done(await api.request(accountId, 'POST', `${eventPath(fromCalendarId, eventId)}/move`, { destination: toCalendarId }));
    },
  };
  // Never throw: a bug or an odd reply becomes a plain error the UI can show.
  const safe = {} as typeof api_;
  for (const [name, fn] of Object.entries(api_) as [keyof typeof api_, (...a: unknown[]) => Promise<unknown>][]) {
    (safe as Record<string, unknown>)[name] = async (...args: unknown[]) => {
      try {
        return await fn(...args);
      } catch {
        return BAD;
      }
    };
  }
  return safe;
}
export type CalendarWriter = ReturnType<typeof createCalendarWriter>;
