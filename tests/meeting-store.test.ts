import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMeetingStore } from '../src/main/meetings/store';
import type { Meeting } from '../src/shared/meeting';

let dir: string;
let now = new Date('2026-11-22T10:00:00Z');
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-mstore-'));
  now = new Date('2026-11-22T10:00:00Z');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const store = () => createMeetingStore(dir, () => now);
const base = (scope: string): Omit<Meeting, 'id' | 'segments' | 'gaps'> => ({
  scope,
  accountId: 'a1',
  provider: 'meet',
  url: 'https://meet.google.com/abc-defg-hij',
  title: 'Weekly sync',
  startedAt: '2026-11-22T09:00:00Z',
  language: 'pt-PT',
  engine: 'apple',
});

test('a space’s meetings are never read from another space', () => {
  const s = store();
  const m = s.create(base('space:a'));
  expect(s.get('space:a', m.id)?.title).toBe('Weekly sync');
  expect(s.get('space:b', m.id)).toBeNull();
  expect(s.list('space:b')).toEqual([]);
  expect(s.list('space:a').map((x) => x.id)).toEqual([m.id]);
  expect(s.remove('space:b', m.id)).toBe(false);
  expect(s.get('space:a', m.id)).not.toBeNull();
});

test('appending writes atomically, readable only by the user', () => {
  const s = store();
  const m = s.create(base('nospace'));
  s.append('nospace', m.id, [{ start: 0, end: 1000, speaker: 'me', text: 'Olá' }]);
  s.append('nospace', m.id, [{ start: 1000, end: 2000, speaker: 'others', text: 'Bom dia' }]);
  expect(s.get('nospace', m.id)?.segments.map((x) => x.text)).toEqual(['Olá', 'Bom dia']);
  const files = fs.readdirSync(path.join(dir, 'nospace'));
  expect(files.filter((f) => f.endsWith('.tmp'))).toEqual([]);
  expect(fs.statSync(path.join(dir, 'nospace', `${m.id}.json`)).mode & 0o777).toBe(0o600);
});

test('a corrupt file is skipped', () => {
  const s = store();
  s.create(base('space:a'));
  fs.writeFileSync(path.join(dir, 'space-a', 'broken.json'), '{nope');
  expect(s.list('space:a')).toHaveLength(1);
});

test('removing a scope leaves the others', () => {
  const s = store();
  s.create(base('space:a'));
  s.create(base('space:a'));
  s.create(base('space:b'));
  expect(s.count('space:a')).toBe(2);
  expect(s.removeScope('space:a')).toBe(2);
  expect(s.list('space:a')).toEqual([]);
  expect(s.list('space:b')).toHaveLength(1);
  expect(s.pruneScopes((sc) => sc !== 'space:b')).toBe(1);
  expect(s.list('space:b')).toEqual([]);
});

test('retention empties old transcripts and keeps the summary', () => {
  const s = store();
  const old = s.create(base('space:a'));
  s.append('space:a', old.id, [{ start: 0, end: 1, speaker: 'me', text: 'x' }]);
  s.update('space:a', old.id, { endedAt: '2026-10-01T10:00:00Z', result: { myTodos: ['Send the deck'] } });
  const recent = s.create(base('space:a'));
  s.append('space:a', recent.id, [{ start: 0, end: 1, speaker: 'me', text: 'y' }]);
  s.update('space:a', recent.id, { endedAt: '2026-11-20T10:00:00Z' });
  expect(s.pruneTranscripts(30)).toBe(1);
  const o = s.get('space:a', old.id)!;
  expect(o.segments).toEqual([]);
  expect(o.transcriptPruned).toBe(true);
  expect(o.result).toEqual({ myTodos: ['Send the deck'] });
  expect(s.get('space:a', recent.id)!.segments).toHaveLength(1);
});

test('ids that could leave the folder are refused', () => {
  const s = store();
  const m = s.create(base('space:a'));
  for (const bad of ['../x', 'a/b', '..', '']) {
    expect(s.get('space:a', bad)).toBeNull();
    expect(s.remove('space:a', bad)).toBe(false);
    expect(() => s.append('space:a', bad, [])).not.toThrow();
  }
  expect(s.get('../space:a', m.id)).toBeNull();
});

test('the list says how long and in what state, newest first', () => {
  const s = store();
  const a = s.create({ ...base('nospace'), startedAt: '2026-11-22T08:00:00Z' });
  s.update('nospace', a.id, { endedAt: '2026-11-22T08:42:00Z' });
  const b = s.create({ ...base('nospace'), startedAt: '2026-11-22T09:30:00Z' });
  s.update('nospace', b.id, { endedAt: '2026-11-22T09:40:00Z', result: { summary: { decisions: [], points: [], nextSteps: [] } } });
  const list = s.list('nospace');
  expect(list.map((x) => [x.id, x.minutes, x.state])).toEqual([
    [b.id, 10, 'ready'],
    [a.id, 42, 'notRun'],
  ]);
  const live = s.create({ ...base('nospace'), startedAt: '2026-11-22T09:50:00Z' });
  expect(s.list('nospace', live.id)[0]).toMatchObject({ id: live.id, state: 'transcribing', minutes: 10 });
});

import { vi } from 'vitest';

test('I8: listing (every snapshot) reads no files once a scope is known; writes keep the list current', () => {
  const s = store();
  const m = s.create(base('space:a'));
  s.create(base('space:a'));
  expect(s.list('space:a')).toHaveLength(2);
  const reads = vi.spyOn(fs, 'readFileSync');
  for (let i = 0; i < 5; i++) s.list('space:a');
  s.count('space:a');
  expect(reads).not.toHaveBeenCalled();
  reads.mockRestore();
  s.update('space:a', m.id, { endedAt: '2026-11-22T09:30:00Z', result: { myTodos: ['x'] } });
  expect(s.list('space:a').find((x) => x.id === m.id)).toMatchObject({ state: 'ready', minutes: 30 });
  s.remove('space:a', m.id);
  expect(s.list('space:a')).toHaveLength(1);
});

const insight = (id: string): import('../src/shared/meeting').MeetingInsight => ({ id, at: 1000, kind: 'past', text: `insight ${id}`, said: 'x', sources: [{ label: 'Memory', text: 'note', open: { kind: 'memory', scope: 'space:a' } }] });

test('insights are saved and marked', () => {
  const s = store();
  const m = s.create(base('space:a'));
  s.addInsight('space:a', m.id, insight('i1'));
  s.addInsight('space:a', m.id, insight('i2'));
  expect(s.markInsight('space:a', m.id, 'i2', true)?.notUseful).toBe(true);
  expect(s.get('space:a', m.id)?.insights?.map((i) => [i.id, !!i.notUseful])).toEqual([
    ['i1', false],
    ['i2', true],
  ]);
});

test('markInsight on an unknown id returns null', () => {
  const s = store();
  const m = s.create(base('space:a'));
  expect(s.markInsight('space:a', m.id, 'nope', true)).toBeNull();
  expect(s.markInsight('space:b', m.id, 'nope', true)).toBeNull();
});

test('summaries come from memory, newest first, without the live one', () => {
  const s = store();
  const a = s.create({ ...base('space:a'), startedAt: '2026-11-01T10:00:00Z' });
  const b = s.create({ ...base('space:a'), startedAt: '2026-11-02T10:00:00Z' });
  const live = s.create({ ...base('space:a'), startedAt: '2026-11-03T10:00:00Z' });
  s.create(base('space:a'));
  s.list('space:a'); // the scope is read from disk once
  const summary = { decisions: ['Preço fixo'], points: [], nextSteps: [] };
  for (const m of [a, b, live]) s.update('space:a', m.id, { result: { summary } });
  fs.rmSync(path.join(dir, 'space-a', `${a.id}.json`));
  expect(s.summaries('space:a', 50, live.id).map((x) => x.id)).toEqual([b.id, a.id]);
  expect(s.summaries('space:a', 1, live.id)).toEqual([{ id: b.id, scope: 'space:a', startedAt: '2026-11-02T10:00:00Z', result: { summary } }]);
});
