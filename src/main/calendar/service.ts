import type { AccountCalendarStatus, CalEvent, CalendarData, CalendarRange } from '../../shared/types';
import type { AccountResult } from './fetcher';

const CACHE_MS = 60_000;

export interface CalendarServiceDeps {
  /** Google account ids, in sidebar order. */
  googleAccounts(): string[];
  /** Accounts the user hid in the combined view. */
  hidden(): string[];
  fetcher: { fetchAccount(accountId: string, range: CalendarRange): Promise<AccountResult> };
  now(): number;
}

const startMs = (e: CalEvent): number => Date.parse(e.allDay ? `${e.start}T00:00:00` : e.start);

/** All visible Google accounts for a range, merged, with a short cache. Never throws. */
export function createCalendarService(deps: CalendarServiceDeps) {
  const cache = new Map<string, { at: number; result: AccountResult }>();

  async function account(id: string, range: CalendarRange, force: boolean): Promise<AccountResult> {
    const key = `${id}|${range.start}|${range.end}`;
    const hit = cache.get(key);
    if (hit && !force && deps.now() - hit.at < CACHE_MS) return hit.result;
    let result: AccountResult;
    try {
      result = await deps.fetcher.fetchAccount(id, range);
    } catch {
      result = { status: { accountId: id, state: 'error' }, events: [] };
    }
    if (result.status.state === 'offline' && hit) {
      return { status: result.status, events: hit.result.events }; // keep showing the last update
    }
    cache.set(key, { at: deps.now(), result });
    return result;
  }

  /** `includeHidden`: also accounts hidden in the view (the assistant must see every shared calendar). */
  async function load(range: CalendarRange, force: boolean, opts: { includeHidden?: boolean } = {}): Promise<CalendarData> {
    const hidden = new Set(opts.includeHidden ? [] : deps.hidden());
    const ids = deps.googleAccounts().filter((id) => !hidden.has(id));
    const results = await Promise.all(ids.map((id) => account(id, range, force)));
    const status: AccountCalendarStatus[] = results.map((r) => r.status);
    const events = results.flatMap((r) => r.events).sort((a, b) => startMs(a) - startMs(b));
    return { events, status };
  }

  /** Forget one account's cached ranges (after a write, so the view shows what Google now has). */
  function invalidate(accountId: string): void {
    for (const key of cache.keys()) if (key.startsWith(`${accountId}|`)) cache.delete(key);
  }

  /** Forget cached data (e.g. when an account is removed). */
  function clear(): void {
    cache.clear();
  }

  return { load, clear, invalidate };
}
export type CalendarService = ReturnType<typeof createCalendarService>;
