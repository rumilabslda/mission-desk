import { EventEmitter } from 'node:events';
import { createClaudeCodeSession, type ChildLike } from '../src/main/assistant/engine';
import type { AssistantEvent } from '../src/shared/assistant';

class FakeChild extends EventEmitter implements ChildLike {
  written: string[] = [];
  killed = false;
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = { write: (s: string) => (this.written.push(s), true), end: () => undefined };
  kill(): void {
    this.killed = true;
    this.emit('exit', null);
  }
  out(o: unknown): void {
    this.stdout.emit('data', Buffer.from(`${JSON.stringify(o)}\n`));
  }
}

function setup(claude: string | null = '/bin/claude', resume?: string) {
  const spawned: { args: string[]; child: FakeChild }[] = [];
  const events: AssistantEvent[] = [];
  const s = createClaudeCodeSession(
    {
      spawn: (_cmd, args) => {
        const child = new FakeChild();
        spawned.push({ args, child });
        return child;
      },
      claudePath: async () => claude,
      env: {},
      cwd: '/tmp/a',
      mcpConfig: () => '{}',
      systemPrompt: () => 'p',
    },
    { model: 'sonnet', effort: 'medium', ...(resume ? { resume } : {}) },
  );
  s.onEvent((e) => events.push(e));
  return { s, spawned, events };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('assistant session', () => {
  test('sends the message as one stream-json line and reports events', async () => {
    const { s, spawned, events } = setup();
    await s.send('Hello');
    expect(spawned).toHaveLength(1);
    expect(JSON.parse(spawned[0].child.written[0])).toEqual({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'Hello' }] } });
    spawned[0].child.out({ type: 'system', subtype: 'init', model: 'm', session_id: 's1' });
    spawned[0].child.out({ type: 'result', subtype: 'success', is_error: false, result: 'Hi', session_id: 's1' });
    await flush();
    expect(events).toEqual([
      { type: 'init', model: 'm', sessionId: 's1' },
      { type: 'done', isError: false, text: 'Hi', sessionId: 's1' },
    ]);
  });

  test('lines split across chunks are joined', async () => {
    const { s, spawned, events } = setup();
    await s.send('x');
    const line = JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'abc' } } });
    spawned[0].child.stdout.emit('data', Buffer.from(line.slice(0, 20)));
    spawned[0].child.stdout.emit('data', Buffer.from(`${line.slice(20)}\n`));
    expect(events).toEqual([{ type: 'text', delta: 'abc' }]);
  });

  test('the same process takes the next message', async () => {
    const { s, spawned } = setup();
    await s.send('one');
    await s.send('two');
    expect(spawned).toHaveLength(1);
    expect(spawned[0].child.written).toHaveLength(2);
  });

  test('stop ends the process; the next message resumes the session', async () => {
    const { s, spawned, events } = setup();
    await s.send('one');
    spawned[0].child.out({ type: 'system', subtype: 'init', model: 'm', session_id: 's1' });
    s.stop();
    expect(spawned[0].child.killed).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'done', isError: false });
    await s.send('two');
    expect(spawned).toHaveLength(2);
    expect(spawned[1].args[spawned[1].args.indexOf('--resume') + 1]).toBe('s1');
  });

  test('changing the model restarts with the new model, same session', async () => {
    const { s, spawned } = setup();
    await s.send('one');
    spawned[0].child.out({ type: 'system', subtype: 'init', model: 'm', session_id: 's1' });
    s.setModel('opus', 'high');
    expect(spawned[0].child.killed).toBe(true);
    await s.send('two');
    const a = spawned[1].args;
    expect(a[a.indexOf('--model') + 1]).toBe('opus');
    expect(a[a.indexOf('--effort') + 1]).toBe('high');
    expect(a[a.indexOf('--resume') + 1]).toBe('s1');
  });

  test('close forgets the session (new chat)', async () => {
    const { s, spawned } = setup();
    await s.send('one');
    spawned[0].child.out({ type: 'system', subtype: 'init', model: 'm', session_id: 's1' });
    s.close();
    await s.send('fresh');
    expect(spawned[1].args).not.toContain('--resume');
  });

  test('a sign-in failure is reported as signed-out', async () => {
    const { s, spawned, events } = setup();
    await s.send('x');
    spawned[0].child.out({ type: 'result', subtype: 'success', is_error: true, result: 'Failed to authenticate: OAuth session expired' });
    expect(events).toContainEqual({ type: 'error', kind: 'signed-out', message: 'Failed to authenticate: OAuth session expired' });
  });

  test('Claude Code missing is reported as not-found', async () => {
    const { s, spawned, events } = setup(null);
    await s.send('x');
    expect(spawned).toHaveLength(0);
    expect(events).toEqual([expect.objectContaining({ type: 'error', kind: 'not-found' })]);
  });

  test('an unexpected exit while working is reported with what it printed', async () => {
    const { s, spawned, events } = setup();
    await s.send('x');
    spawned[0].child.stderr.emit('data', Buffer.from('Error: something broke'));
    spawned[0].child.emit('exit', 1);
    expect(events).toContainEqual({ type: 'error', kind: 'failed', message: 'Error: something broke' });
  });
});

describe('assistant session (review fixes)', () => {
  test('changing the model while working ends the answer (the panel never stays stuck)', async () => {
    const { s, events } = setup();
    await s.send('x');
    s.setModel('opus', 'high');
    expect(events.at(-1)).toEqual({ type: 'done', isError: false });
  });
  test('two quick sends start one process', async () => {
    const { s, spawned } = setup();
    await Promise.all([s.send('a'), s.send('b')]);
    expect(spawned).toHaveLength(1);
    expect(spawned[0].child.written).toHaveLength(2);
  });
  test('stop while Claude Code is still starting: nothing is sent and the answer ends', async () => {
    const { s, spawned, events } = setup();
    const p = s.send('a');
    s.stop();
    await p;
    expect(spawned).toHaveLength(0);
    expect(events.at(-1)).toEqual({ type: 'done', isError: false });
  });
  test('accented characters split across chunks stay whole', async () => {
    const { s, spawned, events } = setup();
    await s.send('x');
    const line = Buffer.from(`${JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'ação' } } })}\n`);
    const cut = line.indexOf(Buffer.from('ç')) + 1; // inside the two bytes of ç
    spawned[0].child.stdout.emit('data', line.subarray(0, cut));
    spawned[0].child.stdout.emit('data', line.subarray(cut));
    expect(events).toEqual([{ type: 'text', delta: 'ação' }]);
  });
  test('the system prompt is built fresh for every start (today’s date)', async () => {
    let n = 0;
    const spawned: string[][] = [];
    const s = createClaudeCodeSession(
      { spawn: (_c, args) => (spawned.push(args), new FakeChild()), claudePath: async () => '/c', env: {}, cwd: '/', mcpConfig: () => '{}', systemPrompt: () => `day ${++n}` },
      { model: 'sonnet', effort: 'low' },
    );
    await s.send('a');
    s.close();
    await s.send('b');
    expect(spawned.map((a) => a[a.indexOf('--append-system-prompt') + 1])).toEqual(['day 1', 'day 2']);
  });
});

describe('saved conversations resume', () => {
  test('a saved session id is resumed on the first message', async () => {
    const { s, spawned } = setup('/bin/claude', 'saved-1');
    await s.send('again');
    const args = spawned[0].args;
    expect(args[args.indexOf('--resume') + 1]).toBe('saved-1');
  });

  test('release ends the process quietly and keeps the session for next time', async () => {
    const { s, spawned, events } = setup();
    await s.send('x');
    spawned[0].child.out({ type: 'system', subtype: 'init', model: 'm', session_id: 's9' });
    spawned[0].child.out({ type: 'result', subtype: 'success', is_error: false, result: 'ok', session_id: 's9' });
    await flush();
    const before = events.length;
    s.release();
    expect(spawned[0].child.killed).toBe(true);
    expect(events.length).toBe(before); // no event
    expect(s.sessionId()).toBe('s9');
    await s.send('y');
    const args = spawned[1].args;
    expect(args[args.indexOf('--resume') + 1]).toBe('s9');
  });
});

test("a saved session Claude Code no longer has (cleaned up after 30 days): it starts fresh and sends the message again", async () => {
  const { s, spawned, events } = setup('/bin/claude', 'old-1');
  await s.send('hello again');
  expect(spawned[0].args).toContain('--resume');
  spawned[0].child.stderr.emit('data', Buffer.from('No conversation found with session ID: old-1\n'));
  spawned[0].child.emit('exit', 1);
  await flush();
  await flush();
  expect(spawned).toHaveLength(2);
  expect(spawned[1].args).not.toContain('--resume');
  expect(JSON.parse(spawned[1].child.written[0]).message.content[0].text).toBe('hello again');
  expect(events.some((e) => e.type === 'error')).toBe(false);
  expect(events).toContainEqual({ type: 'text', delta: '(The earlier context of this conversation was no longer available, so I started fresh.)\n\n' });
});
