import { joinLinkOf } from '../../shared/meetings';
import type { CalEvent } from '../../shared/types';
import { t } from '../../shared/i18n';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

const MEET_RE = /^https:\/\/meet\.google\.com\/[a-z]{3,4}-[a-z]{4}-[a-z]{3,4}$/;

/** Calendars the user has ticked in Google Calendar. */
export function pickCalendars(items: unknown[]): string[] {
  return items
    .filter(isObj)
    .filter((c) => c.selected === true && c.deleted !== true && c.hidden !== true)
    .sort((a, b) => Number(b.primary === true) - Number(a.primary === true))
    .map((c) => str(c.id))
    .filter((id): id is string => !!id);
}

export interface CalendarInfo {
  id: string;
  accessRole: string;
  primary: boolean;
}

/** Ticked calendars with the user's access role, primary first. */
export function calendarsInfo(items: unknown[]): CalendarInfo[] {
  return items
    .filter(isObj)
    .filter((c) => c.selected === true && c.deleted !== true && c.hidden !== true && !!str(c.id))
    .sort((a, b) => Number(b.primary === true) - Number(a.primary === true))
    .map((c) => ({ id: str(c.id)!, accessRole: str(c.accessRole) ?? 'reader', primary: c.primary === true }));
}

export const WRITABLE_ROLES = new Set(['owner', 'writer']);

export function meetUrlOf(item: Obj): string | undefined {
  const hangout = str(item.hangoutLink);
  if (hangout && MEET_RE.test(hangout)) return hangout;
  const conf = item.conferenceData;
  const points = isObj(conf) && Array.isArray(conf.entryPoints) ? conf.entryPoints : [];
  for (const p of points) {
    if (isObj(p) && p.entryPointType === 'video') {
      const uri = str(p.uri);
      if (uri && MEET_RE.test(uri)) return uri;
    }
  }
  return undefined;
}

/** Google's htmlLink (www.google.com/calendar/event?eid=…) moved to calendar.google.com. */
export function eventOpenUrl(htmlLink: unknown): string | undefined {
  if (typeof htmlLink !== 'string') return undefined;
  let u: URL;
  try {
    u = new URL(htmlLink);
  } catch {
    return undefined;
  }
  const host = u.hostname === 'www.google.com' || u.hostname === 'calendar.google.com';
  const eid = u.searchParams.get('eid');
  if (u.protocol !== 'https:' || !host || u.pathname !== '/calendar/event' || !eid) return undefined;
  return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(eid)}`;
}

/** The only links the UI may ask main to open from the calendar. */
export function isAllowedCalendarLink(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  if (MEET_RE.test(url)) return true;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return (
    u.protocol === 'https:' &&
    u.hostname === 'calendar.google.com' &&
    u.pathname === '/calendar/event' &&
    !!u.searchParams.get('eid')
  );
}

function organizerIsSelf(item: Obj): boolean {
  if (!isObj(item.organizer)) return true; // no organiser listed: the calendar's own event
  return item.organizer.self === true;
}

function hasSelfAttendee(item: Obj): boolean {
  return Array.isArray(item.attendees) && item.attendees.some((a) => isObj(a) && a.self === true);
}

function responseOf(item: Obj): CalEvent['response'] | 'declined' {
  const attendees = Array.isArray(item.attendees) ? item.attendees : [];
  const self = attendees.find((a) => isObj(a) && a.self === true) as Obj | undefined;
  switch (self?.responseStatus) {
    case 'declined':
      return 'declined';
    case 'needsAction':
      return 'needsAction';
    case 'tentative':
      return 'tentative';
    case 'accepted':
      return 'accepted';
    default:
      return 'none';
  }
}

function when(v: unknown): { value: string; allDay: boolean } | null {
  if (!isObj(v)) return null;
  const dateTime = str(v.dateTime);
  if (dateTime) return { value: dateTime, allDay: false };
  const date = str(v.date);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return { value: date, allDay: true };
  return null;
}

/** API event items → the few fields the UI needs; drops cancelled and declined events. */
export function normalizeEvents(
  items: unknown[],
  accountId: string,
  calendar: { id: string; accessRole: string } = { id: 'primary', accessRole: 'reader' },
): CalEvent[] {
  const writable = WRITABLE_ROLES.has(calendar.accessRole);
  const out: CalEvent[] = [];
  for (const item of items) {
    if (!isObj(item) || item.status === 'cancelled') continue;
    if (item.eventType === 'workingLocation') continue; // "Home"/"Office" markers, not events
    const id = str(item.id);
    const start = when(item.start);
    const end = when(item.end);
    if (!id || !start || !end || start.allDay !== end.allDay) continue;
    const response = responseOf(item);
    if (response === 'declined') continue;
    const event: CalEvent = {
      id: `${accountId}:${id}`,
      accountId,
      title: str(item.summary)?.trim() || t('main.calendar.noTitle'),
      start: start.value,
      end: end.value,
      allDay: start.allDay,
      response,
      calendarId: calendar.id,
      eventId: id,
      editable: writable && (organizerIsSelf(item) || item.guestsCanModify === true),
      recurring: !!str(item.recurringEventId),
      invited: hasSelfAttendee(item) && !organizerIsSelf(item),
    };
    if (item.transparency === 'transparent') event.free = true;
    const location = str(item.location);
    if (location) event.location = location;
    const openUrl = eventOpenUrl(item.htmlLink);
    if (openUrl) event.openUrl = openUrl;
    const meetUrl = meetUrlOf(item);
    if (meetUrl) event.meetUrl = meetUrl;
    const join = joinLinkOf(item);
    if (join) event.join = join;
    out.push(event);
  }
  return out;
}
