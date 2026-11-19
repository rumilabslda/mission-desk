import { distinctColors } from '../src/renderer/src/calendar/colors';
import { ACCOUNT_COLORS } from '../src/shared/ipc';

test('accounts keep their own colour when it is unique', () => {
  const m = distinctColors([
    { id: 'a', color: '#0ea5e9' },
    { id: 'b', color: '#4f46e5' },
  ]);
  expect(m.get('a')).toBe('#0ea5e9');
  expect(m.get('b')).toBe('#4f46e5');
});

test('a repeated colour gets the first unused palette colour; the first account keeps it', () => {
  const m = distinctColors([
    { id: 'a', color: '#0ea5e9' },
    { id: 'b', color: '#4f46e5' },
    { id: 'c', color: '#10b981' },
    { id: 'd', color: '#10B981' },
  ]);
  expect(m.get('c')).toBe('#10b981');
  const d = m.get('d')!;
  expect(ACCOUNT_COLORS).toContain(d);
  expect(new Set([...m.values()].map((x) => x.toLowerCase())).size).toBe(4);
});

test('more accounts than palette colours falls back to the account colour', () => {
  const many = Array.from({ length: ACCOUNT_COLORS.length + 2 }, (_, i) => ({ id: `x${i}`, color: '#4f46e5' }));
  const m = distinctColors(many);
  expect(m.size).toBe(many.length);
  expect(m.get(`x${ACCOUNT_COLORS.length + 1}`)).toBe('#4f46e5');
});
