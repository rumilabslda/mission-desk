import type { MeetingProviderId } from './meeting';

const TEAMS_HOSTS = new Set(['teams.microsoft.com', 'teams.live.com', 'teams.cloud.microsoft']);

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * The meeting a page URL is in, with a key that stays the same for the whole meeting
 * (so a reload or rejoin continues it). Null for anything that isn't a meeting page.
 * Teams keys come from the meeting's thread id when the URL has one; Teams' exact call
 * routes are to be confirmed against real calls (plan Task 1).
 */
export function meetingKey(raw: string): { provider: MeetingProviderId; key: string } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname;
  if (host === 'meet.google.com') {
    const m = /^\/([a-z]{3}-[a-z]{4}-[a-z]{3})\/?$/.exec(u.pathname);
    return m ? { provider: 'meet', key: `meet:${m[1]}` } : null;
  }
  if (TEAMS_HOSTS.has(host)) {
    const all = decode(u.pathname + u.search + u.hash);
    const thread = /19:meeting_[^@/?#&\s]+@thread\.v2/.exec(all);
    if (thread) return { provider: 'teams', key: `teams:${thread[0]}` };
    if (/\/(pre-join-calling|meetup-join|light-meetings)\b|[?&]meetingjoin=true/.test(all)) return { provider: 'teams', key: `teams:${u.pathname}` };
    return null;
  }
  if (host === 'zoom.us' || host.endsWith('.zoom.us')) {
    // The web client (/wc/<id>), and the links calendar invites carry (/j/<id>, /s/<id>).
    const m = /^\/(?:wc\/(?:join\/)?|j\/|s\/)(\d{9,12})(?:\/|$)/.exec(u.pathname);
    return m ? { provider: 'zoom', key: `zoom:${m[1]}` } : null;
  }
  return null;
}

/**
 * The calendar event a meeting belongs to: same meeting link, and the meeting started between
 * 30 minutes before the event and its end.
 */
export function matchEvent<E extends { start: string; end: string; join?: { url: string } }>(events: E[], meetingUrl: string, at: number): E | null {
  const key = meetingKey(meetingUrl)?.key;
  if (!key) return null;
  let best: E | null = null;
  for (const e of events) {
    if (!e.join || meetingKey(e.join.url)?.key !== key) continue;
    const start = Date.parse(e.start);
    const end = Date.parse(e.end);
    if (!(at >= start - 30 * 60_000 && at <= end)) continue;
    if (!best || Math.abs(start - at) < Math.abs(Date.parse(best.start) - at)) best = e;
  }
  return best;
}

/** The events whose calendar account is in `scope`: a meeting is never matched to another space's calendar. */
export function eventsOfScope<E extends { accountId: string }>(events: E[], scopeOf: (accountId: string) => string | null, scope: string): E[] {
  return events.filter((e) => scopeOf(e.accountId) === scope);
}
