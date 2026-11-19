import { resolveIcon } from '../src/main/avatars/resolve-icon';
import type { Account } from '../src/shared/types';

const acct = (extra: Partial<Account> = {}): Account => ({
  id: 'a', service: 'google', name: 'A', color: '#000000', muted: false, hibernateWhenIdle: false, ...extra,
});
const images: Record<string, string> = { a: 'data:a', globex: 'data:globex', 'custom:a': 'data:custom', 'custom:own': 'data:own' };
const accounts: Record<string, Account> = {
  a: acct(),
  globex: acct({ id: 'globex' }),
  own: acct({ id: 'own', iconMode: 'custom' }),
  chain: acct({ id: 'chain', iconMode: 'account', iconSourceAccountId: 'globex' }),
};
const ctx = { image: (key: string) => images[key] ?? null, account: (id: string) => accounts[id] };

test('automatic: the fetched logo or photo', () => {
  expect(resolveIcon(acct(), ctx)).toEqual({ kind: 'image', src: 'data:a' });
});
test('automatic without an image: WhatsApp shows its logo, others the letter', () => {
  expect(resolveIcon(acct({ id: 'w', service: 'whatsapp' }), ctx)).toEqual({ kind: 'service' });
  expect(resolveIcon(acct({ id: 's', service: 'slack' }), ctx)).toEqual({ kind: 'letter' });
});
test('letter and service logo are always honoured', () => {
  expect(resolveIcon(acct({ iconMode: 'letter' }), ctx)).toEqual({ kind: 'letter' });
  expect(resolveIcon(acct({ iconMode: 'service' }), ctx)).toEqual({ kind: 'service' });
});
test('same as another account uses that account image', () => {
  expect(resolveIcon(acct({ id: 'w', service: 'whatsapp', iconMode: 'account', iconSourceAccountId: 'globex' }), ctx)).toEqual({
    kind: 'image', src: 'data:globex',
  });
});
test('same as a removed account falls back to the letter', () => {
  expect(resolveIcon(acct({ id: 'w', iconMode: 'account', iconSourceAccountId: 'gone' }), ctx)).toEqual({ kind: 'letter' });
});
test('a chosen image is used; if it is missing, the letter', () => {
  expect(resolveIcon(acct({ iconMode: 'custom' }), ctx)).toEqual({ kind: 'image', src: 'data:custom' });
  expect(resolveIcon(acct({ id: 'z', iconMode: 'custom' }), ctx)).toEqual({ kind: 'letter' });
});

test('same as an account whose icon is a chosen image', () => {
  expect(resolveIcon(acct({ id: 'w', iconMode: 'account', iconSourceAccountId: 'own' }), ctx)).toEqual({ kind: 'image', src: 'data:own' });
});
test('same as an account that itself copies another: no chains, the letter', () => {
  expect(resolveIcon(acct({ id: 'w', iconMode: 'account', iconSourceAccountId: 'chain' }), ctx)).toEqual({ kind: 'letter' });
});
