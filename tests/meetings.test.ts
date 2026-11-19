import { joinLinkOf, meetingProvider } from '../src/shared/meetings';
import { agendaView } from '../src/shared/today';
import type { CalEvent } from '../src/shared/types';

describe('the meeting link of an event (one click to join)', () => {
  test('Google Meet from the event itself', () => {
    expect(joinLinkOf({ hangoutLink: 'https://meet.google.com/abc-defg-hij' })).toEqual({ provider: 'meet', url: 'https://meet.google.com/abc-defg-hij' });
  });

  test('Zoom, Teams or Webex added to the event (conference add-ons)', () => {
    const zoom = { conferenceData: { entryPoints: [{ entryPointType: 'phone', uri: 'tel:+1555' }, { entryPointType: 'video', uri: 'https://us02web.zoom.us/j/123456789?pwd=abc' }] } };
    expect(joinLinkOf(zoom)).toEqual({ provider: 'zoom', url: 'https://us02web.zoom.us/j/123456789?pwd=abc' });
    const webex = { conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://acme.webex.com/acme/j.php?MTID=m1' }] } };
    expect(joinLinkOf(webex)).toEqual({ provider: 'webex', url: 'https://acme.webex.com/acme/j.php?MTID=m1' });
  });

  test('a Teams invite: the link in the description (HTML, escaped, in angle brackets)', () => {
    const description =
      '<p>Microsoft Teams meeting</p><a href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_X%40thread.v2/0?context=%7b%22Tid%22%3a%22t%22%7d&amp;x=1">Join the meeting now</a>';
    expect(joinLinkOf({ description })).toEqual({
      provider: 'teams',
      url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_X%40thread.v2/0?context=%7b%22Tid%22%3a%22t%22%7d&x=1',
    });
    expect(joinLinkOf({ description: 'Join: <https://teams.microsoft.com/meet/2851234?p=AbCd>' })).toEqual({ provider: 'teams', url: 'https://teams.microsoft.com/meet/2851234?p=AbCd' });
  });

  test('a Zoom link in the location', () => {
    expect(joinLinkOf({ location: 'https://zoom.us/j/987654321' })).toEqual({ provider: 'zoom', url: 'https://zoom.us/j/987654321' });
  });

  test('the event’s own call wins over links in its text', () => {
    expect(joinLinkOf({ hangoutLink: 'https://meet.google.com/abc-defg-hij', description: 'or https://zoom.us/j/1' })?.provider).toBe('meet');
  });

  test('only real meeting services: look-alikes, plain links and http are ignored', () => {
    for (const url of ['https://zoom.us.evil.example/j/1', 'https://teams.microsoft.com.evil.io/l/meetup-join/1', 'http://zoom.us/j/1', 'https://example.com/meeting', 'https://evilzoom.us/j/1'])
      expect(joinLinkOf({ description: `Join ${url}` })).toBeNull();
  });

  test('providers by address', () => {
    expect(meetingProvider('https://meet.google.com/abc-defg-hij')).toBe('meet');
    expect(meetingProvider('https://teams.live.com/meet/9345?p=x')).toBe('teams');
    expect(meetingProvider('https://acme.zoomgov.com/j/1')).toBe('zoom');
    expect(meetingProvider('https://whereby.com/acme-room')).toBe('whereby');
    expect(meetingProvider('https://meet.jit.si/AcmeStandup')).toBe('jitsi');
    expect(meetingProvider('https://app.chime.aws/meetings/123')).toBe('chime');
    expect(meetingProvider('https://meet.goto.com/123456789')).toBe('goto');
    expect(meetingProvider('https://zoom.us/pricing')).toBeNull(); // not a meeting
  });
});

const ev = (id: string, start: string, end: string, extra: Partial<CalEvent> = {}): CalEvent => ({
  id, accountId: 'A', title: id, start, end, allDay: false, response: 'accepted', calendarId: 'c', eventId: id, editable: false, recurring: false, invited: false, ...extra,
});

describe('the agenda: what is next, not what is past', () => {
  // now: 10:00 local
  const now = new Date(2026, 10, 18, 10, 0);
  const at = (h: number, m = 0, day = 18) => new Date(2026, 10, day, h, m).toISOString();
  const events = [
    ev('early', at(8), at(9)), // ended an hour ago: tucked away
    ev('justEnded', at(9), at(9, 40)), // ended 20 min ago: still shown, dimmed
    ev('now', at(9, 30), at(10, 30)),
    ev('focus', at(9), at(12), { free: true }), // a "free" block: never the headline
    ev('next', at(11), at(11, 30)),
    ev('later', at(15), at(16)),
    ev('tomorrow', at(9, 0, 19), at(10, 0, 19)),
    ev('holiday', '2026-11-18', '2026-11-19', { allDay: true }),
  ];

  test('the headline is the meeting happening now; then the next one', () => {
    const v = agendaView(events, now);
    expect(v.current.map((e) => e.id)).toEqual(['now']);
    expect(v.next?.id).toBe('next');
  });

  test('the list: what just ended (dimmed), then the rest of the day; older ones are counted, not shown', () => {
    const v = agendaView(events, now);
    expect(v.recent.map((e) => e.id)).toEqual(['justEnded']);
    expect(v.upcoming.map((e) => e.id)).toEqual(['focus', 'later']);
    expect(v.earlier.map((e) => e.id)).toEqual(['early']);
    expect(v.allDay.map((e) => e.id)).toEqual(['holiday']);
  });

  test('with nothing left today, tomorrow is previewed', () => {
    const v = agendaView(events, new Date(2026, 10, 18, 17, 0));
    expect(v.current).toEqual([]);
    expect(v.next).toBeNull();
    expect(v.tomorrow.map((e) => e.id)).toEqual(['tomorrow']);
  });

  test('a meeting from yesterday that runs past midnight counts as now', () => {
    const late = ev('late', new Date(2026, 10, 17, 23, 0).toISOString(), new Date(2026, 10, 18, 0, 30).toISOString());
    expect(agendaView([late], new Date(2026, 10, 18, 0, 10)).current.map((e) => e.id)).toEqual(['late']);
  });

  test('when nothing is happening now, the next meeting is the headline', () => {
    const v = agendaView(events, new Date(2026, 10, 18, 10, 45));
    expect(v.current).toEqual([]);
    expect(v.next?.id).toBe('next');
  });
});

test('each calendar event carries its join link (only the link, not the description)', async () => {
  const { normalizeEvents } = await import('../src/main/calendar/normalize');
  const [e] = normalizeEvents(
    [{ id: 'x', summary: 'Sync', start: { dateTime: '2026-11-18T10:00:00Z' }, end: { dateTime: '2026-11-18T10:30:00Z' }, description: 'Join https://zoom.us/j/42' }],
    'A',
  );
  expect(e.join).toEqual({ provider: 'zoom', url: 'https://zoom.us/j/42' });
  expect(e).not.toHaveProperty('description');
});

describe('joining in the desktop app when it is installed', () => {
  test('Zoom: a /j/ link becomes zoommtg (password kept); a personal /my/ link stays on the web', async () => {
    const { nativeJoinUrl } = await import('../src/shared/meetings');
    expect(nativeJoinUrl({ provider: 'zoom', url: 'https://us02web.zoom.us/j/123456789?pwd=abc' })).toBe('zoommtg://us02web.zoom.us/join?action=join&confno=123456789&pwd=abc');
    expect(nativeJoinUrl({ provider: 'zoom', url: 'https://zoom.us/j/987' })).toBe('zoommtg://zoom.us/join?action=join&confno=987');
    expect(nativeJoinUrl({ provider: 'zoom', url: 'https://acme.zoom.us/my/sam' })).toBeNull();
  });

  test('Teams: a meetup-join link becomes msteams', async () => {
    const { nativeJoinUrl } = await import('../src/shared/meetings');
    expect(nativeJoinUrl({ provider: 'teams', url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_X%40thread.v2/0?context=x' })).toBe('msteams:/l/meetup-join/19%3ameeting_X%40thread.v2/0?context=x');
    expect(nativeJoinUrl({ provider: 'meet', url: 'https://meet.google.com/abc-defg-hij' })).toBeNull();
  });
});
