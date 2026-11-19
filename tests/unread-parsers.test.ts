import fixtures from './fixtures/page-titles.json';
import { parseUnread } from '../src/main/unread/parsers';
import type { ServiceId, UnreadCount } from '../src/shared/types';

type Fixture = { service: ServiceId; title: string; expected: UnreadCount | null };

test.each(fixtures as Fixture[])('$service: "$title" → $expected', (f) => {
  expect(parseUnread(f.service, f.title)).toEqual(f.expected);
});

test('gmail counts with thousands separators', () => {
  expect(parseUnread('google', 'Inbox (1,234) - user@example.com - Gmail')).toBe(1234);
});

test('gmail portuguese inbox', () => {
  expect(parseUnread('google', 'Caixa de entrada (7) - user@example.com - Gmail')).toBe(7);
});

test('whatsapp count and zero', () => {
  expect(parseUnread('whatsapp', '(12) WhatsApp')).toBe(12);
  expect(parseUnread('whatsapp', 'WhatsApp')).toBe(0);
});

test('empty slack title is unknown', () => {
  expect(parseUnread('slack', '')).toBeNull();
});
