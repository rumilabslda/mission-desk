import { effectiveWeekStart } from '../src/shared/week-start';

test('a chosen week start wins over the Mac’s', () => {
  expect(effectiveWeekStart(undefined, 1)).toBe(1);
  expect(effectiveWeekStart(undefined, 0)).toBe(0);
  expect(effectiveWeekStart(0, 1)).toBe(0);
  expect(effectiveWeekStart(1, 0)).toBe(1);
});
