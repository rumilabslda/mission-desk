import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyFollowUp } from '../src/main/meetings/apply';
import { buildPrompt, chunks, extractJson, followUpSchema, runFollowUp } from '../src/main/meetings/followup';
import { createTodoStore } from '../src/main/todos/store';
import { assistantTools } from '../src/main/assistant/tools';
import { composeUrl } from '../src/shared/compose-url';
import type { Meeting, Segment } from '../src/shared/meeting';

const meeting = (segments: Segment[] = [{ start: 0, end: 2000, speaker: 'me', text: 'Vou enviar a proposta.' }, { start: 2000, end: 5000, speaker: 'Maria Silva', text: 'Eu confirmo o orçamento até sexta.' }]): Meeting => ({
  id: 'm1',
  scope: 'space:s1',
  accountId: 'g1',
  provider: 'meet',
  url: 'https://meet.google.com/abc-defg-hij',
  title: 'Weekly sync',
  startedAt: '2026-11-22T10:00:00.000Z',
  endedAt: '2026-11-22T10:40:00.000Z',
  language: 'pt-PT',
  engine: 'apple',
  segments,
  gaps: [],
});
const ctx = { guests: ['maria@acme.com'], notes: ['Acme prefers short emails.'], actions: ['summary', 'myTodos', 'waitingOn', 'email'] as const, myName: 'Me' };
const good = {
  summary: { decisions: ['Budget approved'], points: ['Q1 plan'], nextSteps: ['Send the proposal'] },
  myTodos: ['Send the proposal to Acme'],
  waitingOn: [{ who: 'Maria Silva', what: 'Confirm the budget by Friday' }],
  email: { to: ['maria@acme.com'], subject: 'Weekly sync: next steps', body: 'Olá Maria,\n\nObrigado pela reunião.' },
};

test('the first JSON object is found around prose and fences, braces in strings included', () => {
  expect(extractJson('Here you go:\n```json\n{"a":"}"}\n```')).toEqual({ a: '}' });
  expect(extractJson('{"a":{"b":[1,2]}} and {"c":1}')).toEqual({ a: { b: [1, 2] } });
  expect(extractJson('no json')).toBeNull();
  expect(extractJson('{broken} then {"ok":true}')).toEqual({ ok: true });
});

test('the schema has only the ticked parts, each required, and nothing else', () => {
  const s = followUpSchema(['summary']);
  expect(s.safeParse({ summary: good.summary }).success).toBe(true);
  expect(s.safeParse({ summary: good.summary, myTodos: ['x'] }).success).toBe(false);
  expect(s.safeParse({ summary: { decisions: [], points: [] } }).success).toBe(false);
  const e = followUpSchema(['email']);
  expect(e.safeParse({ email: { ...good.email, to: ['not an email'] } }).success).toBe(false);
  expect(e.safeParse({ email: { ...good.email, subject: 'two\nlines' } }).success).toBe(false);
  expect(followUpSchema(['event']).safeParse({ followUpEvent: null }).success).toBe(true);
});

test('the prompt says the transcript is untrusted and carries it in order', () => {
  const { system, user } = buildPrompt(meeting(), ctx);
  expect(system).toMatch(/untrusted/i);
  expect(system).toContain('pt-PT');
  expect(user.indexOf('[00:00] Me: Vou enviar a proposta.')).toBeGreaterThan(-1);
  expect(user.indexOf('[00:02] Maria Silva: Eu confirmo')).toBeGreaterThan(user.indexOf('[00:00] Me:'));
  expect(user).toContain('maria@acme.com');
  expect(user).toContain('Acme prefers short emails.');
});

test('an invalid answer is retried once with the error, then gives up', async () => {
  const asked: string[] = [];
  const ask = async (_s: string, u: string) => {
    asked.push(u);
    return asked.length === 1 ? '{"summary": 3}' : JSON.stringify(good);
  };
  expect(await runFollowUp(ask, meeting(), ctx, new AbortController().signal)).toEqual(good);
  expect(asked[1]).toMatch(/not valid/i);
  let n = 0;
  await expect(runFollowUp(async () => (n++, 'nope'), meeting(), ctx, new AbortController().signal)).rejects.toThrow();
  expect(n).toBe(2);
});

test('long meetings are summarised in hour-long parts, then combined', async () => {
  const words = (n: number) => Array.from({ length: n }, () => 'palavra').join(' ');
  const segs: Segment[] = [];
  for (let i = 0; i < 140; i++) segs.push({ start: i * 60_000, end: i * 60_000 + 50_000, speaker: 'others', text: words(500) }); // 70,000 words, 140 min
  const parts = chunks(segs);
  expect(parts).toHaveLength(3);
  expect(parts[0].at(-1)!.start).toBeLessThan(60 * 60_000);
  expect(chunks(meeting().segments)).toHaveLength(1);
  const users: string[] = [];
  const ask = async (_s: string, u: string) => {
    users.push(u);
    return users.length <= 3 ? JSON.stringify({ summary: good.summary, myTodos: [], waitingOn: [] }) : JSON.stringify(good);
  };
  expect(await runFollowUp(ask, meeting(segs), ctx, new AbortController().signal)).toEqual(good);
  expect(users).toHaveLength(4);
  expect(users[3]).not.toContain('palavra palavra palavra');
});

test('applying adds my to-dos and waiting-on items to the meeting’s space', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-apply-'));
  const todos = createTodoStore(path.join(dir, 'todos.json'));
  const applied = applyFollowUp(good, meeting(), { addTodo: (text, tag, extra) => todos.add(text, tag, extra), tagFor: () => ({ kind: 'space', id: 's1' }) });
  expect(applied.sort()).toEqual(['email', 'myTodos', 'summary', 'waitingOn']);
  expect(todos.list().map((t) => [t.text, t.tag?.id, t.meetingId, t.waitingOn])).toEqual([
    ['Send the proposal to Acme', 's1', 'm1', undefined],
    ['Confirm the budget by Friday', 's1', 'm1', 'Maria Silva'],
  ]);
  const tools = assistantTools({ todos: () => todos.list() } as never);
  return tools
    .find((t) => t.name === 'todos')!
    .run({}, undefined as never)
    .then((r) => {
      expect(r.text).toContain('waiting on Maria Silva');
      fs.rmSync(dir, { recursive: true, force: true });
    });
});

test('compose links: encoded, and a long body goes to the clipboard instead', () => {
  const g = composeUrl('google', { to: ['a@x.com', 'b@y.com'], subject: 'Q&A', body: 'Line 1\nLine 2 & more' });
  expect(g.url).toBe('https://mail.google.com/mail/u/0/?view=cm&fs=1&to=a%40x.com%2Cb%40y.com&su=Q%26A&body=Line%201%0ALine%202%20%26%20more');
  expect(g.bodyInClipboard).toBe(false);
  const m = composeUrl('microsoft', { to: ['a@x.com'], subject: 'Hi', body: 'x'.repeat(8000) });
  expect(m.url.startsWith('https://outlook.office.com/mail/deeplink/compose?to=a%40x.com&subject=Hi')).toBe(true);
  expect(m.url).not.toContain('body=');
  expect(m.bodyInClipboard).toBe(true);
});

test('M1: the draft and the event only ever go to the meeting’s guests, whatever was said', async () => {
  const sneaky = { ...good, email: { ...good.email, to: ['maria@acme.com', 'attacker@evil.example'] } };
  const r = await runFollowUp(async () => JSON.stringify(sneaky), meeting(), ctx, new AbortController().signal);
  expect(r.email?.to).toEqual(['maria@acme.com']);
  const ev = { title: 'Next', start: '2026-11-25T10:00:00+00:00', end: '2026-11-25T11:00:00+00:00', guests: ['MARIA@acme.com', 'x@evil.example'] };
  const r2 = await runFollowUp(async () => JSON.stringify({ followUpEvent: ev }), meeting(), { ...ctx, actions: ['event'] }, new AbortController().signal);
  expect(r2.followUpEvent?.guests).toEqual(['MARIA@acme.com']);
});

test('the prompt says who the user is, and that to-dos and waiting on are only theirs', () => {
  const { system, user } = buildPrompt(meeting(), { ...ctx, myName: 'Armando' });
  expect(system).toContain('The user is "Armando"');
  expect(user).toContain('[00:00] Armando: Vou enviar a proposta.');
  // My to-dos: concrete actions the user took on or was asked to do; not status updates or others' work.
  expect(system).toMatch(/myTodos[^\n]*only concrete actions/);
  expect(system).toMatch(/myTodos[^\n]*not status updates/i);
  // Waiting on: only what someone agreed to deliver to the user; not their own work reported in a stand-up.
  expect(system).toMatch(/waitingOn[^\n]*only what another participant explicitly agreed to deliver to the user/);
  expect(system).toMatch(/waitingOn[^\n]*not their own work/i);
});
