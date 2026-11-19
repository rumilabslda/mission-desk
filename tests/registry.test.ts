import { createViewRegistry } from '../src/main/views/registry';

test('same kind in two accounts maps each webContents to its own account', () => {
  const r = createViewRegistry<string>();
  r.set('a', 'main', 'view-a', 101);
  r.set('b', 'main', 'view-b', 202);
  expect(r.accountFor(101)).toEqual({ accountId: 'a', kind: 'main' });
  expect(r.accountFor(202)).toEqual({ accountId: 'b', kind: 'main' });
  expect(r.get('a', 'main')).toBe('view-a');
  expect(r.get('b', 'main')).toBe('view-b');
});

test('removeAccount returns every live view and forgets their webContents ids', () => {
  const r = createViewRegistry<string>();
  r.set('a', 'main', 'gmail', 1);
  r.set('a', 'calendar', 'cal', 2);
  r.set('a', 'extra:1', 'doc', 3);
  r.set('b', 'main', 'other', 4);
  expect(r.removeAccount('a').sort()).toEqual(['cal', 'doc', 'gmail']);
  expect(r.accountFor(1)).toBeUndefined();
  expect(r.accountFor(3)).toBeUndefined();
  expect(r.accountFor(4)).toEqual({ accountId: 'b', kind: 'main' });
});

test('removeAccount on a hibernated account returns [] and drops its urls', () => {
  const r = createViewRegistry<string>();
  r.setLastUrl('a', 'main', 'https://mail.google.com/');
  expect(r.removeAccount('a')).toEqual([]);
  expect(r.lastUrl('a', 'main')).toBeUndefined();
});

test('removeAccount on an unknown account does not throw', () => {
  expect(createViewRegistry<string>().removeAccount('nope')).toEqual([]);
});

test('removeView keeps the last url for restoring after hibernation', () => {
  const r = createViewRegistry<string>();
  r.set('a', 'calendar', 'cal', 7);
  r.setLastUrl('a', 'calendar', 'https://calendar.google.com/r/week');
  expect(r.removeView('a', 'calendar')).toBe('cal');
  expect(r.get('a', 'calendar')).toBeUndefined();
  expect(r.accountFor(7)).toBeUndefined();
  expect(r.lastUrl('a', 'calendar')).toBe('https://calendar.google.com/r/week');
});

test('kinds lists live views of an account', () => {
  const r = createViewRegistry<string>();
  r.set('a', 'main', 'x', 1);
  r.set('a', 'extra:2', 'y', 2);
  expect(r.kinds('a').sort()).toEqual(['extra:2', 'main']);
});
