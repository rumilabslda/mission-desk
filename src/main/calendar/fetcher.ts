import type { AccountCalendarStatus, CalEvent, CalendarRange } from '../../shared/types';
import { API_BASE, authHeaders, CALENDAR_PAGE, calendarListUrl, eventsUrl, findApiKeys } from './google-api';
import { type CalendarInfo, calendarsInfo, normalizeEvents } from './normalize';

export interface FetcherIO {
  /** A GET through the account's own session (its cookies). Rejects on network errors. */
  fetch(
    accountId: string,
    url: string,
    headers?: Record<string, string>,
    signal?: AbortSignal,
    /** For writes: the HTTP method and a JSON body. */
    init?: { method: string; body?: string },
  ): Promise<{ status: number; text(): Promise<string> }>;
  /** The account's SAPISID cookie (or __Secure-3PAPISID), or null when signed out. */
  cookie(accountId: string): Promise<string | null>;
  now(): number;
}

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type ApiResult =
  | { ok: true; status: number; json: Record<string, unknown> | null }
  | { ok: false; state: 'signed-out' | 'error' | 'offline' | 'forbidden'; status?: number };

export interface AccountResult {
  status: AccountCalendarStatus;
  events: CalEvent[];
}

const MAX_PAGES = 10;
const TIMEOUT_MS = 15_000;

class Outcome extends Error {
  constructor(readonly state: Exclude<AccountCalendarStatus['state'], 'ok'>) {
    super(state);
  }
}

async function json(res: { status: number; text(): Promise<string> }): Promise<Record<string, unknown>> {
  try {
    const v: unknown = JSON.parse(await res.text());
    if (typeof v === 'object' && v !== null) return v as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new Outcome('error');
}

const itemsOf = (body: Record<string, unknown>): unknown[] => (Array.isArray(body.items) ? body.items : []);

/** Reads one account's ticked calendars for a range. Never throws. */
export function createCalendarFetcher(io: FetcherIO, opts: { timeoutMs?: number } = {}) {
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const keys = new Map<string, string>(); // accountId → API key that works

  /** One GET; a network error or no answer within the timeout counts as offline. */
  async function get(accountId: string, url: string, sapisid: string, init?: { method: string; body?: string }) {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const headers = authHeaders(sapisid, Math.floor(io.now() / 1000));
      if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await io.fetch(accountId, url, headers, signal, init);
      const body = await res.text();
      return { status: res.status, text: async () => body };
    } catch {
      throw new Outcome('offline');
    }
  }

  /** The calendar list with a working key, discovering the key when needed. */
  async function calendarList(accountId: string, sapisid: string): Promise<{ key: string; body: Record<string, unknown> }> {
    const kept = keys.get(accountId);
    if (kept) {
      const res = await get(accountId, calendarListUrl(kept), sapisid);
      if (res.status === 401) throw new Outcome('signed-out');
      if (res.status === 200) return { key: kept, body: await json(res) };
      if (res.status !== 400 && res.status !== 403) throw new Outcome('error');
      keys.delete(accountId); // refused: find the key again, once
    }
    const page = await get(accountId, CALENDAR_PAGE, sapisid);
    if (page.status !== 200) throw new Outcome('error');
    for (const key of findApiKeys(await page.text())) {
      const res = await get(accountId, calendarListUrl(key), sapisid);
      if (res.status === 401) throw new Outcome('signed-out');
      if (res.status === 200) {
        keys.set(accountId, key);
        return { key, body: await json(res) };
      }
    }
    throw new Outcome('error');
  }

  async function calendarEvents(accountId: string, sapisid: string, key: string, calendar: CalendarInfo, range: CalendarRange): Promise<CalEvent[]> {
    const out: CalEvent[] = [];
    let token: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await get(accountId, eventsUrl(calendar.id, range, key, token), sapisid);
      if (res.status === 401) throw new Outcome('signed-out');
      if (res.status !== 200) throw new Outcome('error');
      const body = await json(res);
      out.push(...normalizeEvents(itemsOf(body), accountId, calendar));
      token = typeof body.nextPageToken === 'string' && body.nextPageToken ? body.nextPageToken : undefined;
      if (!token) break;
    }
    return out;
  }

  async function fetchAccount(accountId: string, range: CalendarRange): Promise<AccountResult> {
    const result = (state: AccountCalendarStatus['state'], events: CalEvent[] = []): AccountResult => ({
      status: { accountId, state },
      events,
    });
    try {
      const sapisid = await io.cookie(accountId);
      if (!sapisid) return result('signed-out');
      const { key, body } = await calendarList(accountId, sapisid);
      const calendars = calendarsInfo(itemsOf(body));
      const settled = await Promise.allSettled(calendars.map((cal) => calendarEvents(accountId, sapisid, key, cal, range)));
      const ok = settled.filter((s): s is PromiseFulfilledResult<CalEvent[]> => s.status === 'fulfilled');
      if (calendars.length > 0 && ok.length === 0) {
        const reasons = settled.map((s) => (s.status === 'rejected' && s.reason instanceof Outcome ? s.reason.state : 'error'));
        return result(reasons.includes('signed-out') ? 'signed-out' : reasons.includes('offline') ? 'offline' : 'error');
      }
      // A meeting on two ticked calendars comes back twice; keep the first
      // (the primary calendar's, which carries the user's own reply).
      const seen = new Set<string>();
      const events = ok.flatMap((s) => s.value).filter((e) => !seen.has(e.id) && (seen.add(e.id), true));
      return result('ok', events);
    } catch (e) {
      return result(e instanceof Outcome ? e.state : 'error');
    }
  }

  const isBlockedKey = (text: string): boolean => /are blocked|API key not valid|API_KEY_INVALID/i.test(text);

  /**
   * One API call (used for writes), with the key found while reading.
   * `path` is under /calendar/v3 and must already be encoded. Never throws.
   */
  async function request(
    accountId: string,
    method: ApiMethod,
    path: string,
    query?: Record<string, string>,
    body?: unknown,
  ): Promise<ApiResult> {
    try {
      const sapisid = await io.cookie(accountId);
      if (!sapisid) return { ok: false, state: 'signed-out' };
      for (let attempt = 0; attempt < 2; attempt++) {
        if (!keys.get(accountId)) await calendarList(accountId, sapisid); // finds and keeps a key
        const key = keys.get(accountId)!;
        const url = new URL(`${API_BASE}${path}`);
        for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
        url.searchParams.set('key', key);
        const res = await get(accountId, url.toString(), sapisid, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        const text = await res.text();
        if (res.status >= 200 && res.status < 300) {
          let json: Record<string, unknown> | null = null;
          try {
            json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
          } catch {
            json = null;
          }
          return { ok: true, status: res.status, json };
        }
        if (res.status === 401) return { ok: false, state: 'signed-out', status: 401 };
        if ((res.status === 400 || res.status === 403) && isBlockedKey(text) && attempt === 0) {
          keys.delete(accountId); // this key can't do this: find another, once
          continue;
        }
        if (res.status === 403) return { ok: false, state: 'forbidden', status: 403 };
        return { ok: false, state: 'error', status: res.status };
      }
      return { ok: false, state: 'error' };
    } catch (e) {
      return { ok: false, state: e instanceof Outcome ? e.state : 'error' };
    }
  }

  return { fetchAccount, request };
}
export type CalendarFetcher = ReturnType<typeof createCalendarFetcher>;
