import { scopeConfig } from '../src/shared/assistant-engines';
import { BUILTIN, type Connection, connectionEnv, connectionTarget, isConnectionRef, parseAuthInfo } from '../src/shared/connections';

const list: Connection[] = [
  { id: 'acme12345678', kind: 'claude', name: 'Claude Acme', addedAt: '' },
  { id: 'codex1234567', kind: 'codex', name: 'ChatGPT Rumi', addedAt: '' },
  { id: 'orkey1234567', kind: 'openrouter', name: 'OpenRouter X', addedAt: '' },
];
const dirOf = (id: string) => `/data/connections/${id}`;

test('ids: empty (the built-in), a built-in id, or an added id', () => {
  expect(isConnectionRef('')).toBe(true);
  expect(isConnectionRef(BUILTIN.claude)).toBe(true);
  expect(isConnectionRef('acme12345678')).toBe(true);
  expect(isConnectionRef('../x')).toBe(false);
  expect(isConnectionRef('short')).toBe(false);
});

test('a space’s connection: its type’s built-in, an added one, or missing', () => {
  expect(connectionTarget('claude', '', list, dirOf)).toEqual({ kind: 'claude', builtin: true });
  expect(connectionTarget('claude', 'mac-claude', list, dirOf)).toEqual({ kind: 'claude', builtin: true });
  expect(connectionTarget('codex', 'codex1234567', list, dirOf)).toEqual({ kind: 'codex', id: 'codex1234567', dir: '/data/connections/codex1234567' });
  expect(connectionTarget('openrouter', 'orkey1234567', list, dirOf)).toEqual({ kind: 'openrouter', id: 'orkey1234567', keyName: 'openrouter-orkey1234567' });
  expect(connectionTarget('openrouter', '', list, dirOf)).toEqual({ kind: 'openrouter', builtin: true });
  // A Claude connection can't run a Codex space; an unknown id is missing (never another connection).
  expect(connectionTarget('codex', 'acme12345678', list, dirOf)).toEqual({ kind: 'missing' });
  expect(connectionTarget('claude', 'gone12345678', list, dirOf)).toEqual({ kind: 'missing' });
});

test('the environment: the connection’s own folder; built-ins keep it as it is', () => {
  const base = { PATH: '/bin', CLAUDE_CONFIG_DIR: '/me/.claude-x' };
  expect(connectionEnv(base, { kind: 'claude', builtin: true })).toEqual(base);
  expect(connectionEnv(base, { kind: 'claude', id: 'a', dir: '/d/a' })).toEqual({ PATH: '/bin', CLAUDE_CONFIG_DIR: '/d/a' });
  expect(connectionEnv({ PATH: '/bin' }, { kind: 'codex', id: 'c', dir: '/d/c' })).toEqual({ PATH: '/bin', CODEX_HOME: '/d/c' });
  expect(() => connectionEnv(base, { kind: 'missing' })).toThrow();
});

test('a space keeps the Claude account it had (yesterday’s claudeAccount), and connection wins when both exist', () => {
  expect(scopeConfig({ scopes: { 'space:a': { claudeAccount: 'acme12345678' } } }, 'space:a').connection).toBe('acme12345678');
  expect(scopeConfig({ scopes: { 'space:a': { claudeAccount: 'acme12345678', connection: 'other1234567' } } }, 'space:a').connection).toBe('other1234567');
  expect(scopeConfig({}, 'space:a').connection).toBe('');
  expect(scopeConfig({ scopes: { 'space:a': { engine: 'codex' } } }, 'space:a')).toMatchObject({ engine: 'codex', connection: '' });
});

test('sign-in status is read the same way as before', () => {
  expect(parseAuthInfo('{"loggedIn":true,"email":"a@b.c","orgName":"Acme"}')).toEqual({ loggedIn: true, email: 'a@b.c', org: 'Acme' });
});
