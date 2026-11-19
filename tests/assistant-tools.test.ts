import { freeSlots } from '../src/main/assistant/tools';

const d = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m); // November 2026, local time

describe('freeSlots', () => {
  const workday = { startHour: 9, endHour: 18, weekdaysOnly: true };

  test('gaps between busy blocks from several calendars, inside the workday', () => {
    const busy = [
      { start: d(18, 9), end: d(18, 10) }, // account A
      { start: d(18, 9, 30), end: d(18, 11) }, // account B overlaps
      { start: d(18, 13), end: d(18, 14) },
    ];
    expect(freeSlots(busy, { start: d(18, 0), end: d(19, 0) }, 60, workday)).toEqual([
      { start: d(18, 11), end: d(18, 13) },
      { start: d(18, 14), end: d(18, 18) },
    ]);
  });

  test('too-short gaps are skipped', () => {
    const busy = [{ start: d(18, 9), end: d(18, 17, 30) }];
    expect(freeSlots(busy, { start: d(18, 0), end: d(19, 0) }, 45, workday)).toEqual([]);
    expect(freeSlots(busy, { start: d(18, 0), end: d(19, 0) }, 30, workday)).toEqual([{ start: d(18, 17, 30), end: d(18, 18) }]);
  });

  test('weekends are skipped unless asked; the range start clips the first day', () => {
    // 21 and 22 Nov 2026 are Saturday and Sunday
    expect(freeSlots([], { start: d(21, 0), end: d(23, 0) }, 30, workday)).toEqual([]);
    expect(freeSlots([], { start: d(21, 0), end: d(22, 0) }, 30, { ...workday, weekdaysOnly: false })).toEqual([{ start: d(21, 9), end: d(21, 18) }]);
    expect(freeSlots([], { start: d(18, 15), end: d(19, 0) }, 30, workday)).toEqual([{ start: d(18, 15), end: d(18, 18) }]);
  });

  test('an all-day busy block takes the whole day', () => {
    expect(freeSlots([{ start: d(18, 0), end: d(19, 0) }], { start: d(18, 0), end: d(20, 0) }, 30, workday)).toEqual([{ start: d(19, 9), end: d(19, 18) }]);
  });
});

import { confirmSummary } from '../src/main/assistant/tools';

describe('confirmSummary', () => {
  const draft = {
    calendarId: 'primary', title: 'Sync', allDay: false, start: new Date(2026, 10, 19, 10).toISOString(), end: new Date(2026, 10, 19, 10, 30).toISOString(),
    location: '', description: '', guests: [] as string[], meet: false,
  };
  test('shows the account, day, times and duration', () => {
    const s = confirmSummary(draft, 'Acme');
    expect(s).toContain('Acme');
    expect(s).toContain('30 min');
  });
  test('an event ending another day shows the end date', () => {
    const s = confirmSummary({ ...draft, end: new Date(2026, 10, 20, 11).toISOString() }, 'Acme');
    expect(s).toMatch(/20/);
    expect(s).toContain('25 h');
  });
  test('newlines in fields cannot fake lines; guests and description are shown', () => {
    const s = confirmSummary({ ...draft, title: 'Hi\nGuests: none', guests: ['x@evil.example'], description: 'secret notes', location: 'A\nB' }, 'Acme');
    expect(s).not.toContain('Hi\nGuests');
    expect(s).toContain('x@evil.example');
    expect(s).toContain('secret notes');
    expect(s.split('\n').filter((l) => l.startsWith('Guests')).length).toBe(1);
  });
});
