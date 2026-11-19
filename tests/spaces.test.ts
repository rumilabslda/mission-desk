import { accountIdForShortcut } from '../src/main/menu/shortcuts';
import {
  applyDrop,
  assignSpace,
  cleanSpaceName,
  groupInto,
  moveWithinContainer,
  dropZoneFor,
  normalizeSpaces,
  sidebarItems,
  spaceUnread,
  ungroupSpace,
} from '../src/shared/spaces';
import type { Account, Space } from '../src/shared/types';

type M = { id: string; spaceId?: string };
const acc = (spec: string): M[] =>
  spec.split(' ').map((t) => {
    const [id, s] = t.split(':');
    return s ? { id, spaceId: s } : { id };
  });
const show = (list: M[]): string => list.map((a) => (a.spaceId ? `${a.id}:${a.spaceId}` : a.id)).join(' ');
const S: Space = { id: 'S', name: 'Space S' };
const T: Space = { id: 'T', name: 'Space T' };

describe('normalizeSpaces', () => {
  test('clears unknown space ids and drops empty spaces', () => {
    const r = normalizeSpaces(acc('a:X b c:S'), [S, T]);
    expect(show(r.accounts)).toBe('a b c:S');
    expect(r.spaces.map((s) => s.id)).toEqual(['S']);
  });
  test('pulls members together at the first member', () => {
    expect(show(normalizeSpaces(acc('a:S b c:S d'), [S]).accounts)).toBe('a:S c:S b d');
  });
  test('is idempotent', () => {
    const once = normalizeSpaces(acc('a:S b c:S d:T e f:T'), [S, T]);
    const twice = normalizeSpaces(once.accounts, once.spaces);
    expect(show(twice.accounts)).toBe(show(once.accounts));
    expect(show(once.accounts)).toBe('a:S c:S b d:T f:T e');
  });
});

test('sidebarItems lists loose accounts and spaces in order', () => {
  const items = sidebarItems(acc('a b:S c:S d'), [S]);
  expect(items.map((i) => (i.kind === 'account' ? i.account.id : `[${i.space.id}:${i.accounts.map((a) => a.id).join(',')}]`))).toEqual([
    'a',
    '[S:b,c]',
    'd',
  ]);
});

test('groupInto puts members together, in order, at the first member’s index', () => {
  expect(show(groupInto(acc('a b c d'), ['c', 'a'], 'S'))).toBe('b c:S a:S d');
});

describe('assignSpace', () => {
  test('into a space: after its last member', () => {
    expect(show(assignSpace(acc('d a b:S c:S'), [S], 'd', 'S'))).toBe('a b:S c:S d:S');
  });
  test('to none: right after its old space', () => {
    expect(show(assignSpace(acc('a b:S c:S d'), [S], 'b', null))).toBe('a c:S b d');
  });
});

describe('applyDrop', () => {
  const base = () => acc('a b:S c:S d e');
  const A = (id: string) => ({ kind: 'account' as const, id });
  const SP = (id: string) => ({ kind: 'space' as const, id });
  const moved = (r: ReturnType<typeof applyDrop>) => (r && 'accounts' in r ? show(r.accounts as M[]) : r);

  test('account onto the middle of a loose account asks to create a space', () => {
    expect(applyDrop(base(), [S], A('e'), A('d'), 'into')).toEqual({ create: ['d', 'e'] });
  });
  test('account into an account in a space joins right after it', () => {
    expect(moved(applyDrop(base(), [S], A('e'), A('b'), 'into'))).toBe('a b:S e:S c:S d');
  });
  test('account into a space joins at its end', () => {
    expect(moved(applyDrop(base(), [S], A('a'), SP('S'), 'into'))).toBe('b:S c:S a:S d e');
  });
  test('account before/after an account in a space joins it there', () => {
    expect(moved(applyDrop(base(), [S], A('d'), A('b'), 'before'))).toBe('a d:S b:S c:S e');
    expect(moved(applyDrop(base(), [S], A('d'), A('c'), 'after'))).toBe('a b:S c:S d:S e');
  });
  test('account before/after a loose account becomes loose there (drag out of a space)', () => {
    expect(moved(applyDrop(base(), [S], A('b'), A('e'), 'after'))).toBe('a c:S d e b');
    expect(moved(applyDrop(base(), [S], A('c'), A('a'), 'before'))).toBe('c a b:S d e');
  });
  test('a space moves as a block around loose accounts', () => {
    expect(moved(applyDrop(base(), [S], SP('S'), A('e'), 'after'))).toBe('a d e b:S c:S');
    expect(moved(applyDrop(base(), [S], SP('S'), A('a'), 'before'))).toBe('b:S c:S a d e');
    expect(moved(applyDrop(base(), [S], SP('S'), A('d'), 'into'))).toBe('a d b:S c:S e');
  });
  test('a space dropped on another space’s member goes before/after that space', () => {
    const list = acc('a:T b:T c d:S e:S');
    expect(moved(applyDrop(list, [S, T], SP('S'), A('b'), 'after'))).toBe('a:T b:T d:S e:S c');
    expect(moved(applyDrop(list, [S, T], SP('S'), A('b'), 'before'))).toBe('d:S e:S a:T b:T c');
  });
  test('no-ops', () => {
    expect(applyDrop(base(), [S], A('a'), A('a'), 'into')).toBeNull();
    expect(applyDrop(base(), [S], SP('S'), A('b'), 'before')).toBeNull();
    expect(applyDrop(base(), [S], SP('S'), SP('S'), 'into')).toBeNull();
    expect(applyDrop(base(), [S], A('zz'), A('a'), 'into')).toBeNull();
  });
});

describe('moveWithinContainer', () => {
  test('inside a space it swaps with the neighbour member', () => {
    expect(show(moveWithinContainer(acc('a b:S c:S d'), [S], 'c', -1))).toBe('a c:S b:S d');
  });
  test('at the edge of a space nothing changes', () => {
    expect(show(moveWithinContainer(acc('a b:S c:S d'), [S], 'b', -1))).toBe('a b:S c:S d');
  });
  test('a loose account jumps over a whole space', () => {
    expect(show(moveWithinContainer(acc('a b:S c:S d'), [S], 'd', -1))).toBe('a d b:S c:S');
  });
});

test('ungroupSpace keeps the order', () => {
  expect(show(ungroupSpace(acc('a b:S c:S d'), 'S'))).toBe('a b c d');
});

test('spaceUnread sums numbers, skips muted accounts, and falls back to a dot', () => {
  expect(spaceUnread([{ unread: 3, muted: false }, { unread: 2, muted: false }])).toBe(5);
  expect(spaceUnread([{ unread: 3, muted: false }, { unread: 7, muted: true }])).toBe(3);
  expect(spaceUnread([{ unread: 0, muted: false }, { unread: 'dot', muted: false }])).toBe('dot');
  expect(spaceUnread([{ unread: 'dot', muted: true }])).toBe(0);
  expect(spaceUnread([])).toBe(0);
});

test('cleanSpaceName', () => {
  expect(cleanSpaceName('  Initech ')).toBe('Initech');
  expect(cleanSpaceName('')).toBeNull();
  expect(cleanSpaceName('   ')).toBeNull();
  expect(cleanSpaceName('x'.repeat(41))).toBeNull();
  expect(cleanSpaceName(5)).toBeNull();
});

test('⌘3 is the second account inside a closed space', () => {
  const list = acc('a b:S c:S d').map((a) => ({ ...a, service: 'google', name: a.id, color: '#000000', muted: false, hibernateWhenIdle: false })) as Account[];
  expect(accountIdForShortcut(list, 3)).toBe('c');
});

describe('dropZoneFor', () => {
  test('an account over an account or a space: edges are before/after, the middle is into', () => {
    for (const target of ['account', 'space'] as const) {
      expect(dropZoneFor('account', target, 0.1)).toBe('before');
      expect(dropZoneFor('account', target, 0.5)).toBe('into');
      expect(dropZoneFor('account', target, 0.9)).toBe('after');
    }
  });
  test('a space is only ever placed before or after', () => {
    for (const target of ['account', 'space'] as const) {
      expect(dropZoneFor('space', target, 0.2)).toBe('before');
      expect(dropZoneFor('space', target, 0.5)).toBe('after');
      expect(dropZoneFor('space', target, 0.8)).toBe('after');
    }
  });
});

describe('dropping where an account already is', () => {
  const A = (id: string) => ({ kind: 'account' as const, id });
  test('a member dropped into its own space changes nothing', () => {
    expect(applyDrop(acc('a b:S c:S d'), [S], A('b'), { kind: 'space', id: 'S' }, 'into')).toBeNull();
  });
  test('assigning a member to its own space keeps the order', () => {
    expect(show(assignSpace(acc('a b:S c:S d'), [S], 'b', 'S'))).toBe('a b:S c:S d');
  });
  test('an account can be dragged out to sit loose before or after a space', () => {
    const r = applyDrop(acc('b:S c:S d:T e:T'), [S, T], A('c'), { kind: 'space', id: 'T' }, 'before');
    expect(r && 'accounts' in r ? show(r.accounts as M[]) : r).toBe('b:S c d:T e:T');
  });
});
