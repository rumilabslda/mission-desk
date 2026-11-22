import { buildCodexArgs, forbiddenItem, parseCodexEvent } from '../src/main/assistant/codex';

describe('codex exec arguments', () => {
  const mcp = { command: '/Apps/Mission Desk', args: ['/Apps/bridge.js'], env: { ELECTRON_RUN_AS_NODE: '1', MISSIONDESK_SOCKET: '/tmp/a.sock', MISSIONDESK_TOKEN: 'tok"en' } };

  test('a first message: JSON events, only Mission Desk tools, read-only, no shell or web, the prompt from stdin', () => {
    const a = buildCodexArgs({ cwd: '/u/codex', mcp, instructions: 'Be "brief".', model: 'gpt-5', effort: 'high' });
    expect(a.slice(0, 2)).toEqual(['exec', '--json']);
    expect(a).toContain('--skip-git-repo-check');
    expect(a.join(' ')).toContain('--sandbox read-only');
    expect(a).toContain('--ignore-user-config'); // the user's ~/.codex/config.toml (their other MCP servers, hooks…) is not loaded
    for (const f of ['shell_tool', 'unified_exec', 'view_image', 'apps', 'plugins', 'hooks', 'computer_use', 'browser_use', 'image_generation', 'multi_agent']) expect(a).toContain(`features.${f}=false`);
    expect(a).toContain('web_search="disabled"');
    expect(a).toContain('approval_policy="never"');
    // the whole MCP table is replaced: only Mission Desk's server
    expect(a).toContain(
      'mcp_servers={missiondesk={command="/Apps/Mission Desk",args=["/Apps/bridge.js"],env={ELECTRON_RUN_AS_NODE="1",MISSIONDESK_SOCKET="/tmp/a.sock",MISSIONDESK_TOKEN="tok\\"en"},required=true,default_tools_approval_mode="approve",tool_timeout_sec=600}}',
    );
    expect(a).toContain('developer_instructions="Be \\"brief\\"."');
    expect(a.join(' ')).toContain('-m gpt-5');
    expect(a).toContain('model_reasoning_effort="high"');
    expect(a.at(-1)).toBe('-');
    expect(a).not.toContain('resume');
  });

  test('a later message resumes the thread; no model means Codex’s default', () => {
    const a = buildCodexArgs({ cwd: '/u/codex', mcp, instructions: 'x', model: '', effort: 'medium', resume: 'th-1' });
    expect(a.slice(-3)).toEqual(['resume', 'th-1', '-']);
    expect(a).not.toContain('-m');
  });
});

test('model names that look like flags are not passed; TOML-unsafe characters are escaped', () => {
  const mcp = { command: '/x', args: [], env: {} };
  expect(buildCodexArgs({ cwd: '/c', mcp, instructions: 'a\u007fb', model: '--evil', effort: 'max' })).not.toContain('--evil');
  expect(buildCodexArgs({ cwd: '/c', mcp, instructions: 'a\u007fb', model: '', effort: 'max' })).toContain('developer_instructions="a\\u007fb"');
  expect(buildCodexArgs({ cwd: '/c', mcp, instructions: 'x', model: '', effort: 'max' })).toContain('model_reasoning_effort="high"');
});

describe('a run that tries anything but Mission Desk’s tools is stopped', () => {
  const line = (o: unknown) => forbiddenItem(JSON.stringify(o));
  test('a shell command, a file change, a web search, another MCP server', () => {
    expect(line({ type: 'item.started', item: { type: 'command_execution', command: 'cat ~/.ssh/id_rsa' } })).toMatch(/command/);
    expect(line({ type: 'item.started', item: { type: 'file_change' } })).toBeTruthy();
    expect(line({ type: 'item.started', item: { type: 'web_search' } })).toBeTruthy();
    expect(line({ type: 'item.started', item: { type: 'mcp_tool_call', server: 'filesystem', tool: 'read_file' } })).toMatch(/filesystem/);
  });
  test('Mission Desk’s tools, messages and reasoning are fine', () => {
    expect(line({ type: 'item.started', item: { type: 'mcp_tool_call', server: 'missiondesk', tool: 'read_page' } })).toBeNull();
    expect(line({ type: 'item.completed', item: { type: 'agent_message', text: 'hi' } })).toBeNull();
    expect(line({ type: 'item.completed', item: { type: 'reasoning', text: '…' } })).toBeNull();
    expect(line({ type: 'turn.completed' })).toBeNull();
  });
});

describe('codex exec --json events', () => {
  const line = (o: unknown) => parseCodexEvent(JSON.stringify(o));

  test('thread, tool calls, messages and the end of the turn', () => {
    expect(line({ type: 'thread.started', thread_id: 'th-1' })).toEqual([{ type: 'init', model: 'Codex', sessionId: 'th-1' }]);
    expect(line({ type: 'item.started', item: { id: 'item_1', type: 'mcp_tool_call', server: 'missiondesk', tool: 'unread_counts', arguments: { a: 1 }, status: 'in_progress' } })).toEqual([
      { type: 'tool', id: 'item_1', name: 'unread_counts', input: { a: 1 } },
    ]);
    expect(line({ type: 'item.completed', item: { id: 'item_1', type: 'mcp_tool_call', tool: 'unread_counts', status: 'failed', error: { message: 'x' } } })).toEqual([
      { type: 'toolDone', id: 'item_1', isError: true },
    ]);
    expect(line({ type: 'item.completed', item: { id: 'item_2', type: 'agent_message', text: 'You have 3 unread.' } })).toEqual([{ type: 'text', delta: 'You have 3 unread.' }]);
    expect(line({ type: 'item.completed', item: { id: 'item_3', type: 'reasoning', text: 'thinking' } })).toEqual([]);
    expect(line({ type: 'turn.completed', usage: { input_tokens: 1 } })).toEqual([{ type: 'done', isError: false }]);
  });

  test('failures: a failed turn and an error, a sign-in problem says so', () => {
    expect(line({ type: 'turn.failed', error: { message: 'Model overloaded' } })).toEqual([
      { type: 'done', isError: true, text: 'Model overloaded' },
      { type: 'error', kind: 'failed', message: 'Model overloaded' },
    ]);
    expect(line({ type: 'error', message: 'Not logged in. Run codex login.' })).toEqual([{ type: 'error', kind: 'signed-out', message: 'Not logged in. Run codex login.' }]);
    expect(parseCodexEvent('not json')).toEqual([]);
  });
});

test('a request with no tools gives Codex an empty MCP table (no Mission Desk server, none of the user’s)', () => {
  const a = buildCodexArgs({ cwd: '/u/codex', mcp: null, instructions: 'x', model: 'gpt-5', effort: 'low' }).join(' ');
  expect(a).toContain('mcp_servers={}');
  expect(a).not.toContain('missiondesk');
});
