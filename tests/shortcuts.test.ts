import { accountIdForShortcut } from '../src/main/menu/shortcuts';
import type { Account } from '../src/shared/types';

const accounts: Account[] = Array.from({ length: 12 }, (_, i) => ({
  id: `id${i + 1}`, service: 'google', name: `A${i + 1}`, color: '#000000', muted: false, hibernateWhenIdle: false,
}));

test('⌘1 and ⌘9 select the first and ninth account with 12 accounts', () => {
  expect(accountIdForShortcut(accounts, 1)).toBe('id1');
  expect(accountIdForShortcut(accounts, 9)).toBe('id9');
});

test('a shortcut past the last account selects nothing', () => {
  expect(accountIdForShortcut(accounts.slice(0, 2), 3)).toBeNull();
});

test('out-of-range numbers select nothing', () => {
  expect(accountIdForShortcut(accounts, 0)).toBeNull();
  expect(accountIdForShortcut(accounts, 10)).toBeNull();
});
