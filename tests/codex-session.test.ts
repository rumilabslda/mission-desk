import { EventEmitter } from 'node:events';
import { createCodexSession } from '../src/main/assistant/codex-session';
import type { AssistantEvent } from '../src/shared/assistant';

class FakeChild extends EventEmitter {
  input = '';
  killed = false;
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = { write: (s: string) => ((this.input += s), true), end: () => undefined, on: () => undefined };
  kill(): void {
    this.killed = true;
    this.emit('exit', null);
  }
  out(o: unknown): void {
    this.stdout.emit('data', Buffer.from(`${JSON.stringify(o)}\n`));
  }
}

function setup(resume?: string) {
  const spawned: { args: string[]; child: FakeChild }[] = [];
  const events: AssistantEvent[] = [];
  const s = createCodexSession(
    {
      spawn: (_cmd, args) => {
        const child = new FakeChild();
        spawned.push({ args, child });
        return child as never;
      },
      codexPath: async () => '/bin/codex',
      env: {},
      cwd: '/u/codex',
      mcp: () => ({ command: '/x', args: ['/b.js'], env: { A: '1' } }),
      instructions: () => 'scope line',
    },
    { model: '', effort: 'medium', ...(resume ? { resume } : {}) },
  );
  s.onEvent((e) => events.push(e));
  return { s, spawned, events };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

test('one run per message; the message goes on stdin; the next one resumes the thread', async () => {
  const { s, spawned, events } = setup();
  await s.send('How many unread?');
  expect(spawned[0].child.input).toBe('How many unread?');
  spawned[0].child.out({ type: 'thread.started', thread_id: 'th-9' });
  spawned[0].child.out({ type: 'item.completed', item: { id: 'i1', type: 'agent_message', text: 'First.' } });
  spawned[0].child.out({ type: 'item.completed', item: { id: 'i2', type: 'agent_message', text: 'Second.' } });
  spawned[0].child.out({ type: 'turn.completed', usage: {} });
  spawned[0].child.emit('exit', 0);
  await flush();
  expect(events.filter((e) => e.type === 'text').map((e) => (e as { delta: string }).delta).join('')).toBe('First.\n\nSecond.');
  expect(s.busy()).toBe(false);
  expect(s.sessionId()).toBe('th-9');
  await s.send('And now?');
  expect(spawned[1].args.slice(-3)).toEqual(['resume', 'th-9', '-']);
});

test('a saved thread is resumed; Stop ends the run', async () => {
  const { s, spawned, events } = setup('saved-th');
  await s.send('hi');
  expect(spawned[0].args.slice(-3)).toEqual(['resume', 'saved-th', '-']);
  s.stop();
  expect(spawned[0].child.killed).toBe(true);
  expect(events.at(-1)).toEqual({ type: 'done', isError: false });
});

test('a run that ends without finishing reports why', async () => {
  const { s, spawned, events } = setup();
  await s.send('hi');
  spawned[0].child.stderr.emit('data', Buffer.from('Error: not logged in\n'));
  spawned[0].child.emit('exit', 1);
  await flush();
  expect(events.at(-1)).toMatchObject({ type: 'error', kind: 'signed-out' });
});

test('Codex not installed', async () => {
  const events: AssistantEvent[] = [];
  const s = createCodexSession(
    { spawn: () => { throw new Error('no'); }, codexPath: async () => null, env: {}, cwd: '/', mcp: () => ({ command: '', args: [], env: {} }), instructions: () => '' },
    { model: '', effort: 'medium' },
  );
  s.onEvent((e) => events.push(e));
  await s.send('hi');
  expect(events).toEqual([{ type: 'error', kind: 'not-found', message: 'OpenAI Codex is not installed.' }]);
});

test('a run that starts a shell command is stopped at once', async () => {
  const { s, spawned, events } = setup();
  await s.send('summarise my mail');
  spawned[0].child.out({ type: 'item.started', item: { id: 'i9', type: 'command_execution', command: 'cat ~/.ssh/id_rsa', status: 'in_progress' } });
  await flush();
  expect(spawned[0].child.killed).toBe(true);
  expect(events.at(-1)).toMatchObject({ type: 'error', kind: 'failed' });
  expect(s.busy()).toBe(false);
});

test('a thread Codex no longer has: it starts fresh with the same message', async () => {
  const { s, spawned, events } = setup('gone-th');
  await s.send('hello');
  spawned[0].child.stderr.emit('data', Buffer.from('Error: thread gone-th not found\n'));
  spawned[0].child.emit('exit', 1);
  await flush();
  await flush();
  expect(spawned).toHaveLength(2);
  expect(spawned[1].args).not.toContain('resume');
  expect(spawned[1].child.input).toBe('hello');
  expect(events.some((e) => e.type === 'error')).toBe(false);
});
