import { createHash } from 'node:crypto';
import type { CalendarRange } from '../../shared/types';

/**
 * Google Calendar API v3, called the way Google's own Calendar web app calls
 * it: the account's cookies plus a SAPISIDHASH header and the page's API key.
 * Undocumented; if Google changes it, the account shows an error instead.
 */
export const CALENDAR_ORIGIN = 'https://calendar.google.com';
export const API_BASE = 'https://clients6.google.com/calendar/v3';
export const CALENDAR_PAGE = 'https://calendar.google.com/calendar/u/0/r';

export function sapisidHash(sapisid: string, nowSec: number): string {
  const digest = createHash('sha1').update(`${nowSec} ${sapisid} ${CALENDAR_ORIGIN}`).digest('hex');
  return `${nowSec}_${digest}`;
}

export function authHeaders(sapisid: string, nowSec: number): Record<string, string> {
  return {
    Authorization: `SAPISIDHASH ${sapisidHash(sapisid, nowSec)}`,
    'X-Origin': CALENDAR_ORIGIN,
    'X-Goog-AuthUser': '0',
  };
}

/** Google API keys embedded in a page, in order of first appearance. */
export function findApiKeys(html: string): string[] {
  return [...new Set(html.match(/AIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/g) ?? [])];
}

export function calendarListUrl(key: string): string {
  const u = new URL(`${API_BASE}/users/me/calendarList`);
  u.searchParams.set('key', key);
  return u.toString();
}

export function eventsUrl(calendarId: string, range: CalendarRange, key: string, pageToken?: string): string {
  const u = new URL(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  u.searchParams.set('timeMin', range.start);
  u.searchParams.set('timeMax', range.end);
  u.searchParams.set('singleEvents', 'true');
  u.searchParams.set('orderBy', 'startTime');
  u.searchParams.set('showDeleted', 'false');
  u.searchParams.set('maxResults', '250');
  if (pageToken) u.searchParams.set('pageToken', pageToken);
  u.searchParams.set('key', key);
  return u.toString();
}
