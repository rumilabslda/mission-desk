import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyRetention, spacesLeftEmpty } from '../src/main/meetings/lifecycle';
import { createMeetingStore } from '../src/main/meetings/store';
import { applyDrop, assignSpace, ungroupSpace } from '../src/shared/spaces';

const spaces = [
  { id: 'a', name: 'Acme' },
  { id: 'b', name: 'Beta' },
];
const accounts = [
  { id: '1', spaceId: 'a' },
  { id: '2', spaceId: 'a' },
  { id: '3', spaceId: 'b' },
];

test('a change that empties a space is seen before it happens', () => {
  expect(spacesLeftEmpty(spaces, ungroupSpace(accounts, 'a')).map((s) => s.id)).toEqual(['a']);
  expect(spacesLeftEmpty(spaces, assignSpace(accounts, spaces, '3', null)).map((s) => s.id)).toEqual(['b']);
  expect(spacesLeftEmpty(spaces, assignSpace(accounts, spaces, '1', null))).toEqual([]);
  expect(spacesLeftEmpty(spaces, accounts.filter((a) => a.id !== '3')).map((s) => s.id)).toEqual(['b']);
  const drop = applyDrop(accounts, spaces, { kind: 'account', id: '3' }, { kind: 'space', id: 'a' }, 'into');
  expect(drop && 'accounts' in drop ? spacesLeftEmpty(spaces, drop.accounts).map((s) => s.id) : null).toEqual(['b']);
});

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ret-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('retention prunes old transcripts only when it is set', () => {
  const now = new Date('2026-11-22T10:00:00Z');
  const store = createMeetingStore(dir, () => now);
  const m = store.create({ scope: 'space:a', accountId: '1', provider: 'meet', url: 'u', title: 'Old', startedAt: '2026-09-01T10:00:00.000Z', language: 'pt-PT', engine: 'apple' });
  store.append('space:a', m.id, [{ start: 0, end: 1, speaker: 'me', text: 'x' }]);
  store.update('space:a', m.id, { endedAt: '2026-09-01T11:00:00.000Z' });
  expect(applyRetention(store, undefined)).toBe(0);
  expect(applyRetention(store, 0)).toBe(0);
  expect(store.get('space:a', m.id)!.segments).toHaveLength(1);
  expect(applyRetention(store, 30)).toBe(1);
  expect(store.get('space:a', m.id)!.segments).toEqual([]);
});

test('a pruned transcript loses its insights', () => {
  const now = new Date('2026-11-22T10:00:00Z');
  const store = createMeetingStore(dir, () => now);
  const m = store.create({ scope: 'space:a', accountId: '1', provider: 'meet', url: 'u', title: 'Old', startedAt: '2026-09-01T10:00:00.000Z', language: 'pt-PT', engine: 'apple' });
  store.append('space:a', m.id, [{ start: 0, end: 1, speaker: 'me', text: 'x' }]);
  store.addInsight('space:a', m.id, { id: 'i1', at: 0, kind: 'past', text: 't', said: 'x', sources: [] });
  store.update('space:a', m.id, { endedAt: '2026-09-01T11:00:00.000Z' });
  applyRetention(store, 30);
  expect(store.get('space:a', m.id)!.insights).toBeUndefined();
});
