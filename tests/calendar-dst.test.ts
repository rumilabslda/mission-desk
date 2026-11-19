// Positions must follow the clock on the grid, also on DST days (Portugal).
process.env.TZ = 'Europe/Lisbon';
import { visibleDays } from '../src/renderer/src/calendar/dates';
import { timedBlocksForDay } from '../src/renderer/src/calendar/layout';
import type { CalEvent } from '../src/shared/types';

const ev = (start: Date, end: Date): CalEvent => ({
  id: String(start.getTime()),
  accountId: 'a',
  title: 'T',
  start: start.toISOString(),
  end: end.toISOString(),
  allDay: false,
  calendarId: 'c', eventId: 'e', editable: false, recurring: false, invited: false, response: 'none',
});

test('the test really runs on Lisbon time', () => {
  expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(-60);
  expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(0);
});

test('spring forward: a 10:00 event is drawn at 10:00', () => {
  const day = new Date(2026, 2, 29);
  const [b] = timedBlocksForDay([ev(new Date(2026, 2, 29, 10), new Date(2026, 2, 29, 11))], day);
  expect(b).toMatchObject({ top: 600, height: 60 });
});

test('fall back: a 10:00 event is drawn at 10:00 and a late one stays on the grid', () => {
  const day = new Date(2026, 9, 25);
  const [b] = timedBlocksForDay([ev(new Date(2026, 9, 25, 10), new Date(2026, 9, 25, 11))], day);
  expect(b).toMatchObject({ top: 600, height: 60 });
  const [late] = timedBlocksForDay([ev(new Date(2026, 9, 25, 23, 30), new Date(2026, 9, 25, 23, 45))], day);
  expect(late.top).toBe(1410);
  expect(late.top + late.height).toBeLessThanOrEqual(1440);
});

test('an event from the day before is clipped to midnight on a DST day', () => {
  const [b] = timedBlocksForDay([ev(new Date(2026, 2, 28, 22), new Date(2026, 2, 29, 9))], new Date(2026, 2, 29));
  expect(b).toMatchObject({ top: 0, height: 540 });
});

test('the DST week has 7 local midnights', () => {
  const days = visibleDays('week', new Date(2026, 2, 29), 1);
  expect(days).toHaveLength(7);
  expect(days.every((d) => d.getHours() === 0)).toBe(true);
  expect(visibleDays('week', new Date(2026, 9, 25), 1).every((d) => d.getHours() === 0)).toBe(true);
});
