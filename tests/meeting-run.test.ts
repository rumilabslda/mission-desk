import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMeetingRunner } from '../src/main/meetings/run';
import { createMeetingStore } from '../src/main/meetings/store';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-run-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function runner(answer: () => Promise<string>) {
  const store = createMeetingStore(dir);
  const m = store.create({ scope: 'space:s1', accountId: 'g1', provider: 'meet', url: 'u', title: 'Weekly sync', startedAt: '2026-11-22T10:00:00.000Z', language: 'pt-PT', engine: 'apple' });
  store.append('space:s1', m.id, [{ start: 0, end: 1000, speaker: 'me', text: 'Envio a proposta.' }]);
  const todos: string[] = [];
  const progress: string[] = [];
  const saved: unknown[] = [];
  const r = createMeetingRunner({
    store,
    askFor: () => async () => answer(),
    notes: () => [],
    guests: async () => ['maria@acme.com'],
    myName: () => 'Me',
    addTodo: (text) => void todos.push(text),
    tagFor: () => ({ kind: 'space', id: 's1' }),
    saveActions: (scope, actions) => saved.push([scope, actions]),
    progress: (_m, state) => progress.push(state),
    push: () => {},
  });
  return { r, store, m, todos, progress, saved };
}

test('a run stores the result, applies the to-dos and remembers the choice', async () => {
  const { r, store, m, todos, progress, saved } = runner(async () => '{"summary":{"decisions":[],"points":["Q1"],"nextSteps":[]},"myTodos":["Send the proposal"]}');
  await r.run('space:s1', m.id, ['summary', 'myTodos']);
  const done = store.get('space:s1', m.id)!;
  expect(done.result?.myTodos).toEqual(['Send the proposal']);
  expect(done.applied).toEqual(['summary', 'myTodos']);
  expect(todos).toEqual(['Send the proposal']);
  expect(saved).toEqual([['space:s1', ['summary', 'myTodos']]]);
  expect(progress).toEqual(['busy', 'done']);
  expect(r.state(m.id)).toBeUndefined();
});

test('a failed run applies nothing and says it failed', async () => {
  const { r, store, m, todos, progress } = runner(async () => 'not json');
  await r.run('space:s1', m.id, ['summary', 'myTodos']);
  expect(store.get('space:s1', m.id)!.applied).toBeUndefined();
  expect(todos).toEqual([]);
  expect(r.state(m.id)).toBe('failed');
  expect(r.error(m.id)).toMatch(/usable/);
  expect(progress).toEqual(['busy', 'error']);
});

test('a meeting from another scope is never run', async () => {
  const { r, m, progress } = runner(async () => '{}');
  await r.run('space:other', m.id, ['summary']);
  expect(progress).toEqual([]);
});
