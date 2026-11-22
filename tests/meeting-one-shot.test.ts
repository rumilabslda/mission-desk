import type { AssistantEvent } from '../src/shared/assistant';
import { createOneShot } from '../src/main/meetings/one-shot';

function fakeSession(script: AssistantEvent[]) {
  const listeners = new Set<(e: AssistantEvent) => void>();
  const s = {
    sent: [] as string[],
    closed: false,
    stopped: false,
    systems: [] as string[],
    async send(text: string) {
      s.sent.push(text);
      setTimeout(() => script.forEach((e) => listeners.forEach((l) => l(e))), 0);
    },
    stop() {
      s.stopped = true;
    },
    close() {
      s.closed = true;
    },
    onEvent(cb: (e: AssistantEvent) => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
  return s;
}

test('sends the request and joins the answer’s text, then closes the session', async () => {
  const s = fakeSession([
    { type: 'text', delta: '{"a":' },
    { type: 'text', delta: '1' },
    { type: 'text', delta: '}' },
    { type: 'done', isError: false },
  ]);
  let system = '';
  const ask = createOneShot(async (sys) => {
    system = sys();
    return s as never;
  });
  expect(await ask('You write JSON.', 'The transcript…', new AbortController().signal)).toBe('{"a":1}');
  expect(system).toBe('You write JSON.');
  expect(s.sent).toEqual(['The transcript…']);
  expect(s.closed).toBe(true);
});

test('an error event rejects, and closes', async () => {
  const s = fakeSession([{ type: 'error', kind: 'failed', message: 'Rate limited' }]);
  const ask = createOneShot(async () => s as never);
  await expect(ask('x', 'y', new AbortController().signal)).rejects.toThrow('Rate limited');
  expect(s.closed).toBe(true);
});

test('an answer that ends in error rejects', async () => {
  const s = fakeSession([{ type: 'done', isError: true, text: 'Bad model' }]);
  const ask = createOneShot(async () => s as never);
  await expect(ask('x', 'y', new AbortController().signal)).rejects.toThrow('Bad model');
});

test('aborting stops and closes the session', async () => {
  const s = fakeSession([]);
  const ask = createOneShot(async () => s as never);
  const ac = new AbortController();
  const p = ask('x', 'y', ac.signal);
  await new Promise((r) => setTimeout(r, 5));
  ac.abort();
  await expect(p).rejects.toThrow();
  expect(s.stopped).toBe(true);
  expect(s.closed).toBe(true);
});

import { buildArgs } from '../src/main/assistant/claude-code';

test('I4: a one-shot Claude Code run keeps no session on disk', () => {
  const a = buildArgs({ model: 'sonnet', effort: 'low', mcpConfig: '{"mcpServers":{}}', systemPrompt: 'x', ephemeral: true });
  expect(a).toContain('--no-session-persistence');
  expect(buildArgs({ model: 'sonnet', effort: 'low', mcpConfig: '{}', systemPrompt: 'x' })).not.toContain('--no-session-persistence');
});

test('I4: after a one-shot, the engine’s own record of it is cleaned up', async () => {
  const s = fakeSession([{ type: 'text', delta: 'ok' }, { type: 'done', isError: false }]);
  (s as unknown as { sessionId: () => string }).sessionId = () => 'thread-42';
  const cleaned: (string | null)[] = [];
  const ask = createOneShot(async () => s as never, (id) => void cleaned.push(id));
  await ask('x', 'y', new AbortController().signal);
  expect(cleaned).toEqual(['thread-42']);
});
