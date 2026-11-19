import { addDays, dayKey, rangeOf, startOfWeek, step, title, visibleDays } from '../src/renderer/src/calendar/dates';
import { weekStartFrom } from '../src/shared/week-start';
import { allDayFor, monthCell, timedBlocksForDay } from '../src/renderer/src/calendar/layout';
import type { CalEvent } from '../src/shared/types';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const iso = (date: Date) => date.toISOString();

let n = 0;
function timed(start: Date, end: Date, extra: Partial<CalEvent> = {}): CalEvent {
  return { id: `e${n++}`, accountId: 'a', title: 'T', start: iso(start), end: iso(end), allDay: false, calendarId: 'c', eventId: 'e', editable: false, recurring: false, invited: false, response: 'none', ...extra };
}
function allDay(start: string, end: string): CalEvent {
  return { id: `e${n++}`, accountId: 'a', title: 'A', start, end, allDay: true, calendarId: 'c', eventId: 'e', editable: false, recurring: false, invited: false, response: 'none' };
}

describe('dates', () => {
  test('startOfWeek honours Monday and Sunday starts', () => {
    expect(dayKey(startOfWeek(d(2026, 11, 18), 1))).toBe('2026-11-16');
    expect(dayKey(startOfWeek(d(2026, 11, 18), 0))).toBe('2026-11-15');
    expect(dayKey(startOfWeek(d(2026, 11, 16), 1))).toBe('2026-11-16');
    expect(dayKey(startOfWeek(d(2026, 11, 22), 1))).toBe('2026-11-16');
  });

  test('month view shows 6 weeks starting on the week of the 1st', () => {
    const days = visibleDays('month', d(2026, 11, 18), 1);
    expect(days).toHaveLength(42);
    expect(dayKey(days[0])).toBe('2026-10-26');
    const keys = days.map(dayKey);
    expect(keys).toContain('2026-11-01');
    expect(keys).toContain('2026-11-30');
  });

  test('day and week views', () => {
    expect(visibleDays('day', d(2026, 11, 18, 15), 1).map(dayKey)).toEqual(['2026-11-18']);
    expect(visibleDays('week', d(2026, 11, 18), 1).map(dayKey)).toEqual([
      '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
    ]);
  });

  test('rangeOf runs from the first local midnight to the day after the last', () => {
    const r = rangeOf(visibleDays('week', d(2026, 11, 18), 1));
    expect(r).toEqual({ start: iso(d(2026, 11, 16)), end: iso(d(2026, 11, 23)) });
  });

  test('a DST week still has 7 local midnights', () => {
    const days = visibleDays('week', d(2027, 3, 29), 1);
    expect(days).toHaveLength(7);
    expect(days.every((x) => x.getHours() === 0 && x.getMinutes() === 0)).toBe(true);
    const oct = visibleDays('week', d(2026, 10, 25), 1);
    expect(oct.map(dayKey)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
    expect(addDays(d(2026, 10, 25), 1).getHours()).toBe(0);
  });

  test('step moves by a day, week or month (month clamps)', () => {
    expect(dayKey(step('day', d(2026, 11, 18), -1))).toBe('2026-11-17');
    expect(dayKey(step('week', d(2026, 11, 18), 1))).toBe('2026-11-25');
    const feb = step('month', d(2027, 1, 31), 1);
    expect(feb.getMonth()).toBe(1);
    expect(feb.getFullYear()).toBe(2027);
    expect(step('month', d(2026, 12, 5), 1).getFullYear()).toBe(2027);
  });

  test('titles', () => {
    const w = title('week', d(2026, 11, 18), 1, 'en-GB');
    expect(w).toContain('16');
    expect(w).toContain('22');
    expect(title('month', d(2026, 11, 18), 1, 'en-GB')).toContain('November');
    expect(title('day', d(2026, 11, 18), 1, 'en-GB')).toContain('18');
  });

  test('week starts on Monday unless the Mac says Sunday', () => {
    expect(weekStartFrom(undefined)).toBe(1);
    expect(weekStartFrom({ gregorian: 1 })).toBe(0);
    expect(weekStartFrom({ gregorian: 2 })).toBe(1);
    expect(weekStartFrom({ gregorian: 7 })).toBe(1);
    expect(weekStartFrom('junk')).toBe(1);
  });
});

describe('layout', () => {
  const day = d(2026, 11, 18);

  test('overlapping events share the width; separate ones do not', () => {
    const a = timed(d(2026, 11, 18, 9), d(2026, 11, 18, 10));
    const b = timed(d(2026, 11, 18, 9, 30), d(2026, 11, 18, 11));
    const c = timed(d(2026, 11, 18, 14), d(2026, 11, 18, 15));
    const blocks = timedBlocksForDay([a, b, c], day);
    const by = (e: CalEvent) => blocks.find((x) => x.event.id === e.id)!;
    expect(by(a)).toMatchObject({ top: 540, height: 60, col: 0, cols: 2 });
    expect(by(b)).toMatchObject({ top: 570, height: 90, col: 1, cols: 2 });
    expect(by(c)).toMatchObject({ col: 0, cols: 1 });
  });

  test('a freed column is reused inside a cluster', () => {
    const a = timed(d(2026, 11, 18, 9), d(2026, 11, 18, 12));
    const b = timed(d(2026, 11, 18, 9), d(2026, 11, 18, 10));
    const c = timed(d(2026, 11, 18, 10, 30), d(2026, 11, 18, 11));
    const blocks = timedBlocksForDay([a, b, c], day);
    expect(blocks.find((x) => x.event.id === c.id)).toMatchObject({ col: 1, cols: 2 });
  });

  test('an event across midnight is clipped to each day', () => {
    const e = timed(d(2026, 11, 18, 23), d(2026, 11, 19, 1));
    expect(timedBlocksForDay([e], day)[0]).toMatchObject({ top: 1380, height: 60 });
    expect(timedBlocksForDay([e], d(2026, 11, 19))[0]).toMatchObject({ top: 0, height: 60 });
    expect(timedBlocksForDay([e], d(2026, 11, 20))).toEqual([]);
  });

  test('short events get a minimum height; all-day and long events stay out of the grid', () => {
    const short = timed(d(2026, 11, 18, 9), d(2026, 11, 18, 9, 5));
    const long = timed(d(2026, 11, 17, 8), d(2026, 11, 19, 8));
    const ad = allDay('2026-11-18', '2026-11-19');
    const blocks = timedBlocksForDay([short, long, ad], day);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].height).toBe(15);
  });

  test('all-day row: spans, clipping and stacking', () => {
    const week = visibleDays('week', day, 1);
    const one = allDay('2026-11-18', '2026-11-19');
    const clipped = allDay('2026-11-15', '2026-11-18');
    const overlap = allDay('2026-11-18', '2026-11-20');
    const long = timed(d(2026, 11, 20, 8), d(2026, 11, 21, 9));
    const out = allDayFor([one, clipped, overlap, long], week);
    const by = (e: CalEvent) => out.find((x) => x.event.id === e.id)!;
    expect(by(one)).toMatchObject({ startCol: 2, span: 1 });
    expect(by(clipped)).toMatchObject({ startCol: 0, span: 2 });
    expect(by(overlap).row).not.toBe(by(one).row);
    expect(by(long)).toMatchObject({ startCol: 4, span: 2 });
    expect(allDayFor([allDay('2026-11-10', '2026-11-11')], week)).toEqual([]);
  });

  test('month cell shows up to maxRows, all-day first, then +N more', () => {
    const evs = [1, 2, 3, 4].map((h) => timed(d(2026, 11, 18, 8 + h), d(2026, 11, 18, 9 + h)));
    const ad = allDay('2026-11-18', '2026-11-19');
    const five = monthCell([...evs, ad], day, 3);
    expect(five.shown).toHaveLength(2);
    expect(five.more).toBe(3);
    expect(five.shown[0].id).toBe(ad.id);
    const three = monthCell(evs.slice(0, 3), day, 3);
    expect(three.shown).toHaveLength(3);
    expect(three.more).toBe(0);
    expect(monthCell([ad], d(2026, 11, 19), 3).shown).toEqual([]);
  });
});
