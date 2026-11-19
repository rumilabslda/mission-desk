import { createRange, draftTimes, editorFields, isDrag, minutesAt, moveBy, resizeTo } from '../src/renderer/src/calendar/drag';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

describe('drag maths', () => {
  test('minutesAt snaps down to 15 minutes and stays inside the day', () => {
    expect(minutesAt(0, 0.8)).toBe(0);
    expect(minutesAt(7 * 0.8, 0.8)).toBe(0);
    expect(minutesAt(16 * 0.8, 0.8)).toBe(15);
    expect(minutesAt(-50, 0.8)).toBe(0);
    expect(minutesAt(5000, 0.8)).toBe(1425);
  });

  test('a click makes a 1-hour range; a drag makes the dragged range either way', () => {
    expect(createRange(d(2026, 11, 18), 540, 540)).toEqual({ start: d(2026, 11, 18, 9), end: d(2026, 11, 18, 10) });
    expect(createRange(d(2026, 11, 18), 600, 540)).toEqual({ start: d(2026, 11, 18, 9), end: d(2026, 11, 18, 10, 15) });
  });

  test('moveBy keeps the duration, across days, in 15-minute steps', () => {
    const r = moveBy(d(2026, 11, 18, 9), d(2026, 11, 18, 10, 30), 37, 2);
    expect(r).toEqual({ start: d(2026, 11, 20, 9, 30), end: d(2026, 11, 20, 11) });
  });

  test('resizeTo keeps at least 15 minutes and never ends before it starts', () => {
    expect(resizeTo(d(2026, 11, 18, 9), d(2026, 11, 18, 10), 50)).toEqual(d(2026, 11, 18, 10, 45));
    expect(resizeTo(d(2026, 11, 18, 9), d(2026, 11, 18, 10), -120)).toEqual(d(2026, 11, 18, 9, 15));
  });

  test('a drag starts after 4 pixels', () => {
    expect(isDrag(2, 2)).toBe(false);
    expect(isDrag(3, 3)).toBe(true);
  });
});

describe('editor fields', () => {
  test('timed: local date and time fields round-trip to ISO instants', () => {
    const f = editorFields(false, d(2026, 11, 18, 9, 30).toISOString(), d(2026, 11, 18, 10, 45).toISOString());
    expect(f).toEqual({ startDate: '2026-11-18', startTime: '09:30', endDate: '2026-11-18', endTime: '10:45' });
    expect(draftTimes(false, f)).toEqual({ start: d(2026, 11, 18, 9, 30).toISOString(), end: d(2026, 11, 18, 10, 45).toISOString() });
  });

  test('all day: the end field shows the last day; the draft end is the day after', () => {
    const f = editorFields(true, '2026-11-18', '2026-11-20');
    expect(f).toMatchObject({ startDate: '2026-11-18', endDate: '2026-11-19' });
    expect(draftTimes(true, f)).toEqual({ start: '2026-11-18', end: '2026-11-20' });
  });

  test('an end before the start is not a valid draft', () => {
    expect(draftTimes(false, { startDate: '2026-11-18', startTime: '10:00', endDate: '2026-11-18', endTime: '09:00' })).toBeNull();
    expect(draftTimes(true, { startDate: '2026-11-19', startTime: '', endDate: '2026-11-18', endTime: '' })).toBeNull();
  });
});
