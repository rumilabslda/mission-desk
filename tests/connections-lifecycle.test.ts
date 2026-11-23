import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createConnectionFlows } from '../src/main/assistant/connection-flows';
import { createConnections } from '../src/main/assistant/connections';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-flows-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function setup(over: { loggedIn?: boolean; installed?: boolean; keyOk?: boolean } = {}) {
  const registry = createConnections(dir);
  const keys = new Map<string, string>();
  const calls: string[] = [];
  const signedIn = new Set<string>();
  const flows = createConnectionFlows({
    registry,
    env: (kind, folder) => ({ WHO: `${kind}:${folder ?? 'mac'}` }),
    installed: async () => over.installed ?? true,
    signIn: async (kind, env) => {
      calls.push(`signIn ${env.WHO}`);
      if (over.loggedIn ?? true) signedIn.add(env.WHO);
    },
    authInfo: async (_kind, env) => (signedIn.has(env.WHO) ? { loggedIn: true, email: 'me@acme.com' } : { loggedIn: false }),
    signOut: async (_kind, env) => void calls.push(`signOut ${env.WHO}`),
    checkKey: async (key) => (over.keyOk ?? key === 'sk-good' ? { ok: true as const } : { ok: false as const, message: 'Key refused' }),
    getKey: (name) => keys.get(name) ?? null,
    setKey: (name, key) => void keys.set(name, key),
    removeKey: (name) => void keys.delete(name),
  });
  return { registry, keys, calls, flows };
}

test('a Claude connection whose sign-in ends signed out leaves nothing behind, not even a half sign-in', async () => {
  const { registry, flows, calls } = setup({ loggedIn: false });
  const r = await flows.create('claude', 'Claude Acme');
  expect(r.ok).toBe(false);
  expect(calls.some((c) => c.startsWith('signOut claude:'))).toBe(true);
  expect(registry.list()).toEqual([]);
  expect(fs.existsSync(path.join(dir, 'connections')) ? fs.readdirSync(path.join(dir, 'connections')) : []).toEqual([]);
});

test('a signed-in Claude connection is kept with who it is', async () => {
  const { registry, flows, calls } = setup();
  const r = await flows.create('claude', 'Claude Acme');
  if (!r.ok) throw new Error(r.error);
  expect(calls).toEqual([`signIn claude:${registry.dirOf(r.id)}`]);
  expect(registry.get(r.id)).toMatchObject({ name: 'Claude Acme', email: 'me@acme.com' });
});

test('not installed: nothing is created and no sign-in runs', async () => {
  const { registry, flows, calls } = setup({ installed: false });
  expect(await flows.create('codex', 'Codex Acme')).toEqual({ ok: false, error: 'not-installed' });
  expect(registry.list()).toEqual([]);
  expect(calls).toEqual([]);
});

test('OpenRouter: a bad key leaves nothing, a good one is stored as openrouter-<id>', async () => {
  const { registry, flows, keys } = setup();
  expect(await flows.create('openrouter', 'OR X', 'sk-bad')).toEqual({ ok: false, error: 'Key refused' });
  expect(registry.list()).toEqual([]);
  expect(keys.size).toBe(0);
  const r = await flows.create('openrouter', 'OR X', 'sk-good');
  if (!r.ok) throw new Error(r.error);
  expect([...keys]).toEqual([[`openrouter-${r.id}`, 'sk-good']]);
});

test('remove signs out and deletes the folder, or deletes the key; built-ins are refused', async () => {
  const { registry, flows, keys, calls } = setup();
  const c = await flows.create('codex', 'Codex Acme');
  const k = await flows.create('openrouter', 'OR X', 'sk-good');
  if (!c.ok || !k.ok) throw new Error('create failed');
  const folder = registry.dirOf(c.id);
  expect(await flows.remove(c.id)).toBe(true);
  expect(calls).toContain(`signOut codex:${folder}`);
  expect(fs.existsSync(folder)).toBe(false);
  expect(await flows.remove(k.id)).toBe(true);
  expect(keys.size).toBe(0);
  expect(await flows.remove('mac-claude')).toBe(false);
  expect(registry.list()).toEqual([]);
});

test('while it signs in, a new connection is in no list; a removed one leaves the list before its sign-out', async () => {
  const { registry, flows } = setup();
  let seenDuring: unknown = 'not called';
  const r = await flows.create('claude', 'Claude Acme');
  if (!r.ok) throw new Error(r.error);
  expect(registry.list().map((c) => c.id)).toEqual([r.id]);
  const removing = createConnectionFlows({
    registry,
    env: (kind, folder) => ({ WHO: `${kind}:${folder ?? 'mac'}` }),
    installed: async () => true,
    signIn: async () => undefined,
    authInfo: async () => ({ loggedIn: false }),
    signOut: async () => void (seenDuring = registry.get(r.id)),
    checkKey: async () => ({ ok: true as const }),
    getKey: () => null,
    setKey: () => undefined,
    removeKey: () => undefined,
  });
  const folder = registry.dirOf(r.id);
  const p = removing.remove(r.id);
  expect(registry.get(r.id)).toBeUndefined(); // gone at once: no new session can start on it
  expect(await p).toBe(true);
  expect(seenDuring).toBeUndefined();
  expect(fs.existsSync(folder)).toBe(false);
});

test('a duplicate name is refused before any sign-in', async () => {
  const { flows, calls } = setup();
  await flows.create('claude', 'Claude Acme');
  calls.length = 0;
  expect(await flows.create('codex', 'claude acme')).toEqual({ ok: false, error: 'taken' });
  expect(calls).toEqual([]);
});

test('info lists the built-ins that exist, then the added ones, with their state', async () => {
  const { flows, keys } = setup();
  const a = await flows.create('claude', 'Claude Acme');
  if (!a.ok) throw new Error('create failed');
  keys.set('openrouter', 'sk-mac');
  const list = await flows.info();
  expect(list.map((c) => [c.id, c.state])).toEqual([
    ['mac-claude', 'signed-out'],
    [a.id, 'ready'],
    ['mac-codex', 'signed-out'],
    ['openrouter', 'ready'],
  ]);
});
