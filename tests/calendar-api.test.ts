import { authHeaders, calendarListUrl, eventsUrl, findApiKeys, sapisidHash } from '../src/main/calendar/google-api';
import { calendarsInfo, eventOpenUrl, isAllowedCalendarLink, meetUrlOf, normalizeEvents, pickCalendars } from '../src/main/calendar/normalize';

const KEY_A = 'AIza' + 'A'.repeat(35);
const KEY_B = 'AIza' + 'b1_-'.repeat(8) + 'xyz';

describe('google-api', () => {
  test('sapisidHash matches a known vector', () => {
    expect(sapisidHash('SAPISIDVALUE', 1700000000)).toBe('1700000000_dcc3cb617e3d9ef35dc70e13e3c22c2b3247c3b0');
  });

  test('authHeaders carries the hash, origin and auth user', () => {
    expect(authHeaders('SAPISIDVALUE', 1700000000)).toEqual({
      Authorization: 'SAPISIDHASH 1700000000_dcc3cb617e3d9ef35dc70e13e3c22c2b3247c3b0',
      'X-Origin': 'https://calendar.google.com',
      'X-Goog-AuthUser': '0',
    });
  });

  test('findApiKeys dedupes in order of first appearance', () => {
    const html = `x"${KEY_A}"y ${KEY_B} z ${KEY_A}`;
    expect(findApiKeys(html)).toEqual([KEY_A, KEY_B]);
  });

  test('findApiKeys ignores look-alikes that are too short', () => {
    expect(findApiKeys('"AIzaShort123"')).toEqual([]);
  });

  test('eventsUrl encodes the calendar id and sets the query', () => {
    const u = new URL(
      eventsUrl('a b@group.calendar.google.com', { start: '2026-11-16T00:00:00.000Z', end: '2026-11-23T00:00:00.000Z' }, 'K'),
    );
    expect(u.origin + u.pathname).toBe('https://clients6.google.com/calendar/v3/calendars/a%20b%40group.calendar.google.com/events');
    expect(u.searchParams.get('singleEvents')).toBe('true');
    expect(u.searchParams.get('maxResults')).toBe('250');
    expect(u.searchParams.get('timeMin')).toBe('2026-11-16T00:00:00.000Z');
    expect(u.searchParams.get('timeMax')).toBe('2026-11-23T00:00:00.000Z');
    expect(u.searchParams.get('key')).toBe('K');
    expect(u.searchParams.has('pageToken')).toBe(false);
  });

  test('eventsUrl adds a page token when given', () => {
    const u = new URL(eventsUrl('primary', { start: '2026-11-16T00:00:00.000Z', end: '2026-11-17T00:00:00.000Z' }, 'K', 'P2'));
    expect(u.searchParams.get('pageToken')).toBe('P2');
  });

  test('calendarListUrl uses the key', () => {
    const u = new URL(calendarListUrl('K'));
    expect(u.origin + u.pathname).toBe('https://clients6.google.com/calendar/v3/users/me/calendarList');
    expect(u.searchParams.get('key')).toBe('K');
  });
});

describe('normalize', () => {
  test('pickCalendars puts the primary calendar first', () => {
    expect(pickCalendars([{ id: 'team', selected: true }, { id: 'me', selected: true, primary: true }])).toEqual(['me', 'team']);
  });

  test('working-location entries are not events', () => {
    const out = normalizeEvents([timed({ id: 'wl', eventType: 'workingLocation' }), timed({ id: 'ok', eventType: 'default' })], 'a');
    expect(out.map((e) => e.id)).toEqual(['a:ok']);
  });

  test('pickCalendars keeps only selected, visible, live calendars', () => {
    expect(
      pickCalendars([
        { id: 'a', selected: true },
        { id: 'b', selected: true, deleted: true },
        { id: 'c', selected: true, hidden: true },
        { id: 'd', selected: false },
        { id: 'e' },
        'junk',
      ]),
    ).toEqual(['a']);
  });

  const timed = (extra: Record<string, unknown> = {}) => ({
    id: 'e1',
    summary: 'Sync',
    start: { dateTime: '2026-11-18T10:00:00Z' },
    end: { dateTime: '2026-11-18T11:00:00Z' },
    ...extra,
  });

  test('drops cancelled events and events the user declined', () => {
    const out = normalizeEvents(
      [
        timed({ id: 'c', status: 'cancelled' }),
        timed({ id: 'd', attendees: [{ self: true, responseStatus: 'declined' }] }),
        timed({ id: 'ok' }),
      ],
      'acc',
    );
    expect(out.map((e) => e.id)).toEqual(['acc:ok']);
  });

  test('maps the user’s own response', () => {
    const r = (status?: string) =>
      normalizeEvents([timed(status ? { attendees: [{ email: 'x', responseStatus: 'accepted' }, { self: true, responseStatus: status }] } : {})], 'a')[0]
        .response;
    expect(r('needsAction')).toBe('needsAction');
    expect(r('tentative')).toBe('tentative');
    expect(r('accepted')).toBe('accepted');
    expect(r()).toBe('none');
  });

  test('all-day events keep their dates, end exclusive', () => {
    const [e] = normalizeEvents([{ id: 'x', summary: 'Off', start: { date: '2026-11-18' }, end: { date: '2026-11-19' } }], 'a');
    expect(e).toMatchObject({ allDay: true, start: '2026-11-18', end: '2026-11-19' });
  });

  test('timed events keep ISO date-times', () => {
    const [e] = normalizeEvents([timed({ location: 'Room 1' })], 'acc');
    expect(e).toMatchObject({
      id: 'acc:e1',
      accountId: 'acc',
      title: 'Sync',
      allDay: false,
      start: '2026-11-18T10:00:00Z',
      end: '2026-11-18T11:00:00Z',
      location: 'Room 1',
    });
  });

  test('missing title becomes (No title); missing start is dropped', () => {
    const out = normalizeEvents([timed({ summary: '' }), { id: 'n', end: { dateTime: '2026-11-18T11:00:00Z' } }], 'a');
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('(No title)');
  });

  test('only safe fields reach the UI', () => {
    const [e] = normalizeEvents([timed({ description: '<b>secret</b>', attendees: [{ email: 'x@y' }] })], 'a');
    expect(Object.keys(e).sort()).toEqual(['accountId', 'allDay', 'calendarId', 'editable', 'end', 'eventId', 'id', 'invited', 'recurring', 'response', 'start', 'title']);
  });

  test('meetUrlOf uses hangoutLink, then a Meet video entry point', () => {
    expect(meetUrlOf({ hangoutLink: 'https://meet.google.com/abc-defg-hij' })).toBe('https://meet.google.com/abc-defg-hij');
    expect(
      meetUrlOf({ conferenceData: { entryPoints: [{ entryPointType: 'phone', uri: 'tel:+1' }, { entryPointType: 'video', uri: 'https://meet.google.com/xyz-abcd-efg' }] } }),
    ).toBe('https://meet.google.com/xyz-abcd-efg');
    expect(meetUrlOf({ conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://zoom.us/j/1' }] } })).toBeUndefined();
  });

  test('eventOpenUrl moves the Google link to calendar.google.com', () => {
    expect(eventOpenUrl('https://www.google.com/calendar/event?eid=abc123')).toBe('https://calendar.google.com/calendar/event?eid=abc123');
    expect(eventOpenUrl('https://evil.com/calendar/event?eid=abc123')).toBeUndefined();
    expect(eventOpenUrl(42)).toBeUndefined();
  });

  test('normalised events carry openUrl and meetUrl', () => {
    const [e] = normalizeEvents(
      [timed({ htmlLink: 'https://www.google.com/calendar/event?eid=Q1', hangoutLink: 'https://meet.google.com/abc-defg-hij' })],
      'a',
    );
    expect(e.openUrl).toBe('https://calendar.google.com/calendar/event?eid=Q1');
    expect(e.meetUrl).toBe('https://meet.google.com/abc-defg-hij');
  });

  test('isAllowedCalendarLink accepts only event and Meet links', () => {
    expect(isAllowedCalendarLink('https://calendar.google.com/calendar/event?eid=x')).toBe(true);
    expect(isAllowedCalendarLink('https://meet.google.com/abc-defg-hij')).toBe(true);
    expect(isAllowedCalendarLink('http://calendar.google.com/calendar/event?eid=x')).toBe(false);
    expect(isAllowedCalendarLink('http://meet.google.com/abc-defg-hij')).toBe(false);
    expect(isAllowedCalendarLink('https://calendar.google.com/settings')).toBe(false);
    expect(isAllowedCalendarLink('https://calendar.google.com/calendar/event')).toBe(false);
    expect(isAllowedCalendarLink('https://evil.com/calendar/event?eid=x')).toBe(false);
    expect(isAllowedCalendarLink('https://meet.google.com/landing')).toBe(false);
    expect(isAllowedCalendarLink('javascript:alert(1)')).toBe(false);
    expect(isAllowedCalendarLink(7)).toBe(false);
  });

  test('calendarsInfo keeps the access role, primary first', () => {
    expect(
      calendarsInfo([
        { id: 'team', selected: true, accessRole: 'reader' },
        { id: 'me', selected: true, primary: true, accessRole: 'owner' },
        { id: 'off', selected: false, accessRole: 'owner' },
      ]),
    ).toEqual([
      { id: 'me', accessRole: 'owner', primary: true },
      { id: 'team', accessRole: 'reader', primary: false },
    ]);
  });

  test('who can edit: organiser or guests-can-modify, in a writable calendar', () => {
    const owner = { id: 'me', accessRole: 'owner' };
    const one = (extra: Record<string, unknown>, cal = owner) => normalizeEvents([timed(extra)], 'a', cal)[0];
    expect(one({ organizer: { self: true } })).toMatchObject({ editable: true, calendarId: 'me', eventId: 'e1' });
    expect(one({ organizer: { email: 'x' } }).editable).toBe(false);
    expect(one({ organizer: { email: 'x' }, guestsCanModify: true }).editable).toBe(true);
    expect(one({ organizer: { self: true } }, { id: 'team', accessRole: 'reader' }).editable).toBe(false);
    expect(one({ organizer: { self: true } }, { id: 'w', accessRole: 'writer' }).editable).toBe(true);
  });

  test('repeating and invited flags', () => {
    const [r] = normalizeEvents([timed({ recurringEventId: 'series', organizer: { self: true } })], 'a', { id: 'me', accessRole: 'owner' });
    expect(r.recurring).toBe(true);
    const [i] = normalizeEvents(
      [timed({ organizer: { email: 'boss' }, attendees: [{ email: 'boss', organizer: true }, { self: true, responseStatus: 'needsAction' }] })],
      'a',
      { id: 'me', accessRole: 'owner' },
    );
    expect(i).toMatchObject({ invited: true, editable: false, recurring: false });
    const [own] = normalizeEvents([timed({ organizer: { self: true }, attendees: [{ self: true, organizer: true, responseStatus: 'accepted' }] })], 'a', {
      id: 'me',
      accessRole: 'owner',
    });
    expect(own.invited).toBe(false);
  });
});

test('events shown as free in Google (transparent) are marked free', () => {
  const base = { id: 'f', summary: 'Holiday', start: { date: '2026-11-18' }, end: { date: '2026-11-19' } };
  expect(normalizeEvents([{ ...base, transparency: 'transparent' }], 'a')[0].free).toBe(true);
  expect(normalizeEvents([base], 'a')[0].free).toBeUndefined();
});
