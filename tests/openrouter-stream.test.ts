import { createChatStream } from '../src/main/assistant/openrouter-stream';

const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;

test('text deltas, comments and [DONE]', () => {
  const s = createChatStream();
  const out = [...s.push(': OPENROUTER PROCESSING\n\n'), ...s.push(sse({ choices: [{ delta: { content: 'Hel' } }] }) + sse({ choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }] })), ...s.push('data: [DONE]\n\n')];
  expect(out).toEqual([{ type: 'text', delta: 'Hel' }, { type: 'text', delta: 'lo' }]);
  expect(s.result()).toEqual({ text: 'Hello', toolCalls: [], finish: 'stop', done: true, reasoningDetails: [] });
});

test('tool calls are assembled from their pieces, split across chunks', () => {
  const s = createChatStream();
  const a = sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', type: 'function', function: { name: 'unread_counts', arguments: '' } }] } }] });
  const b = sse({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"acc' } }] } }] });
  const c = sse({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ount":"Acme"}' } }, { index: 1, id: 'call_2', function: { name: 'list_accounts', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] });
  const text = a + b + c;
  s.push(text.slice(0, 37));
  s.push(text.slice(37));
  expect(s.result().toolCalls).toEqual([
    { id: 'call_1', name: 'unread_counts', arguments: '{"account":"Acme"}' },
    { id: 'call_2', name: 'list_accounts', arguments: '{}' },
  ]);
  expect(s.result().finish).toBe('tool_calls');
});

test('an error in the stream is reported', () => {
  const s = createChatStream();
  s.push(sse({ error: { code: 402, message: 'Insufficient credits' } }));
  expect(s.result().error).toBe('Insufficient credits');
});

test('calls without an index are told apart by id; a repeated name is not doubled', () => {
  const s = createChatStream();
  s.push(sse({ choices: [{ delta: { tool_calls: [{ id: 'a', function: { name: 'read_page', arguments: '{"x":1}' } }] } }] }));
  s.push(sse({ choices: [{ delta: { tool_calls: [{ id: 'b', function: { name: 'unread_counts', arguments: '{}' } }] } }] }));
  s.push(sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c', function: { name: 'list_accounts', arguments: '{' } }] } }] }));
  s.push(sse({ choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'list_accounts', arguments: '}' } }] }, finish_reason: 'tool_calls' }] }));
  expect(s.result().toolCalls.map((c) => [c.id, c.name, c.arguments])).toEqual([
    ['a', 'read_page', '{"x":1}'],
    ['b', 'unread_counts', '{}'],
    ['c', 'list_accounts', '{}'],
  ]);
});

test('reasoning details are kept (they go back with tool calls); finish "error" is an error', () => {
  const s = createChatStream();
  s.push(sse({ choices: [{ delta: { reasoning_details: [{ type: 'reasoning.encrypted', data: 'xyz' }] } }] }));
  s.push(sse({ choices: [{ delta: {}, finish_reason: 'error' }] }));
  expect(s.result().reasoningDetails).toEqual([{ type: 'reasoning.encrypted', data: 'xyz' }]);
  expect(s.result().error).toBeTruthy();
});
