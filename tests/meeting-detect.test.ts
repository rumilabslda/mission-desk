import { createDetector } from '../src/main/meetings/detector';
import { meetingKey } from '../src/shared/meeting-detect';

test.each([
  ['https://meet.google.com/abc-defg-hij', 'meet:abc-defg-hij'],
  ['https://meet.google.com/abc-defg-hij?authuser=1&pli=1', 'meet:abc-defg-hij'],
  ['https://meet.google.com/abc-defg-hij/', 'meet:abc-defg-hij'],
  ['https://teams.microsoft.com/l/meetup-join/19%3ameeting_NjAx%40thread.v2/0?context=%7b%7d', 'teams:19:meeting_NjAx@thread.v2'],
  ['https://teams.microsoft.com/v2/?meetingjoin=true#/l/meetup-join/19:meeting_NjAx@thread.v2/0?context=x', 'teams:19:meeting_NjAx@thread.v2'],
  ['https://teams.microsoft.com/_#/pre-join-calling/19:meeting_ZZ@thread.v2', 'teams:19:meeting_ZZ@thread.v2'],
  ['https://teams.live.com/light-meetings/launch?coords=abc', 'teams:/light-meetings/launch'],
  ['https://app.zoom.us/wc/81234567890/join?fromPWA=1', 'zoom:81234567890'],
  ['https://zoom.us/wc/join/81234567890', 'zoom:81234567890'],
  ['https://acme.zoom.us/wc/81234567890/start', 'zoom:81234567890'],
])('%s is a meeting', (url, key) => {
  expect(meetingKey(url)?.key).toBe(key);
});

test.each([
  'https://meet.google.com/',
  'https://meet.google.com/landing',
  'https://teams.microsoft.com/v2/#/conversations/19:abc@thread.v2',
  'https://zoom.us/pricing',
  'https://app.zoom.us/wc/home',
  'https://evil.example/meet.google.com/abc-defg-hij',
  'https://meet.google.com.evil.example/abc-defg-hij',
  'not a url',
])('%s is not a meeting', (url) => {
  expect(meetingKey(url)).toBeNull();
});

function setup() {
  const events: string[] = [];
  const timers = new Map<number, () => void>();
  let next = 1;
  const d = createDetector({
    onStart: (m) => events.push(`start ${m.accountId}/${m.kind} ${m.key}`),
    onEnd: (acc, kind, key) => events.push(`end ${acc}/${kind} ${key}`),
    setTimer: (fn, ms) => {
      expect(ms).toBe(120_000);
      timers.set(next, fn);
      return next++;
    },
    clearTimer: (id) => timers.delete(id as number),
  });
  const fire = () => {
    const all = [...timers.values()];
    timers.clear();
    all.forEach((f) => f());
  };
  return { d, events, fire, timers };
}

const MEET = 'https://meet.google.com/abc-defg-hij';

test('a meeting starts with a call on a meeting page, in either order', () => {
  const a = setup();
  a.d.callChanged('g1', 'meet', true, 'https://meet.google.com/landing');
  expect(a.events).toEqual([]);
  a.d.urlChanged('g1', 'meet', MEET);
  expect(a.events).toEqual(['start g1/meet meet:abc-defg-hij']);
  const b = setup();
  b.d.urlChanged('g1', 'meet', MEET);
  expect(b.events).toEqual([]);
  b.d.callChanged('g1', 'meet', true, MEET);
  expect(b.events).toEqual(['start g1/meet meet:abc-defg-hij']);
});

test('a reload or a rejoin within 2 minutes continues the same meeting', () => {
  const { d, events, fire, timers } = setup();
  d.callChanged('g1', 'meet', true, MEET);
  d.callChanged('g1', 'meet', false, MEET);
  expect(timers.size).toBe(1);
  d.callChanged('g1', 'meet', true, MEET);
  expect(timers.size).toBe(0);
  fire();
  expect(events).toEqual(['start g1/meet meet:abc-defg-hij']);
});

test('leaving ends the meeting after the 2-minute hold', () => {
  const { d, events, fire } = setup();
  d.callChanged('g1', 'meet', true, MEET);
  d.urlChanged('g1', 'meet', 'https://meet.google.com/landing');
  expect(events).toHaveLength(1);
  fire();
  expect(events).toEqual(['start g1/meet meet:abc-defg-hij', 'end g1/meet meet:abc-defg-hij']);
});

test('another meeting ends the first at once and starts the second', () => {
  const { d, events } = setup();
  d.callChanged('g1', 'meet', true, MEET);
  d.urlChanged('g1', 'meet', 'https://meet.google.com/xyz-abcd-efg');
  expect(events).toEqual(['start g1/meet meet:abc-defg-hij', 'end g1/meet meet:abc-defg-hij', 'start g1/meet meet:xyz-abcd-efg']);
});

test('a view that goes away is held the same 2 minutes', () => {
  const { d, events, fire, timers } = setup();
  d.callChanged('g1', 'meet', true, MEET);
  d.viewGone('g1', 'meet');
  expect(timers.size).toBe(1);
  expect(events).toHaveLength(1);
  fire();
  expect(events.at(-1)).toBe('end g1/meet meet:abc-defg-hij');
});

import { matchEvent } from '../src/shared/meeting-detect';

test('a meeting is matched to the calendar event with the same link, around its time', () => {
  const ev = (id: string, url: string, start: string, end: string) => ({ id, eventId: id, accountId: 'g1', title: id, start, end, join: { provider: 'meet' as const, url } });
  const events = [
    ev('other', 'https://meet.google.com/xyz-abcd-efg', '2026-11-22T10:00:00Z', '2026-11-22T11:00:00Z'),
    ev('yesterday', MEET, '2026-11-21T10:00:00Z', '2026-11-21T11:00:00Z'),
    ev('weekly', MEET + '?authuser=0', '2026-11-22T10:00:00Z', '2026-11-22T11:00:00Z'),
  ];
  expect(matchEvent(events, MEET, Date.parse('2026-11-22T09:50:00Z'))?.id).toBe('weekly');
  expect(matchEvent(events, MEET, Date.parse('2026-11-22T10:40:00Z'))?.id).toBe('weekly');
  expect(matchEvent(events, MEET, Date.parse('2026-11-22T12:00:00Z'))).toBeNull();
  expect(matchEvent(events, 'https://meet.google.com/aaa-bbbb-ccc', Date.parse('2026-11-22T10:00:00Z'))).toBeNull();
});
