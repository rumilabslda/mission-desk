import { checkClaude, parseAuthStatus, parseVersion } from '../src/main/assistant/setup';

test("Claude Code's sign-in state from `claude auth status` (never its credentials)", () => {
  expect(parseAuthStatus('{"loggedIn": true, "authMethod": "claude.ai"}')).toBe(true);
  expect(parseAuthStatus('{"loggedIn": false, "authMethod": "none"}')).toBe(false);
  expect(parseAuthStatus('not json')).toBeNull();
  expect(parseAuthStatus('')).toBeNull();
});

test('the version from `claude --version`', () => {
  expect(parseVersion('2.1.270 (Claude Code)\n')).toBe('2.1.270');
  expect(parseVersion('garbage')).toBeUndefined();
});

describe('checkClaude: what setup step the user is on', () => {
  const run = (out: Record<string, string>) => async (_cmd: string, args: string[]) => {
    const k = args.join(' ');
    if (!(k in out)) throw new Error('failed');
    return out[k];
  };

  test('not installed', async () => {
    expect(await checkClaude({ find: async () => null, run: run({}) })).toEqual({ state: 'not-installed' });
  });

  test('installed but signed out', async () => {
    expect(await checkClaude({ find: async () => '/x/claude', run: run({ '--version': '2.1.270 (Claude Code)', 'auth status': '{"loggedIn": false}' }) })).toEqual({
      state: 'signed-out',
      version: '2.1.270',
    });
  });

  test('ready', async () => {
    expect(await checkClaude({ find: async () => '/x/claude', run: run({ '--version': '2.2.0 (Claude Code)', 'auth status': '{"loggedIn": true}' }) })).toEqual({ state: 'ready', version: '2.2.0' });
  });

  test("an old Claude Code without `auth status`: assume signed in (a real request will tell)", async () => {
    expect(await checkClaude({ find: async () => '/x/claude', run: run({ '--version': '1.0.0 (Claude Code)' }) })).toEqual({ state: 'ready', version: '1.0.0' });
  });
});

test('`claude auth status` exits with 1 when signed out: its output still counts', async () => {
  const { outputOf } = await import('../src/main/assistant/setup');
  expect(outputOf(new Error('Command failed: exit 1'), '{"loggedIn": false}')).toBe('{"loggedIn": false}');
  expect(outputOf(null, '2.1.270 (Claude Code)')).toBe('2.1.270 (Claude Code)');
  expect(() => outputOf(new Error('ENOENT'), '')).toThrow('ENOENT');
});

test("a Claude Code that doesn't run at all (no version, no status) is not ready: install it again", async () => {
  expect(await checkClaude({ find: async () => '/x/claude', run: async () => { throw new Error('env: node: No such file'); } })).toEqual({ state: 'not-installed' });
});
