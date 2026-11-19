import { createUnreadTracker, dockBadgeText } from '../src/main/unread/aggregator';

test('dock badge sums numeric counts', () => {
  expect(dockBadgeText([3, 0, 'dot', 2])).toBe('5');
});
test('dock badge shows a dot when only dots exist', () => {
  expect(dockBadgeText([0, 'dot'])).toBe('•');
});
test('dock badge is empty with nothing unread', () => {
  expect(dockBadgeText([])).toBe('');
  expect(dockBadgeText([0, 0])).toBe('');
});

test('tracker keeps the last count when the title becomes unknown (Gmail outside Inbox)', () => {
  const t = createUnreadTracker();
  expect(t.update('a', 'Inbox (4) - user@example.com - Gmail', 'google')).toBe(true);
  expect(t.update('a', 'Sent Mail - user@example.com - Gmail', 'google')).toBe(false);
  expect(t.get('a')).toBe(4);
});

test('tracker reports no change for the same value', () => {
  const t = createUnreadTracker();
  t.update('a', '(2) WhatsApp', 'whatsapp');
  expect(t.update('a', '(2) WhatsApp', 'whatsapp')).toBe(false);
  expect(t.update('a', 'WhatsApp', 'whatsapp')).toBe(true);
  expect(t.get('a')).toBe(0);
});

test('tracker defaults to 0 and remove drops the account', () => {
  const t = createUnreadTracker();
  expect(t.get('x')).toBe(0);
  t.update('a', '(1) WhatsApp', 'whatsapp');
  t.update('b', '(2) WhatsApp', 'whatsapp');
  t.remove('a');
  expect(t.all()).toEqual([2]);
});
