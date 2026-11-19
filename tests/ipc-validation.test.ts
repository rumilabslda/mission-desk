import { parseUnreadCount, parseNewAccount, parseAccountPatch, parseWeekStart, parseTimes, parseTodoTag, parseCalendarRange, parseDragRef, parseDropZone, parseSidebarStyle } from '../src/main/ipc-validation';

test('accepts a valid new account and trims the name', () => {
  expect(parseNewAccount({ service: 'microsoft', name: 'Initech', color: '#0ea5e9' })).toEqual({ service: 'microsoft', name: 'Initech', color: '#0ea5e9' });
  expect(parseNewAccount({ service: 'slack', name: '  Acme  ', color: '#0ea5e9' })).toEqual({
    service: 'slack', name: 'Acme', color: '#0ea5e9',
  });
});

test.each([
  [{ service: 'teams', name: 'X', color: '#000000' }],
  [{ service: 'google', name: '   ', color: '#000000' }],
  [{ service: 'google', name: 'X', color: 'red' }],
  [{ service: 'google', name: 'x'.repeat(61), color: '#000000' }],
  [null],
  ['google'],
])('rejects invalid new account %j', (input) => {
  expect(parseNewAccount(input)).toBeNull();
});

test('patch keeps only valid known fields', () => {
  expect(parseAccountPatch({ name: ' New ', color: '#ffffff', other: 1 })).toEqual({ name: 'New', color: '#ffffff' });
  expect(parseAccountPatch({ name: '' })).toBeNull();
  expect(parseAccountPatch({ color: 'blue' })).toBeNull();
  expect(parseAccountPatch({})).toEqual({});
});

describe('parseCalendarRange', () => {
  test('accepts a valid 7-day range', () => {
    const r = { start: '2026-11-16T00:00:00.000Z', end: '2026-11-23T00:00:00.000Z' };
    expect(parseCalendarRange(r)).toEqual(r);
  });
  test('accepts a 6-week month grid', () => {
    expect(parseCalendarRange({ start: '2026-10-26T00:00:00.000Z', end: '2026-12-07T00:00:00.000Z' })).not.toBeNull();
  });
  test('rejects bad ranges', () => {
    expect(parseCalendarRange({ start: '2026-11-23T00:00:00.000Z', end: '2026-11-16T00:00:00.000Z' })).toBeNull();
    expect(parseCalendarRange({ start: '2026-11-16T00:00:00.000Z', end: '2026-11-16T00:00:00.000Z' })).toBeNull();
    expect(parseCalendarRange({ start: '2026-01-01T00:00:00.000Z', end: '2026-03-15T00:00:00.000Z' })).toBeNull();
    expect(parseCalendarRange({ start: 'yesterday', end: '2026-11-16T00:00:00.000Z' })).toBeNull();
    expect(parseCalendarRange({ start: '2026-11-16', end: '2026-11-17' })).toBeNull();
    expect(parseCalendarRange('2026-11-16')).toBeNull();
    expect(parseCalendarRange(null)).toBeNull();
  });
});

describe('spaces inputs', () => {
  test('parseDragRef', () => {
    expect(parseDragRef({ kind: 'account', id: 'x' })).toEqual({ kind: 'account', id: 'x' });
    expect(parseDragRef({ kind: 'space', id: 'y', extra: 1 })).toEqual({ kind: 'space', id: 'y' });
    expect(parseDragRef({ kind: 'folder', id: 'x' })).toBeNull();
    expect(parseDragRef({ kind: 'account', id: '' })).toBeNull();
    expect(parseDragRef({ kind: 'account', id: 3 })).toBeNull();
    expect(parseDragRef(null)).toBeNull();
  });
  test('parseDropZone', () => {
    expect(['before', 'after', 'into'].map(parseDropZone)).toEqual(['before', 'after', 'into']);
    expect(parseDropZone('middle')).toBeNull();
  });
  test('parseSidebarStyle', () => {
    expect(['folders', 'panel', 'sections'].map(parseSidebarStyle)).toEqual(['folders', 'panel', 'sections']);
    expect(parseSidebarStyle('grid')).toBeNull();
  });
});

describe('parseNewAccount with a space', () => {
  const base = { service: 'slack', name: 'Acme', color: '#0ea5e9' };
  test('accepts an existing space id', () => {
    expect(parseNewAccount({ ...base, space: { id: 'abc' } })?.space).toEqual({ id: 'abc' });
  });
  test('accepts and trims a new space name', () => {
    expect(parseNewAccount({ ...base, space: { newName: '  Initech ' } })?.space).toEqual({ newName: 'Initech' });
  });
  test('no space means loose', () => {
    expect(parseNewAccount(base)?.space).toBeUndefined();
  });
  test('rejects a bad space', () => {
    expect(parseNewAccount({ ...base, space: { newName: '   ' } })).toBeNull();
    expect(parseNewAccount({ ...base, space: { id: '' } })).toBeNull();
    expect(parseNewAccount({ ...base, space: 'Initech' })).toBeNull();
    expect(parseNewAccount({ ...base, space: { id: 'a', newName: 'b' } })).toBeNull();
  });
});

describe('parseAccountPatch for Settings', () => {
  test('accepts the account settings', () => {
    expect(parseAccountPatch({ muted: true, hibernateWhenIdle: false, claudeAccess: 'read', iconMode: 'letter' })).toEqual({
      muted: true,
      hibernateWhenIdle: false,
      claudeAccess: 'read',
      iconMode: 'letter',
    });
    expect(parseAccountPatch({ iconMode: 'account', iconSourceAccountId: 'abc' })).toEqual({ iconMode: 'account', iconSourceAccountId: 'abc' });
  });
  test('rejects bad values', () => {
    expect(parseAccountPatch({ muted: 'yes' })).toBeNull();
    expect(parseAccountPatch({ claudeAccess: 'admin' })).toBeNull();
    expect(parseAccountPatch({ iconMode: 'custom' })).toBeNull(); // a custom image is chosen in main, not sent
    expect(parseAccountPatch({ iconMode: 'account' })).toBeNull(); // needs whose image
    expect(parseAccountPatch({ iconSourceAccountId: 'abc' })).toBeNull(); // only with iconMode 'account'
  });
});

describe('parseWeekStart', () => {
  test('auto, Sunday or Monday', () => {
    expect(parseWeekStart('auto')).toBe('auto');
    expect(parseWeekStart(0)).toBe(0);
    expect(parseWeekStart(1)).toBe(1);
    expect(parseWeekStart(2)).toBeNull();
    expect(parseWeekStart('1')).toBeNull();
  });
});

describe('parseTimes (drag moves)', () => {
  test('timed or all-day, end after start', () => {
    expect(parseTimes('2026-11-18T10:00:00.000Z', '2026-11-18T11:00:00.000Z', false)).toEqual({ start: '2026-11-18T10:00:00.000Z', end: '2026-11-18T11:00:00.000Z', allDay: false });
    expect(parseTimes('2026-11-18', '2026-11-19', true)).toEqual({ start: '2026-11-18', end: '2026-11-19', allDay: true });
    expect(parseTimes('2026-11-18T11:00:00.000Z', '2026-11-18T10:00:00.000Z', false)).toBeNull();
    expect(parseTimes('2026-11-18', '2026-11-19', false)).toBeNull();
    expect(parseTimes(1, 2, false)).toBeNull();
  });
});

describe('to-do inputs', () => {
  test('tags: a space or an account id, or none', () => {
    expect(parseTodoTag({ kind: 'space', id: 'abc' })).toEqual({ kind: 'space', id: 'abc' });
    expect(parseTodoTag(undefined)).toBeUndefined();
    expect(parseTodoTag(null)).toBeNull();
    expect(parseTodoTag({ kind: 'folder', id: 'x' })).toBe(false);
    expect(parseTodoTag({ kind: 'space', id: '' })).toBe(false);
  });
});

test('an unread count from a page is a whole number in range', () => {
  expect(parseUnreadCount(0)).toBe(0);
  expect(parseUnreadCount(42)).toBe(42);
  for (const bad of [-1, 1.5, NaN, Infinity, 1_000_001, '3', null, undefined, {}]) expect(parseUnreadCount(bad)).toBeNull();
});
