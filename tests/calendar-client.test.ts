import { createCalendarFetcher, type FetcherIO } from '../src/main/calendar/fetcher';

const KEY1 = 'AIza' + '1'.repeat(35);
const KEY2 = 'AIza' + '2'.repeat(35);
const PAGE = 'https://calendar.google.com/calendar/u/0/r';
const LIST = 'https://clients6.google.com/calendar/v3/users/me/calendarList';
const API = 'https://clients6.google.com/calendar/v3';

interface Call {
  url: string;
  method: string;
  body?: string;
}
type Reply = { status: number; body?: unknown } | Error;

function fake(route: (url: URL, method: string, body?: string) => Reply | undefined) {
  const calls: Call[] = [];
  const io: FetcherIO = {
    async fetch(_a, url, _h, _s, init) {
      const method = init?.method ?? 'GET';
      calls.push({ url, method, body: init?.body });
      const r = route(new URL(url), method, init?.body);
      if (!r) return { status: 404, text: async () => '' };
      if (r instanceof Error) throw r;
      return { status: r.status, text: async () => (r.body === undefined ? '' : JSON.stringify(r.body)) };
    },
    cookie: async () => 'SAP',
    now: () => 1_700_000_000_000,
  };
  return { io, calls };
}

const base = (u: URL): Reply | undefined => {
  if (u.href.startsWith(PAGE)) return { status: 200, body: `${KEY1} ${KEY2}` };
  if (u.href.startsWith(LIST)) return u.searchParams.get('key') === KEY2 ? { status: 200, body: { items: [] } } : { status: 403 };
  return undefined;
};

describe('calendar API request (writes)', () => {
  test('sends the method and the JSON body, with the key that works', async () => {
    const { io, calls } = fake((u, m) => (u.pathname.endsWith('/events') && m === 'POST' ? { status: 200, body: { id: 'e1' } } : base(u)));
    const r = await createCalendarFetcher(io).request('a', 'POST', '/calendars/primary/events', { sendUpdates: 'none' }, { summary: 'X' });
    expect(r).toEqual({ ok: true, status: 200, json: { id: 'e1' } });
    const post = calls.find((c) => c.method === 'POST')!;
    expect(post.url.startsWith(`${API}/calendars/primary/events?`)).toBe(true);
    expect(new URL(post.url).searchParams.get('key')).toBe(KEY2);
    expect(new URL(post.url).searchParams.get('sendUpdates')).toBe('none');
    expect(JSON.parse(post.body!)).toEqual({ summary: 'X' });
  });

  test('reuses the key found while reading (no second page fetch)', async () => {
    const { io, calls } = fake((u, m) => (m === 'DELETE' ? { status: 204 } : u.pathname.includes('/calendars/') ? { status: 200, body: { items: [] } } : base(u)));
    const f = createCalendarFetcher(io);
    await f.fetchAccount('a', { start: '2026-11-16T00:00:00.000Z', end: '2026-11-23T00:00:00.000Z' });
    const pages = calls.filter((c) => c.url.startsWith(PAGE)).length;
    const r = await f.request('a', 'DELETE', '/calendars/primary/events/e1');
    expect(r).toEqual({ ok: true, status: 204, json: null });
    expect(calls.filter((c) => c.url.startsWith(PAGE)).length).toBe(pages);
  });

  test('encodes path segments safely is the caller’s job; query values are encoded', async () => {
    const { io, calls } = fake((u, m) => (m === 'GET' && u.pathname.includes('/events/') ? { status: 200, body: {} } : base(u)));
    await createCalendarFetcher(io).request('a', 'GET', '/calendars/primary/events/e1', { q: 'a&b' });
    const get = calls.find((c) => c.url.includes('/events/e1'))!;
    expect(new URL(get.url).searchParams.get('q')).toBe('a&b');
  });

  test('classifies failures and never throws', async () => {
    const run = async (reply: Reply) => {
      const { io } = fake((u, m) => (m === 'PATCH' ? reply : base(u)));
      return createCalendarFetcher(io, { timeoutMs: 20 }).request('a', 'PATCH', '/calendars/primary/events/e1', undefined, {});
    };
    expect(await run({ status: 401 })).toMatchObject({ ok: false, state: 'signed-out' });
    expect(await run({ status: 403, body: { error: { message: 'The user does not have permission' } } })).toMatchObject({ ok: false, state: 'forbidden' });
    expect(await run({ status: 404 })).toMatchObject({ ok: false, state: 'error', status: 404 });
    expect(await run(new Error('net'))).toMatchObject({ ok: false, state: 'offline' });
  });

  test('a key blocked for writes is replaced once', async () => {
    let posts = 0;
    const { io } = fake((u, m) => {
      if (m === 'POST') {
        posts++;
        return u.searchParams.get('key') === KEY2 && posts === 1
          ? { status: 403, body: { error: { message: 'Requests to this API calendar method calendar.v3.Events.Insert are blocked.' } } }
          : { status: 200, body: { id: 'ok' } };
      }
      return base(u);
    });
    const r = await createCalendarFetcher(io).request('a', 'POST', '/calendars/primary/events', undefined, {});
    expect(r).toMatchObject({ ok: true, json: { id: 'ok' } });
  });
});
