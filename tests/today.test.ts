import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTodoStore } from '../src/main/todos/store';
import { clashes, greeting, nextEvent, todayView, opensOnToday } from '../src/shared/today';
import type { CalEvent, Todo } from '../src/shared/types';

let dir: string;
let file: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-todos-'));
  file = path.join(dir, 'todos.json');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('todo store', () => {
  test('add, edit, tick and remove persist', () => {
    const s = createTodoStore(file, () => new Date(2026, 10, 18, 9));
    const a = s.add('  Send the proposal to Acme ', { kind: 'space', id: 'sp1' })!;
    expect(a).toMatchObject({ text: 'Send the proposal to Acme', done: false, day: '2026-11-18', tag: { kind: 'space', id: 'sp1' } });
    s.update(a.id, { text: 'Send the proposal', done: true });
    const b = s.add('Call Initech')!;
    s.remove(b.id);
    const again = createTodoStore(file, () => new Date(2026, 10, 18, 10)).list();
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({ text: 'Send the proposal', done: true });
    expect(again[0].doneAt).toBeDefined();
  });

  test('bad input is refused; unknown ids are ignored', () => {
    const s = createTodoStore(file, () => new Date(2026, 10, 18));
    expect(s.add('   ')).toBeNull();
    expect(s.add('x'.repeat(501))).toBeNull();
    s.update('nope', { done: true });
    s.remove('nope');
    expect(s.list()).toEqual([]);
  });

  test('un-ticking clears doneAt; clearDone drops only done items', () => {
    const s = createTodoStore(file, () => new Date(2026, 10, 18));
    const a = s.add('a')!;
    const b = s.add('b')!;
    s.update(a.id, { done: true });
    s.update(a.id, { done: false });
    expect(s.list().find((t) => t.id === a.id)?.doneAt).toBeUndefined();
    s.update(b.id, { done: true });
    s.clearDone();
    expect(s.list().map((t) => t.text)).toEqual(['a']);
  });

  test('done items older than 30 days are dropped on load', () => {
    fs.writeFileSync(
      file,
      JSON.stringify([
        { id: '1', text: 'old done', done: true, createdAt: '2026-09-01T09:00:00.000Z', doneAt: '2026-09-02T09:00:00.000Z', day: '2026-09-01' },
        { id: '2', text: 'old open', done: false, createdAt: '2026-09-01T09:00:00.000Z', day: '2026-09-01' },
      ]),
    );
    expect(createTodoStore(file, () => new Date(2026, 10, 18)).list().map((t) => t.id)).toEqual(['2']);
  });

  test('a corrupt file starts empty and is kept as .bak', () => {
    fs.writeFileSync(file, '{oops');
    expect(createTodoStore(file, () => new Date()).list()).toEqual([]);
    expect(fs.existsSync(`${file}.bak`)).toBe(true);
  });
});

const todo = (id: string, day: string, done = false, doneAt?: string): Todo => ({ id, text: id, done, day, createdAt: `${day}T08:00:00.000Z`, ...(doneAt ? { doneAt } : {}) });

describe('todayView', () => {
  test('carried-over first, then today; done today at the bottom; older done hidden', () => {
    const v = todayView(
      [todo('t1', '2026-11-18'), todo('old', '2026-11-16'), todo('d1', '2026-11-18', true, '2026-11-18T10:00:00.000Z'), todo('d0', '2026-11-17', true, '2026-11-17T10:00:00.000Z')],
      '2026-11-18',
    );
    expect(v.open.map((t) => t.id)).toEqual(['old', 't1']);
    expect(v.done.map((t) => t.id)).toEqual(['d1']);
    expect(v.open[0].carried).toBe(true);
    expect(v.open[1].carried).toBe(false);
  });
});

const ev = (id: string, accountId: string, s: string, e: string, extra: Partial<CalEvent> = {}): CalEvent => ({
  id, accountId, title: id, start: s, end: e, allDay: false, response: 'none', calendarId: 'c', eventId: id, editable: false, recurring: false, invited: false, ...extra,
});

describe('clashes and next event', () => {
  test('only overlaps between different accounts; touching is not a clash; all-day ignored', () => {
    const list = [
      ev('a', 'A', '2026-11-18T10:00:00Z', '2026-11-18T11:00:00Z'),
      ev('b', 'B', '2026-11-18T10:30:00Z', '2026-11-18T11:30:00Z'),
      ev('c', 'A', '2026-11-18T10:15:00Z', '2026-11-18T10:45:00Z'),
      ev('d', 'C', '2026-11-18T11:30:00Z', '2026-11-18T12:00:00Z'),
      ev('e', 'C', '2026-11-18', '2026-11-19', { allDay: true }),
    ];
    const pairs = clashes(list).map(([x, y]) => [x.id, y.id].sort().join('-')).sort();
    expect(pairs).toEqual(['a-b', 'b-c']);
  });
  test('the next event is the ongoing one, else the next to start', () => {
    const list = [ev('past', 'A', '2026-11-18T08:00:00Z', '2026-11-18T09:00:00Z'), ev('now', 'A', '2026-11-18T09:30:00Z', '2026-11-18T10:30:00Z'), ev('later', 'B', '2026-11-18T14:00:00Z', '2026-11-18T15:00:00Z')];
    expect(nextEvent(list, new Date('2026-11-18T10:00:00Z'))?.id).toBe('now');
    expect(nextEvent(list, new Date('2026-11-18T11:00:00Z'))?.id).toBe('later');
    expect(nextEvent(list, new Date('2026-11-18T16:00:00Z'))).toBeUndefined();
  });
  test('greeting by hour', () => {
    expect(greeting(new Date(2026, 10, 18, 6))).toBe('Good morning');
    expect(greeting(new Date(2026, 10, 18, 12))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 10, 18, 19))).toBe('Good evening');
  });
});

test('Mission Desk opens on Today only when there is something to show and the setting is on', () => {
  expect(opensOnToday({ accounts: [], openOnToday: true })).toBe(false); // first run: the welcome screen
  expect(opensOnToday({ accounts: [{}], openOnToday: false })).toBe(false);
  expect(opensOnToday({ accounts: [{}] })).toBe(true); // on by default
});
