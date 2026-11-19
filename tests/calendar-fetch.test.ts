import { createCalendarFetcher, type FetcherIO } from '../src/main/calendar/fetcher';
import { createCalendarService } from '../src/main/calendar/service';
import type { CalEvent, CalendarRange } from '../src/shared/types';

const KEY1 = 'AIza' + '1'.repeat(35);
const KEY2 = 'AIza' + '2'.repeat(35);
const RANGE: CalendarRange = { start: '2026-11-16T00:00:00.000Z', end: '2026-11-23T00:00:00.000Z' };
const PAGE = 'https://calendar.google.com/calendar/u/0/r';
const LIST = 'https://clients6.google.com/calendar/v3/users/me/calendarList';
const events = (cal: string) => `https://clients6.google.com/calendar/v3/calendars/${cal}/events`;

type Reply = { status: number; body?: unknown } | Error;
type Route = (url: URL) => Reply | undefined;

function fakeIO(route: Route, cookie: string | null = 'SAP') {
  const calls: string[] = [];
  const io: FetcherIO = {
    async fetch(_account, url) {
      calls.push(url);
      const r = route(new URL(url));
      if (!r) return { status: 404, text: async () => '' };
      if (r instanceof Error) throw r;
      return { status: r.status, text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {})) };
    },
    cookie: async () => cookie,
    now: () => 1_700_000_000_000,
  };
  return { io, calls };
}

const item = (id: string, start = '2026-11-18T10:00:00Z') => ({
  id,
  summary: 'T',
  start: { dateTime: start },
  end: { dateTime: '2026-11-18T23:00:00Z' },
});

/** A healthy account: page with KEY1, calendarList with `cals`, each calendar with one event. */
function healthy(cals = ['primary']): Route {
  return (u) => {
    if (u.href.startsWith(PAGE)) return { status: 200, body: `<script>var k="${KEY1}"</script>` };
    if (u.href.startsWith(LIST)) return { status: 200, body: { items: cals.map((id) => ({ id, selected: true })) } };
    for (const c of cals) if (u.href.startsWith(events(c))) return { status: 200, body: { items: [item(`${c}-e`)] } };
    return undefined;
  };
}

describe('fetcher', () => {
  test('signed out when there is no SAPISID cookie (no requests made)', async () => {
    const { io, calls } = fakeIO(healthy(), null);
    const r = await createCalendarFetcher(io).fetchAccount('a', RANGE);
    expect(r.status).toEqual({ accountId: 'a', state: 'signed-out' });
    expect(calls).toEqual([]);
  });

  test('tries keys in order and keeps the first that calendarList accepts', async () => {
    const { io, calls } = fakeIO((u) => {
      if (u.href.startsWith(PAGE)) return { status: 200, body: `${KEY1} ${KEY2}` };
      if (u.href.startsWith(LIST)) return u.searchParams.get('key') === KEY1 ? { status: 403 } : { status: 200, body: { items: [{ id: 'primary', selected: true }] } };
      if (u.href.startsWith(events('primary'))) return { status: 200, body: { items: [item('x')] } };
      return undefined;
    });
    const f = createCalendarFetcher(io);
    const first = await f.fetchAccount('a', RANGE);
    expect(first.status.state).toBe('ok');
    expect(first.events.map((e) => e.id)).toEqual(['a:x']);
    const before = calls.filter((c) => c.startsWith(PAGE)).length;
    await f.fetchAccount('a', RANGE);
    expect(calls.filter((c) => c.startsWith(PAGE)).length).toBe(before);
    expect(calls.filter((c) => c.startsWith(LIST)).at(-1)).toContain(`key=${KEY2}`);
  });

  test('rediscovers the key once when a kept key is refused', async () => {
    let refuse = false;
    const base = healthy();
    const { io, calls } = fakeIO((u) => {
      if (refuse && u.href.startsWith(LIST) && calls.filter((c) => c.startsWith(LIST)).length === 2) return { status: 403 };
      return base(u);
    });
    const f = createCalendarFetcher(io);
    await f.fetchAccount('a', RANGE);
    refuse = true;
    const r = await f.fetchAccount('a', RANGE);
    expect(r.status.state).toBe('ok');
    expect(calls.filter((c) => c.startsWith(PAGE)).length).toBe(2);
  });

  test('401 on calendarList is signed-out', async () => {
    const { io } = fakeIO((u) => (u.href.startsWith(PAGE) ? { status: 200, body: KEY1 } : u.href.startsWith(LIST) ? { status: 401 } : undefined));
    expect((await createCalendarFetcher(io).fetchAccount('a', RANGE)).status.state).toBe('signed-out');
  });

  test('follows nextPageToken across pages', async () => {
    const base = healthy();
    const { io } = fakeIO((u) => {
      if (u.href.startsWith(events('primary'))) {
        return u.searchParams.get('pageToken') === 'P2'
          ? { status: 200, body: { items: [item('second')] } }
          : { status: 200, body: { items: [item('first')], nextPageToken: 'P2' } };
      }
      return base(u);
    });
    const r = await createCalendarFetcher(io).fetchAccount('a', RANGE);
    expect(r.events.map((e) => e.id)).toEqual(['a:first', 'a:second']);
  });

  test('stops after 10 pages', async () => {
    const base = healthy();
    let n = 0;
    const { io } = fakeIO((u) => {
      if (u.href.startsWith(events('primary'))) return { status: 200, body: { items: [item(`p${n++}`)], nextPageToken: 'more' } };
      return base(u);
    });
    const r = await createCalendarFetcher(io).fetchAccount('a', RANGE);
    expect(r.events).toHaveLength(10);
  });

  test('one failing calendar is skipped, the other’s events are returned', async () => {
    const base = healthy(['good', 'bad']);
    const { io } = fakeIO((u) => (u.href.startsWith(events('bad')) ? { status: 500 } : base(u)));
    const r = await createCalendarFetcher(io).fetchAccount('a', RANGE);
    expect(r.status.state).toBe('ok');
    expect(r.events.map((e) => e.id)).toEqual(['a:good-e']);
  });

  test('every calendar failing is error', async () => {
    const base = healthy(['bad']);
    const { io } = fakeIO((u) => (u.href.startsWith(events('bad')) ? { status: 500 } : base(u)));
    expect((await createCalendarFetcher(io).fetchAccount('a', RANGE)).status.state).toBe('error');
  });

  test('the same event on two calendars appears once, from the primary calendar', async () => {
    const { io } = fakeIO((u) => {
      if (u.href.startsWith(PAGE)) return { status: 200, body: KEY1 };
      if (u.href.startsWith(LIST)) return { status: 200, body: { items: [{ id: 'team', selected: true }, { id: 'me', selected: true, primary: true }] } };
      const shared = (status: string) => ({ ...item('shared'), attendees: [{ self: true, responseStatus: status }] });
      if (u.href.startsWith(events('me'))) return { status: 200, body: { items: [shared('accepted')] } };
      if (u.href.startsWith(events('team'))) return { status: 200, body: { items: [shared('needsAction'), item('team-only')] } };
      return undefined;
    });
    const r = await createCalendarFetcher(io).fetchAccount('a', RANGE);
    expect(r.events.map((e) => e.id).sort()).toEqual(['a:shared', 'a:team-only']);
    expect(r.events.find((e) => e.id === 'a:shared')!.response).toBe('accepted');
  });

  test('a request that never answers times out as offline', async () => {
    const io: FetcherIO = {
      fetch: (_a, _u, _h, signal) =>
        new Promise((_, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted')))),
      cookie: async () => 'SAP',
      now: () => 1_700_000_000_000,
    };
    const r = await createCalendarFetcher(io, { timeoutMs: 20 }).fetchAccount('a', RANGE);
    expect(r.status.state).toBe('offline');
  });

  test('network error is offline', async () => {
    const { io } = fakeIO(() => new Error('net::ERR_INTERNET_DISCONNECTED'));
    expect((await createCalendarFetcher(io).fetchAccount('a', RANGE)).status.state).toBe('offline');
  });

  test('page without keys is error', async () => {
    const { io } = fakeIO((u) => (u.href.startsWith(PAGE) ? { status: 200, body: '<html></html>' } : undefined));
    expect((await createCalendarFetcher(io).fetchAccount('a', RANGE)).status.state).toBe('error');
  });

  test('bad JSON is error', async () => {
    const base = healthy();
    const { io } = fakeIO((u) => (u.href.startsWith(LIST) ? { status: 200, body: 'not json{' } : base(u)));
    expect((await createCalendarFetcher(io).fetchAccount('a', RANGE)).status.state).toBe('error');
  });

  test('sends the SAPISIDHASH header', async () => {
    const seen: (Record<string, string> | undefined)[] = [];
    const { io } = fakeIO(healthy());
    const wrapped: FetcherIO = { ...io, fetch: (a, url, h) => (seen.push(h), io.fetch(a, url, h)) };
    await createCalendarFetcher(wrapped).fetchAccount('a', RANGE);
    expect(seen.some((h) => h?.Authorization?.startsWith('SAPISIDHASH 1700000000_'))).toBe(true);
  });
});

describe('service', () => {
  const ev = (accountId: string, start: string): CalEvent => ({
    id: `${accountId}:${start}`,
    accountId,
    title: 'T',
    start,
    end: start,
    allDay: false,
    calendarId: 'c', eventId: 'e', editable: false, recurring: false, invited: false, response: 'none',
  });

  function setup(
    reply: (id: string) => { state: 'ok' | 'signed-out' | 'error' | 'offline'; events: CalEvent[] },
    opts: { accounts?: string[]; hidden?: string[] } = {},
  ) {
    let now = 0;
    const calls: string[] = [];
    const svc = createCalendarService({
      googleAccounts: () => opts.accounts ?? ['a', 'b'],
      hidden: () => opts.hidden ?? [],
      fetcher: {
        async fetchAccount(id) {
          calls.push(id);
          const r = reply(id);
          return { status: { accountId: id, state: r.state }, events: r.events };
        },
      },
      now: () => now,
    });
    return { svc, calls, tick: (ms: number) => (now += ms) };
  }

  test('second load within 60 s reuses the cache; force refetches', async () => {
    const { svc, calls, tick } = setup(() => ({ state: 'ok', events: [] }));
    await svc.load(RANGE, false);
    tick(30_000);
    await svc.load(RANGE, false);
    expect(calls).toEqual(['a', 'b']);
    await svc.load(RANGE, true);
    expect(calls).toEqual(['a', 'b', 'a', 'b']);
    tick(61_000);
    await svc.load(RANGE, false);
    expect(calls).toHaveLength(6);
  });

  test('hidden accounts are not fetched or returned', async () => {
    const { svc, calls } = setup(() => ({ state: 'ok', events: [] }), { hidden: ['b'] });
    const d = await svc.load(RANGE, false);
    expect(calls).toEqual(['a']);
    expect(d.status.map((s) => s.accountId)).toEqual(['a']);
  });

  test('a failing account does not hide the others’ events', async () => {
    const { svc } = setup((id) => (id === 'a' ? { state: 'error', events: [] } : { state: 'ok', events: [ev('b', '2026-11-18T09:00:00Z')] }));
    const d = await svc.load(RANGE, false);
    expect(d.events.map((e) => e.accountId)).toEqual(['b']);
    expect(d.status).toEqual([
      { accountId: 'a', state: 'error' },
      { accountId: 'b', state: 'ok' },
    ]);
  });

  test('a throwing fetcher becomes an error status', async () => {
    const svc = createCalendarService({
      googleAccounts: () => ['a'],
      hidden: () => [],
      fetcher: { fetchAccount: async () => Promise.reject(new Error('boom')) },
      now: () => 0,
    });
    expect((await svc.load(RANGE, false)).status).toEqual([{ accountId: 'a', state: 'error' }]);
  });

  test('offline keeps the last events', async () => {
    let offline = false;
    const { svc } = setup(() => (offline ? { state: 'offline', events: [] } : { state: 'ok', events: [ev('a', '2026-11-18T09:00:00Z')] }), {
      accounts: ['a'],
    });
    await svc.load(RANGE, false);
    offline = true;
    const d = await svc.load(RANGE, true);
    expect(d.events).toHaveLength(1);
    expect(d.status).toEqual([{ accountId: 'a', state: 'offline' }]);
  });

  test('events are sorted by start', async () => {
    const { svc } = setup((id) => ({ state: 'ok', events: id === 'a' ? [ev('a', '2026-11-18T12:00:00Z')] : [ev('b', '2026-11-18T08:00:00Z')] }));
    const d = await svc.load(RANGE, false);
    expect(d.events.map((e) => e.accountId)).toEqual(['b', 'a']);
  });

  test('invalidate makes the next load refetch that account only', async () => {
    const { svc, calls } = setup(() => ({ state: 'ok', events: [] }));
    await svc.load(RANGE, false);
    svc.invalidate('a');
    await svc.load(RANGE, false);
    expect(calls).toEqual(['a', 'b', 'a']);
  });
});

test('the assistant can load hidden accounts too', async () => {
  const calls: string[] = [];
  const svc = createCalendarService({
    googleAccounts: () => ['a', 'b'],
    hidden: () => ['b'],
    fetcher: { fetchAccount: async (id) => (calls.push(id), { status: { accountId: id, state: 'ok' }, events: [] }) },
    now: () => 0,
  });
  await svc.load(RANGE, false, { includeHidden: true });
  expect(calls).toEqual(['a', 'b']);
});
