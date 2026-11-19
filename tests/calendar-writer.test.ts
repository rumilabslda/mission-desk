import type { ApiMethod, ApiResult } from '../src/main/calendar/fetcher';
import { createCalendarWriter } from '../src/main/calendar/writer';
import type { EventDraft } from '../src/shared/types';

interface Call {
  method: ApiMethod;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

function fakeApi(route: (c: Call) => ApiResult | undefined) {
  const calls: Call[] = [];
  const api = {
    async request(_a: string, method: ApiMethod, path: string, query?: Record<string, string>, body?: unknown): Promise<ApiResult> {
      const c = { method, path, query, body };
      calls.push(c);
      return route(c) ?? { ok: false, state: 'error', status: 404 };
    },
  };
  return { api, calls };
}
const ok = (json: Record<string, unknown> | null = {}): ApiResult => ({ ok: true, status: 200, json });

const draft = (extra: Partial<EventDraft> = {}): EventDraft => ({
  calendarId: 'primary',
  title: 'Sync',
  allDay: false,
  start: '2026-11-18T10:00:00.000Z',
  end: '2026-11-18T11:00:00.000Z',
  location: '',
  description: '',
  guests: [],
  meet: false,
  ...extra,
});

const instance = {
  id: 'inst_1',
  recurringEventId: 'series',
  summary: 'Weekly',
  start: { dateTime: '2026-11-18T09:00:00.000Z' },
  end: { dateTime: '2026-11-18T09:30:00.000Z' },
  organizer: { self: true },
  attendees: [
    { email: 'me@x', self: true, organizer: true, responseStatus: 'accepted' },
    { email: 'ana@y', responseStatus: 'accepted' },
  ],
};
const series = { ...instance, id: 'series', recurringEventId: undefined, start: { dateTime: '2026-11-02T09:00:00.000Z' }, end: { dateTime: '2026-11-02T09:30:00.000Z' } };

describe('calendar writer', () => {
  test('create posts the body with Meet and sendUpdates', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'POST' ? ok({ id: 'new' }) : undefined));
    const w = createCalendarWriter(api, { requestId: () => 'req' });
    expect(await w.create('a', draft({ meet: true, guests: ['ana@y'] }), 'all')).toEqual({ ok: true });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/calendars/primary/events',
      query: { conferenceDataVersion: '1', sendUpdates: 'all' },
    });
    expect(calls[0].body).toMatchObject({ summary: 'Sync', attendees: [{ email: 'ana@y' }], conferenceData: { createRequest: { requestId: 'req' } } });
  });

  test('update of one instance patches the instance and keeps replies', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(instance) : c.method === 'PATCH' ? ok() : undefined));
    const w = createCalendarWriter(api, { requestId: () => 'req' });
    await w.update('a', 'inst_1', draft({ guests: ['ana@y'] }), 'this', 'none');
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.path).toBe('/calendars/primary/events/inst_1');
    expect((patch.body as { attendees: unknown[] }).attendees).toEqual(instance.attendees);
  });

  test('"all events" patches the series, shifted by the instance’s move', async () => {
    const { api, calls } = fakeApi((c) =>
      c.method === 'GET' ? ok(c.path.endsWith('/series') ? series : instance) : c.method === 'PATCH' ? ok() : undefined,
    );
    const w = createCalendarWriter(api, { requestId: () => 'req' });
    await w.update('a', 'inst_1', draft({ start: '2026-11-18T10:00:00.000Z', end: '2026-11-18T11:00:00.000Z' }), 'all', 'none');
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.path).toBe('/calendars/primary/events/series');
    expect(patch.body).toMatchObject({
      start: { dateTime: '2026-11-02T10:00:00.000Z' },
      end: { dateTime: '2026-11-02T11:00:00.000Z' },
    });
  });

  test('moveTimes patches only the times', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok({ ...instance, recurringEventId: undefined }) : c.method === 'PATCH' ? ok() : undefined));
    const w = createCalendarWriter(api);
    await w.moveTimes('a', 'primary', 'inst_1', '2026-11-18T12:00:00.000Z', '2026-11-18T12:30:00.000Z', false, 'this');
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.body).toEqual({
      start: { dateTime: '2026-11-18T12:00:00.000Z', date: null },
      end: { dateTime: '2026-11-18T12:30:00.000Z', date: null },
    });
    expect(patch.query).toMatchObject({ sendUpdates: 'none' });
  });

  test('remove: one instance, or the whole series', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(instance) : c.method === 'DELETE' ? { ok: true, status: 204, json: null } : undefined));
    const w = createCalendarWriter(api);
    await w.remove('a', 'primary', 'inst_1', 'this', 'none');
    await w.remove('a', 'primary', 'inst_1', 'all', 'all');
    const deletes = calls.filter((c) => c.method === 'DELETE');
    expect(deletes.map((d) => d.path)).toEqual(['/calendars/primary/events/inst_1', '/calendars/primary/events/series']);
    expect(deletes[1].query).toMatchObject({ sendUpdates: 'all' });
  });

  test('respond changes only the user’s own reply', async () => {
    const invite = {
      ...instance,
      recurringEventId: undefined,
      organizer: { email: 'boss@y' },
      attendees: [
        { email: 'boss@y', organizer: true, responseStatus: 'accepted' },
        { email: 'me@x', self: true, responseStatus: 'needsAction' },
        { email: 'ana@y', responseStatus: 'declined', comment: 'away' },
      ],
    };
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(invite) : c.method === 'PATCH' ? ok() : undefined));
    expect(await createCalendarWriter(api).respond('a', 'primary', 'inst_1', 'tentative')).toEqual({ ok: true });
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.body).toEqual({
      attendees: [
        { email: 'boss@y', organizer: true, responseStatus: 'accepted' },
        { email: 'me@x', self: true, responseStatus: 'tentative' },
        { email: 'ana@y', responseStatus: 'declined', comment: 'away' },
      ],
    });
    expect(patch.query).toMatchObject({ sendUpdates: 'none' });
  });

  test('respond without an invitation for the user fails cleanly', async () => {
    const { api } = fakeApi((c) => (c.method === 'GET' ? ok({ ...instance, attendees: [] }) : undefined));
    expect(await createCalendarWriter(api).respond('a', 'primary', 'inst_1', 'accepted')).toEqual({ ok: false, error: 'error' });
  });

  test('ids are encoded in paths; failures map to errors, never throw', async () => {
    const { api, calls } = fakeApi(() => ({ ok: false, state: 'forbidden', status: 403 }));
    const w = createCalendarWriter(api);
    expect(await w.remove('a', 'team@group.calendar.google.com', 'a/b', 'this', 'none')).toEqual({ ok: false, error: 'forbidden' });
    expect(calls[0].path).toBe('/calendars/team%40group.calendar.google.com/events/a%2Fb');
  });

  test('calendars lists the writable ones; getEvent reads the event with its access', async () => {
    const { api } = fakeApi((c) => {
      if (c.path === '/users/me/calendarList') return ok({ items: [{ id: 'me', summary: 'Me', accessRole: 'owner', primary: true }, { id: 'h', summary: 'H', accessRole: 'reader' }] });
      if (c.path === '/users/me/calendarList/primary') return ok({ id: 'me', accessRole: 'owner' });
      if (c.path === '/calendars/primary/events/inst_1') return ok(instance);
      return undefined;
    });
    const w = createCalendarWriter(api);
    expect(await w.calendars('a')).toEqual({ ok: true, calendars: [{ id: 'me', name: 'Me', primary: true }] });
    const e = await w.getEvent('a', 'primary', 'inst_1');
    expect(e).toMatchObject({ ok: true, event: { eventId: 'inst_1', seriesId: 'series', guests: ['ana@y'], editable: true } });
  });

  test('changeCalendar uses Google’s move', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'POST' ? ok() : undefined));
    await createCalendarWriter(api).changeCalendar('a', 'primary', 'e1', 'team');
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/calendars/primary/events/e1/move', query: { destination: 'team' } });
  });

  test('"all events" measures the move from the occurrence’s original time (exceptions)', async () => {
    const moved = { ...instance, start: { dateTime: '2026-11-18T12:00:00.000Z' }, end: { dateTime: '2026-11-18T12:30:00.000Z' }, originalStartTime: { dateTime: '2026-11-18T09:00:00.000Z' } };
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(c.path.endsWith('/series') ? series : moved) : c.method === 'PATCH' ? ok() : undefined));
    await createCalendarWriter(api).moveTimes('a', 'primary', 'inst_1', '2026-11-18T13:00:00.000Z', '2026-11-18T13:30:00.000Z', false, 'all');
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.body).toMatchObject({ start: { dateTime: new Date(Date.parse('2026-11-02T09:00:00.000Z') + 4 * 3600_000).toISOString() } });
  });

  test('"all events" refuses a day change on rules tied to weekdays', async () => {
    const weekly = { ...series, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=WE'] };
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(c.path.endsWith('/series') ? weekly : instance) : c.method === 'PATCH' ? ok() : undefined));
    const r = await createCalendarWriter(api).moveTimes('a', 'primary', 'inst_1', '2026-11-19T09:00:00.000Z', '2026-11-19T09:30:00.000Z', false, 'all');
    expect(r).toEqual({ ok: false, error: 'unsupported' });
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  test('"all events" can change the time (not the day) of a weekday rule', async () => {
    const weekly = { ...series, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=WE'] };
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(c.path.endsWith('/series') ? weekly : instance) : c.method === 'PATCH' ? ok() : undefined));
    expect(await createCalendarWriter(api).moveTimes('a', 'primary', 'inst_1', '2026-11-18T10:00:00.000Z', '2026-11-18T10:30:00.000Z', false, 'all')).toEqual({ ok: true });
    expect(calls.some((c) => c.method === 'PATCH')).toBe(true);
  });

  test('"all events" refuses switching all-day on or off (never throws)', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'GET' ? ok(c.path.endsWith('/series') ? series : instance) : c.method === 'PATCH' ? ok() : undefined));
    const r = await createCalendarWriter(api).update('a', 'inst_1', draft({ allDay: true, start: '2026-11-18', end: '2026-11-19' }), 'all', 'none');
    expect(r).toEqual({ ok: false, error: 'unsupported' });
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  test('the writer refuses dot-only ids', async () => {
    const { api, calls } = fakeApi(() => ok());
    expect(await createCalendarWriter(api).remove('a', 'primary', '..', 'this', 'none')).toEqual({ ok: false, error: 'error' });
    expect(calls).toEqual([]);
  });
});
