import type { ApiMethod, ApiResult } from '../src/main/calendar/fetcher';
import { createCalendarWriter } from '../src/main/calendar/writer';
import { actionContext, googleAccountFor } from '../src/shared/spaces';
import type { Account } from '../src/shared/types';

interface Call {
  method: ApiMethod;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}
function fakeApi(route: (c: Call, n: number) => ApiResult | undefined) {
  const calls: Call[] = [];
  const api = {
    async request(_a: string, method: ApiMethod, path: string, query?: Record<string, string>, body?: unknown): Promise<ApiResult> {
      const c = { method, path, query, body };
      calls.push(c);
      return route(c, calls.length) ?? { ok: false, state: 'error', status: 404 };
    },
  };
  return { api, calls };
}
const ok = (json: Record<string, unknown>): ApiResult => ({ ok: true, status: 200, json });
const MEET = 'https://meet.google.com/abc-defg-hij';
const ready = { id: 'ev1', hangoutLink: MEET };
const pending = { id: 'ev1', conferenceData: { createRequest: { status: { statusCode: 'pending' } } } };
const NOW = new Date('2026-11-19T10:07:00.000Z');
const opts = { requestId: () => 'req', now: () => NOW, sleep: async () => {} };

describe('quick Meet', () => {
  test('creates a 30-minute "Quick call" with a Meet and no invitations, and returns the link', async () => {
    const { api, calls } = fakeApi((c) => (c.method === 'POST' ? ok(ready) : undefined));
    expect(await createCalendarWriter(api, opts).quickMeet('a')).toEqual({ ok: true, url: MEET });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/calendars/primary/events',
      query: { conferenceDataVersion: '1', sendUpdates: 'none' },
      body: {
        summary: 'Quick call',
        start: { dateTime: '2026-11-19T10:07:00.000Z' },
        end: { dateTime: '2026-11-19T10:37:00.000Z' },
        conferenceData: { createRequest: { requestId: 'req', conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      },
    });
  });

  test('waits for a Meet that Google is still preparing', async () => {
    const { api, calls } = fakeApi((c, n) => (c.method === 'POST' ? ok(pending) : c.method === 'GET' && c.path === '/calendars/primary/events/ev1' ? ok(n < 3 ? pending : ready) : undefined));
    expect(await createCalendarWriter(api, opts).quickMeet('a')).toEqual({ ok: true, url: MEET });
    expect(calls.filter((c) => c.method === 'GET')).toHaveLength(2);
  });

  test('gives up when the Meet never arrives', async () => {
    const { api } = fakeApi((c) => (c.method === 'POST' || c.method === 'GET' ? ok(pending) : undefined));
    expect(await createCalendarWriter(api, opts).quickMeet('a')).toEqual({ ok: false, error: 'error' });
  });

  test('passes on a signed-out account', async () => {
    const { api } = fakeApi(() => ({ ok: false, state: 'signed-out' }));
    expect(await createCalendarWriter(api, opts).quickMeet('a')).toEqual({ ok: false, error: 'signed-out' });
  });
});

describe('the Google account a meeting link comes from', () => {
  const acc = (id: string, service: Account['service'], spaceId?: string): Account => ({
    id, service, name: id, color: '#000000', muted: false, hibernateWhenIdle: false, ...(spaceId ? { spaceId } : {}),
  });
  const accounts = [acc('slack-w', 'slack', 'w'), acc('g-w', 'google', 'w'), acc('g-w2', 'google', 'w'), acc('g-me', 'google'), acc('slack-p', 'slack', 'p')];

  test('a Google account is its own', () => expect(googleAccountFor(accounts, [], { accountId: 'g-w2' })).toBe('g-w2'));
  test('another account uses the first Google account of its space', () => expect(googleAccountFor(accounts, [], { accountId: 'slack-w' })).toBe('g-w'));
  test('a space uses its first Google account', () => expect(googleAccountFor(accounts, [], { spaceId: 'w' })).toBe('g-w'));
  test("the space's chosen Google sign-in account wins", () => {
    expect(googleAccountFor(accounts, [{ id: 'w', googleAccountId: 'g-w2' }], { accountId: 'slack-w' })).toBe('g-w2');
    expect(googleAccountFor(accounts, [{ id: 'w', googleAccountId: 'gone' }], { spaceId: 'w' })).toBe('g-w');
  });
  test('a space without Google gives none', () => expect(googleAccountFor(accounts, [], { accountId: 'slack-p' })).toBeNull());
  test('an account outside any space that is not Google gives none', () => expect(googleAccountFor([acc('s', 'slack')], [], { accountId: 's' })).toBeNull());
});

describe('the context of the quick actions', () => {
  const acc = (id: string, service: Account['service'], spaceId?: string): Account => ({
    id, service, name: id, color: '#000000', muted: false, hibernateWhenIdle: false, ...(spaceId ? { spaceId } : {}),
  });
  const accounts = [acc('slack-w', 'slack', 'w'), acc('g-w', 'google', 'w'), acc('wa', 'whatsapp'), acc('g-me', 'google')];
  const spaces = [{ id: 'w', name: 'Acme' }];

  test('an account in a space acts for the space', () => {
    expect(actionContext(accounts, spaces, 'slack-w')).toEqual({ label: 'Acme', googleId: 'g-w', todoTag: { kind: 'space', id: 'w' } });
  });
  test('an account outside spaces acts for itself', () => {
    expect(actionContext(accounts, spaces, 'wa')).toEqual({ label: 'wa', googleId: null, todoTag: { kind: 'account', id: 'wa' } });
    expect(actionContext(accounts, spaces, 'g-me')).toEqual({ label: 'g-me', googleId: 'g-me', todoTag: { kind: 'account', id: 'g-me' } });
  });
  test('nothing active acts for nothing', () => {
    expect(actionContext(accounts, spaces, null)).toEqual({ label: null, googleId: null, todoTag: null });
  });
});
