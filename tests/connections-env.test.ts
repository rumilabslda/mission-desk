import { vi } from 'vitest';
import { openRouterKeyName, sessionEnvFor } from '../src/main/assistant/connection-env';

const handlers = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
vi.mock('electron', () => ({
  ipcMain: {
    on: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
    handle: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
  },
}));

const base = { PATH: '/usr/bin', HOME: '/Users/me' };

test('a removed connection gives an error, never the Mac’s own sign-in', () => {
  expect(sessionEnvFor('claude', base, { kind: 'missing' })).toEqual({ error: 'missing' });
  expect(sessionEnvFor('codex', base, { kind: 'missing' })).toEqual({ error: 'missing' });
});

test('built-ins keep the environment; added ones get their own folder', () => {
  expect(sessionEnvFor('claude', base, { kind: 'claude', builtin: true })).toEqual(base);
  expect(sessionEnvFor('claude', base, { kind: 'claude', id: 'abcdefabcdef', dir: '/d/abcdefabcdef' })).toEqual({ ...base, CLAUDE_CONFIG_DIR: '/d/abcdefabcdef' });
  const codex = sessionEnvFor('codex', base, { kind: 'codex', id: 'abcdefabcdef', dir: '/d/abcdefabcdef' }) as Record<string, string>;
  expect(codex.CODEX_HOME).toBe('/d/abcdefabcdef');
  expect(codex.CLAUDE_CONFIG_DIR).toBeUndefined();
});

test('a target of another type than the session is missing', () => {
  expect(sessionEnvFor('codex', base, { kind: 'claude', id: 'abcdefabcdef', dir: '/d/x' })).toEqual({ error: 'missing' });
});

test('each OpenRouter connection reads its own key', () => {
  expect(openRouterKeyName({ kind: 'openrouter', builtin: true })).toBe('openrouter');
  expect(openRouterKeyName({ kind: 'openrouter', id: 'abcdefabcdef', keyName: 'openrouter-abcdefabcdef' })).toBe('openrouter-abcdefabcdef');
  expect(openRouterKeyName({ kind: 'missing' })).toBeNull();
  expect(openRouterKeyName({ kind: 'claude', builtin: true })).toBeNull();
});

test('a space’s connection passes the IPC only when it is a real connection id', async () => {
  const { registerIpc } = await import('../src/main/ipc');
  const { IPC } = await import('../src/shared/ipc');
  const got: unknown[] = [];
  const main = { id: 'main' };
  const controller = new Proxy(
    { assistantWebContents: () => [], meetingBarWebContents: () => null, spacePanelWebContents: () => null, quickWebContents: () => null, setAssistantScopeConfig: (s: string, p: unknown) => got.push([s, p]) },
    { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => null) },
  );
  registerIpc({ webContents: main } as never, controller as never);
  const send = (patch: unknown) => handlers.get(IPC.setAssistantScopeConfig)!({ sender: main }, 'space:a', patch);
  send({ connection: '../x' });
  send({ connection: 'abcdefabcdef' });
  send({ connection: '' });
  expect(got).toEqual([
    ['space:a', { connection: 'abcdefabcdef' }],
    ['space:a', { connection: '' }],
  ]);
});
