import { readFileSync } from 'node:fs';

// The calendar marks the current day with the class "today" (week header, month grid, mini month).
// A page-level rule on a bare ".today" also styles those days: it once lifted the 18th out of the
// week view. Page containers use their own names (e.g. Home is ".td-page").
test('no style rule targets a bare .today (it would hit the calendar\'s current day)', () => {
  const css = readFileSync('src/renderer/src/styles.css', 'utf8');
  const bare = css.split('\n').filter((line) => /(^|[\s,{}])\.today\s*[{,]/.test(line));
  expect(bare).toEqual([]);
});

// ".mini" is the small account avatar (fixed size, cropped). The calendar's month picker once used it
// as its container and was squeezed into an avatar-sized box.
test('the mini month has its own container class, not the avatar\'s .mini', () => {
  const tsx = readFileSync('src/renderer/src/calendar/MiniMonth.tsx', 'utf8');
  expect(tsx).not.toMatch(/className="mini"/);
});
