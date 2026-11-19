import { draftToBody, shiftSeries, toEditable, writableCalendars } from '../src/main/calendar/editable';
import { isGoogleId, parseEventDraft, parseReply, parseScope, parseSendUpdates } from '../src/main/ipc-validation';
import type { EventDraft } from '../src/shared/types';

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

describe('writableCalendars', () => {
  test('owner and writer calendars only, primary first, with their names', () => {
    expect(
      writableCalendars([
        { id: 'team', summary: 'Team', accessRole: 'writer' },
        { id: 'hol', summary: 'Holidays', accessRole: 'reader' },
        { id: 'me', summary: 'me@x', summaryOverride: 'Mine', accessRole: 'owner', primary: true },
        { id: 'gone', summary: 'Old', accessRole: 'owner', deleted: true },
      ]),
    ).toEqual([
      { id: 'me', name: 'Mine', primary: true },
      { id: 'team', name: 'Team', primary: false },
    ]);
  });
});

describe('draftToBody', () => {
  test('timed: dateTime and an empty date; no Meet change', () => {
    const b = draftToBody(draft({ location: 'Room', description: 'Notes' }), { hadMeet: false, requestId: 'r' });
    expect(b).toEqual({
      summary: 'Sync',
      location: 'Room',
      description: 'Notes',
      start: { dateTime: '2026-11-18T10:00:00.000Z', date: null },
      end: { dateTime: '2026-11-18T11:00:00.000Z', date: null },
      attendees: [],
    });
  });

  test('all day: date (end exclusive) and an empty dateTime', () => {
    const b = draftToBody(draft({ allDay: true, start: '2026-11-18', end: '2026-11-19' }), { hadMeet: false, requestId: 'r' });
    expect(b.start).toEqual({ date: '2026-11-18', dateTime: null });
    expect(b.end).toEqual({ date: '2026-11-19', dateTime: null });
  });

  test('Meet on asks for a link; Meet off removes an existing one', () => {
    expect(draftToBody(draft({ meet: true }), { hadMeet: false, requestId: 'req-1' }).conferenceData).toEqual({
      createRequest: { requestId: 'req-1', conferenceSolutionKey: { type: 'hangoutsMeet' } },
    });
    expect(draftToBody(draft({ meet: false }), { hadMeet: true, requestId: 'r' }).conferenceData).toBeNull();
    expect('conferenceData' in draftToBody(draft({ meet: true }), { hadMeet: true, requestId: 'r' })).toBe(false);
  });

  test('booked rooms are never dropped when saving', () => {
    const existing = [
      { email: 'me@x', self: true, organizer: true },
      { email: 'room-1@resource.calendar.google.com', resource: true, responseStatus: 'accepted' },
      { email: 'ana@y' },
    ];
    const b = draftToBody(draft({ guests: ['ana@y'] }), { hadMeet: false, requestId: 'r', existingAttendees: existing });
    expect(b.attendees).toEqual(existing);
  });

  test('guests: existing attendees keep their replies; new ones are added; removed ones go', () => {
    const existing = [
      { email: 'me@x', self: true, organizer: true, responseStatus: 'accepted' },
      { email: 'ana@y', responseStatus: 'accepted' },
      { email: 'bob@y', responseStatus: 'declined' },
    ];
    const b = draftToBody(draft({ guests: ['ana@y', 'cy@z'] }), { hadMeet: false, requestId: 'r', existingAttendees: existing });
    expect(b.attendees).toEqual([
      { email: 'me@x', self: true, organizer: true, responseStatus: 'accepted' },
      { email: 'ana@y', responseStatus: 'accepted' },
      { email: 'cy@z' },
    ]);
  });
});

describe('toEditable', () => {
  test('reads the fields the editor needs, guests without the user', () => {
    const e = toEditable(
      {
        id: 'e1',
        summary: 'Plan',
        start: { dateTime: '2026-11-18T10:00:00Z' },
        end: { dateTime: '2026-11-18T11:00:00Z' },
        location: 'Room',
        description: 'Notes',
        organizer: { self: true },
        attendees: [{ email: 'me@x', self: true, organizer: true }, { email: 'ana@y' }, { email: 'room@resource.calendar.google.com', resource: true }],
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        recurringEventId: 's1',
      },
      { id: 'primary', accessRole: 'owner' },
    );
    expect(e).toEqual({
      calendarId: 'primary',
      eventId: 'e1',
      seriesId: 's1',
      title: 'Plan',
      allDay: false,
      start: '2026-11-18T10:00:00Z',
      end: '2026-11-18T11:00:00Z',
      location: 'Room',
      description: 'Notes',
      guests: ['ana@y'],
      meet: true,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      editable: true,
    });
  });
});

describe('shiftSeries', () => {
  test('moving one instance by +1h moves the whole series by +1h, keeping its own date', () => {
    expect(
      shiftSeries(
        { allDay: false, start: '2026-11-02T09:00:00.000Z', end: '2026-11-02T09:30:00.000Z' },
        { start: '2026-11-18T09:00:00.000Z', end: '2026-11-18T09:30:00.000Z' },
        { start: '2026-11-18T10:00:00.000Z', end: '2026-11-18T11:00:00.000Z' },
      ),
    ).toEqual({ start: '2026-11-02T10:00:00.000Z', end: '2026-11-02T11:00:00.000Z' });
  });

  test('the shift is wall-clock days and minutes (safe across DST)', () => {
    const local = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h).toISOString();
    expect(
      shiftSeries(
        { allDay: false, start: local(2026, 10, 3, 10), end: local(2026, 10, 3, 11) },
        { start: local(2026, 10, 24, 10), end: local(2026, 10, 24, 11) },
        { start: local(2026, 10, 26, 10), end: local(2026, 10, 26, 11) },
      ),
    ).toEqual({ start: local(2026, 10, 5, 10), end: local(2026, 10, 5, 11) });
  });

  test('all-day series shift by whole days', () => {
    expect(
      shiftSeries({ allDay: true, start: '2026-11-02', end: '2026-11-03' }, { start: '2026-11-18', end: '2026-11-19' }, { start: '2026-11-19', end: '2026-11-21' }),
    ).toEqual({ start: '2026-11-03', end: '2026-11-05' });
  });
});

describe('ids', () => {
  test('dot-only ids are refused (they would leave the events path)', () => {
    expect(isGoogleId('..')).toBe(false);
    expect(isGoogleId('.')).toBe(false);
    expect(isGoogleId('')).toBe(false);
    expect(isGoogleId('abc_20261118T100000Z')).toBe(true);
    expect(isGoogleId('team@group.calendar.google.com')).toBe(true);
  });
});

describe('validation', () => {
  test('a good draft passes, cleaned', () => {
    expect(parseEventDraft({ ...draft(), title: '  Sync ', guests: [' Ana@Y.com ', 'ana@y.com'] })).toEqual({ ...draft(), title: 'Sync', guests: ['ana@y.com'] });
    expect(parseEventDraft(draft({ allDay: true, start: '2026-11-18', end: '2026-11-19' }))).not.toBeNull();
  });
  test('bad drafts fail', () => {
    expect(parseEventDraft({ ...draft(), end: '2026-11-18T09:00:00.000Z' })).toBeNull(); // ends before it starts
    expect(parseEventDraft({ ...draft(), start: 'tomorrow' })).toBeNull();
    expect(parseEventDraft({ ...draft(), allDay: true })).toBeNull(); // date-times on an all-day draft
    expect(parseEventDraft({ ...draft(), title: 'x'.repeat(1025) })).toBeNull();
    expect(parseEventDraft({ ...draft(), description: 'x'.repeat(8193) })).toBeNull();
    expect(parseEventDraft({ ...draft(), guests: ['not-an-email'] })).toBeNull();
    expect(parseEventDraft({ ...draft(), guests: Array.from({ length: 101 }, (_, i) => `g${i}@x.com`) })).toBeNull();
    expect(parseEventDraft({ ...draft(), calendarId: '' })).toBeNull();
    expect(parseEventDraft({ ...draft(), meet: 'yes' })).toBeNull();
    expect(parseEventDraft(null)).toBeNull();
  });
  test('scope, reply and sendUpdates', () => {
    expect(parseScope('this')).toBe('this');
    expect(parseScope('following')).toBeNull();
    expect(parseReply('tentative')).toBe('tentative');
    expect(parseReply('maybe')).toBeNull();
    expect(parseSendUpdates('none')).toBe('none');
    expect(parseSendUpdates('externalOnly')).toBeNull();
  });
});
