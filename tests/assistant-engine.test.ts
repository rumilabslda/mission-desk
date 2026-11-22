import { buildArgs, classifyError, cleanEnv, explainModelError, parseEvent } from '../src/main/assistant/claude-code';
import { findClaude } from '../src/main/assistant/locate';

const line = (o: unknown) => JSON.stringify(o);

describe('buildArgs', () => {
  const base = { model: 'sonnet', effort: 'medium' as const, mcpConfig: '{"mcpServers":{}}', systemPrompt: 'Be brief.' };
  test('headless, streaming, no built-in tools, only Mission Desk MCP, no user settings', () => {
    const a = buildArgs(base);
    const pair = (flag: string) => a[a.indexOf(flag) + 1];
    expect(a).toContain('-p');
    expect(pair('--input-format')).toBe('stream-json');
    expect(pair('--output-format')).toBe('stream-json');
    expect(a).toContain('--verbose');
    expect(a).toContain('--include-partial-messages');
    expect(pair('--model')).toBe('sonnet');
    expect(pair('--effort')).toBe('medium');
    expect(pair('--tools')).toBe('');
    expect(a).toContain('--strict-mcp-config');
    expect(pair('--mcp-config')).toBe('{"mcpServers":{}}');
    expect(pair('--allowedTools')).toBe('mcp__missiondesk');
    expect(pair('--permission-mode')).toBe('dontAsk');
    expect(pair('--setting-sources')).toBe('local');
    expect(pair('--append-system-prompt')).toBe('Be brief.');
    expect(a).not.toContain('--bare');
    expect(a).not.toContain('--resume');
  });
  test('default model passes no --model; resume continues a session', () => {
    const a = buildArgs({ ...base, model: 'default', resume: 'abc-123' });
    expect(a).not.toContain('--model');
    expect(a[a.indexOf('--resume') + 1]).toBe('abc-123');
  });
});

test('cleanEnv drops credentials and the run-as-node switch', () => {
  const env = cleanEnv({ PATH: '/bin', HOME: '/h', ANTHROPIC_API_KEY: 'k', CLAUDE_CODE_OAUTH_TOKEN: 't', ELECTRON_RUN_AS_NODE: '1' });
  expect(env).toEqual({ PATH: '/bin', HOME: '/h' });
});

describe('parseEvent', () => {
  test('init gives the model and session', () => {
    expect(parseEvent(line({ type: 'system', subtype: 'init', model: 'claude-x', session_id: 's1' }))).toEqual([{ type: 'init', model: 'claude-x', sessionId: 's1' }]);
  });
  test('streamed text deltas', () => {
    expect(parseEvent(line({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hel' } } }))).toEqual([{ type: 'text', delta: 'Hel' }]);
    expect(parseEvent(line({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{' } } }))).toEqual([]);
  });
  test('a tool use and its result', () => {
    const use = line({ type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }, { type: 'tool_use', id: 't1', name: 'mcp__missiondesk__read_page', input: { account: 'Acme' } }] } });
    expect(parseEvent(use)).toEqual([{ type: 'tool', id: 't1', name: 'read_page', input: { account: 'Acme' } }]);
    const done = line({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false }] } });
    expect(parseEvent(done)).toEqual([{ type: 'toolDone', id: 't1', isError: false }]);
  });
  test('result: success and error', () => {
    expect(parseEvent(line({ type: 'result', subtype: 'success', is_error: false, result: 'Done', session_id: 's1' }))).toEqual([{ type: 'done', isError: false, text: 'Done', sessionId: 's1' }]);
    expect(parseEvent(line({ type: 'result', subtype: 'success', is_error: true, result: 'Failed to authenticate: OAuth session expired' }))).toEqual([
      { type: 'done', isError: true, text: 'Failed to authenticate: OAuth session expired' },
    ]);
  });
  test('noise and broken lines are ignored', () => {
    expect(parseEvent('not json')).toEqual([]);
    expect(parseEvent(line({ type: 'system', subtype: 'hook_started' }))).toEqual([]);
    expect(parseEvent('')).toEqual([]);
  });
});

test('classifyError', () => {
  expect(classifyError('Failed to authenticate: OAuth session expired and could not be refreshed')).toBe('signed-out');
  expect(classifyError('Invalid API key · Please run /login')).toBe('signed-out');
  expect(classifyError('Not logged in')).toBe('signed-out');
  expect(classifyError('Overloaded')).toBe('failed');
});

describe('findClaude', () => {
  test('known places first, then the login shell', async () => {
    const io = (existing: string[], shell: string | null = null) => ({ exists: (p: string) => existing.includes(p), shell: async () => shell, home: '/Users/u' });
    expect(await findClaude(io(['/opt/homebrew/bin/claude', '/Users/u/.local/bin/claude']))).toBe('/Users/u/.local/bin/claude');
    expect(await findClaude(io(['/usr/local/bin/claude']))).toBe('/usr/local/bin/claude');
    expect(await findClaude(io([], '/somewhere/claude'))).toBe('/somewhere/claude');
    expect(await findClaude(io([], null))).toBeNull();
  });
});

test('a new text block starts a new paragraph (text before and after a tool stays apart)', () => {
  expect(parseEvent(line({ type: 'stream_event', event: { type: 'content_block_start', content_block: { type: 'text', text: '' } } }))).toEqual([{ type: 'text', delta: '\n\n' }]);
  expect(parseEvent(line({ type: 'stream_event', event: { type: 'content_block_start', content_block: { type: 'tool_use', name: 'x' } } }))).toEqual([]);
});

test('cleanEnv also drops other credential and provider switches', () => {
  const env = cleanEnv({ PATH: '/bin', ANTHROPIC_AUTH_TOKEN: 'a', ANTHROPIC_BASE_URL: 'b', CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1' });
  expect(env).toEqual({ PATH: '/bin' });
});

test("explainModelError: a default model Claude Code can't use says what to do; other errors stay as they are", () => {
  const cli = "There's an issue with the selected model (auto/best-coding). It may not exist or you may not have access to it.";
  const out = explainModelError(cli, 'default');
  expect(out).toContain('Settings → Assistant');
  expect(out).toContain('auto/best-coding');
  expect(out).toContain('~/.claude/settings.json');
  expect(classifyError(cli)).toBe('failed'); // not mistaken for a sign-in problem
  // A model chosen in Mission Desk, or another error, is left alone.
  expect(explainModelError(cli, 'sonnet')).toBe(cli);
  expect(explainModelError('Network error: ECONNRESET', 'default')).toBe('Network error: ECONNRESET');
  expect(explainModelError('Model not found: claude-x', 'default')).toContain('Settings → Assistant');
});
