import { formatNotification, shouldNotify } from '../src/main/notifications/format';
import type { Account } from '../src/shared/types';

const acct = (extra: Partial<Account> = {}): Account => ({
  id: 'a', service: 'slack', name: 'Client X', color: '#000000', muted: false, hibernateWhenIdle: false, ...extra,
});

test('title names the account and service; subtitle and body come from the page', () => {
  expect(formatNotification(acct(), { title: 'João', body: 'can you check?' })).toEqual({
    title: 'Client X · Slack', subtitle: 'João', body: 'can you check?',
  });
});

test('missing body becomes empty', () => {
  expect(formatNotification(acct({ service: 'google' }), { title: 'New mail' }).body).toBe('');
});

test('non-string payload fields are ignored safely', () => {
  expect(formatNotification(acct(), { title: 42 as unknown as string, body: { x: 1 } as unknown as string })).toEqual({
    title: 'Client X · Slack', subtitle: '', body: '',
  });
});

test('very long text is truncated', () => {
  const n = formatNotification(acct(), { title: 't'.repeat(500), body: 'b'.repeat(2000) });
  expect(n.subtitle.length).toBeLessThanOrEqual(200);
  expect(n.body.length).toBeLessThanOrEqual(500);
});

test('muted accounts do not notify', () => {
  expect(shouldNotify(acct({ muted: true }))).toBe(false);
  expect(shouldNotify(acct())).toBe(true);
});
