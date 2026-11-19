import { createOpenRouterSession } from '../src/main/assistant/openrouter-session';
import type { AssistantEvent } from '../src/shared/assistant';

const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const body = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode(text));
      c.close();
    },
  });

function setup(responses: string[], opts: { key?: string | null; history?: { role: 'user' | 'assistant'; text: string; tools: [] }[]; toolWait?: Promise<void> } = {}) {
  const requests: { url: string; body: { model: string; messages: { role: string; content?: string; tool_call_id?: string }[]; tools?: unknown[] }; headers: Record<string, string> }[] = [];
  const toolCalls: [string, unknown][] = [];
  const events: AssistantEvent[] = [];
  const s = createOpenRouterSession(
    {
      fetch: async (url, init) => {
        requests.push({ url: String(url), body: JSON.parse(String(init?.body)), headers: init?.headers as Record<string, string> });
        const next = responses.shift() ?? sse({ choices: [{ delta: { content: '' }, finish_reason: 'stop' }] });
        return new Response(body(next), { status: 200 });
      },
      apiKey: async () => (opts.key === undefined ? 'sk-or-test' : opts.key),
      tools: async () => ({
        defs: [{ name: 'unread_counts', description: 'Unread', inputSchema: { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', properties: {} } }],
        call: async (name, args) => {
          toolCalls.push([name, args]);
          if (opts.toolWait) await opts.toolWait;
          return { text: 'Acme: 3', isError: false };
        },
      }),
      systemPrompt: () => 'You are the assistant for Acme only.',
      history: opts.history ?? [],
    },
    { model: 'openai/gpt-5-mini' },
  );
  s.onEvent((e) => events.push(e));
  return { s, requests, toolCalls, events };
}

const flush = () => new Promise((r) => setTimeout(r, 10));

test('a question that needs a tool: it calls the tool, then answers', async () => {
  const { s, requests, toolCalls, events } = setup([
    sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'unread_counts', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] }),
    sse({ choices: [{ delta: { content: 'You have 3 unread in Acme.' }, finish_reason: 'stop' }] }) + 'data: [DONE]\n\n',
  ]);
  await s.send('How many unread?');
  await flush();
  expect(toolCalls).toEqual([['unread_counts', {}]]);
  expect(requests).toHaveLength(2);
  expect(requests[0].url).toBe('https://openrouter.ai/api/v1/chat/completions');
  expect(requests[0].headers.Authorization).toBe('Bearer sk-or-test');
  expect(requests[0].body.model).toBe('openai/gpt-5-mini');
  expect(requests[0].body.messages[0]).toEqual({ role: 'system', content: 'You are the assistant for Acme only.' });
  expect(requests[0].body.tools).toHaveLength(1);
  const second = requests[1].body.messages;
  expect(second.some((m) => m.role === 'tool' && m.tool_call_id === 'c1' && m.content === 'Acme: 3')).toBe(true);
  expect(events).toEqual([
    { type: 'init', model: 'openai/gpt-5-mini', sessionId: '' },
    { type: 'tool', id: 'c1', name: 'unread_counts', input: {} },
    { type: 'toolDone', id: 'c1', isError: false },
    { type: 'text', delta: 'You have 3 unread in Acme.' },
    { type: 'done', isError: false },
  ]);
  expect(s.busy()).toBe(false);
});

test('a saved conversation is the context of the next message', async () => {
  const { s, requests } = setup([sse({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] })], {
    history: [
      { role: 'user', text: 'first question', tools: [] },
      { role: 'assistant', text: 'first answer', tools: [] },
    ],
  });
  await s.send('second');
  await flush();
  expect(requests[0].body.messages.map((m) => `${m.role}:${m.content}`)).toEqual([
    'system:You are the assistant for Acme only.',
    'user:first question',
    'assistant:first answer',
    'user:second',
  ]);
});

test('no key: a clear error, nothing sent', async () => {
  const { s, requests, events } = setup([], { key: null });
  await s.send('hi');
  await flush();
  expect(requests).toHaveLength(0);
  expect(events.at(-1)).toMatchObject({ type: 'error', kind: 'signed-out' });
});

test('a model that loops on tools stops after a limit', async () => {
  const loop = sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c', function: { name: 'unread_counts', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] });
  const { s, requests, events } = setup(Array.from({ length: 40 }, () => loop));
  await s.send('loop');
  await new Promise((r) => setTimeout(r, 200));
  expect(requests.length).toBeLessThanOrEqual(20);
  expect(events.at(-1)).toMatchObject({ type: 'done' });
});

test('the message just saved in the history is sent once (the controller saves it before sending)', async () => {
  const { s, requests } = setup([sse({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] })], {
    history: [{ role: 'user', text: 'hi', tools: [] }],
  });
  await s.send('hi');
  await flush();
  expect(requests[0].body.messages.filter((m) => m.role === 'user').map((m) => m.content)).toEqual(['hi']);
});

test('invalid tool arguments: the tool is not run; the model is told; the stored call is valid JSON', async () => {
  const { s, requests, toolCalls } = setup([
    sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'unread_counts', arguments: '{"acc' } }] }, finish_reason: 'length' }] }),
    sse({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] }),
  ]);
  await s.send('x');
  await flush();
  expect(toolCalls).toEqual([]);
  const second = requests[1].body.messages as { role: string; content?: string; tool_calls?: { function: { arguments: string } }[] }[];
  expect(second.find((m) => m.role === 'assistant')?.tool_calls?.[0].function.arguments).toBe('{}');
  expect(second.find((m) => m.role === 'tool')?.content).toMatch(/not valid JSON/);
});

test('reasoning details go back with the assistant’s tool call', async () => {
  const { s, requests } = setup([
    sse({ choices: [{ delta: { reasoning_details: [{ type: 'reasoning.encrypted', data: 'sig' }], tool_calls: [{ index: 0, id: 'c1', function: { name: 'unread_counts', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] }),
    sse({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] }),
  ]);
  await s.send('x');
  await flush();
  const assistant = (requests[1].body.messages as { role: string; reasoning_details?: unknown }[]).find((m) => m.role === 'assistant');
  expect(assistant?.reasoning_details).toEqual([{ type: 'reasoning.encrypted', data: 'sig' }]);
});

test('Stop during tool calls: no more tools run, nothing is added, no events after done', async () => {
  const two = sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'unread_counts', arguments: '{}' } }, { index: 1, id: 'c2', function: { name: 'unread_counts', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] });
  let release!: () => void;
  const toolWait = new Promise<void>((r) => (release = r));
  const { s, toolCalls, events, requests } = setup([two], { toolWait });
  await s.send('x');
  await flush(); // the first tool is running
  expect(toolCalls).toHaveLength(1);
  s.stop();
  const doneAt = events.length;
  release();
  await flush();
  expect(events.slice(doneAt)).toEqual([]);
  expect(toolCalls).toHaveLength(1); // the second never ran
  expect(requests).toHaveLength(1); // and nothing more was asked
  expect(s.busy()).toBe(false);
});

test('tool schemas go out without "$schema" (some providers refuse it)', async () => {
  const { s, requests } = setup([sse({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] })]);
  await s.send('x');
  await flush();
  expect(JSON.stringify(requests[0].body.tools)).not.toContain('$schema');
});
