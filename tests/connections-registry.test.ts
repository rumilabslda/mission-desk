import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createConnections } from '../src/main/assistant/connections';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-conn-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('add, rename and remove; Claude and Codex connections get their own folder', () => {
  const r = createConnections(dir);
  const c = r.add('codex', '  ChatGPT Rumi ');
  expect(c).toMatchObject({ kind: 'codex', name: 'ChatGPT Rumi' });
  expect(c.id).toMatch(/^[a-z0-9]{12}$/);
  expect(fs.statSync(r.dirOf(c.id)).mode & 0o777).toBe(0o700);
  const k = r.add('openrouter', 'OpenRouter X');
  expect(fs.existsSync(r.dirOf(k.id))).toBe(false); // a key, no folder
  r.rename(c.id, 'ChatGPT Acme');
  expect(createConnections(dir).get(c.id)?.name).toBe('ChatGPT Acme');
  expect(r.remove(c.id)).toBe(true);
  expect(fs.existsSync(r.dirOf(c.id))).toBe(false);
  expect(r.get(c.id)).toBeUndefined();
});

test('names are needed and unique', () => {
  const r = createConnections(dir);
  r.add('claude', 'Claude Acme');
  expect(() => r.add('claude', 'claude acme')).toThrow('taken');
  expect(() => r.add('claude', '   ')).toThrow('name');
  const other = r.add('claude', 'Claude 2');
  expect(() => r.rename(other.id, 'CLAUDE ACME')).toThrow('taken');
  expect(r.uniqueName('claude')).toBe('Claude 3');
  expect(r.uniqueName('codex')).toBe('Codex 2');
});

test('built-ins can be renamed but never removed', () => {
  const r = createConnections(dir);
  expect(r.nameOf('mac-claude')).toBe('Claude Code (this Mac)');
  r.rename('mac-claude', 'Claude pessoal');
  expect(createConnections(dir).nameOf('mac-claude')).toBe('Claude pessoal');
  expect(r.remove('mac-claude')).toBe(false);
});

test('a damaged file loads as empty', () => {
  fs.writeFileSync(path.join(dir, 'connections.json'), '{nope');
  expect(createConnections(dir).list()).toEqual([]);
});

test('yesterday’s Claude accounts become connections, keeping id, name and folder', () => {
  fs.mkdirSync(path.join(dir, 'claude-accounts', 'acme12345678'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'claude-accounts', 'acme12345678', '.claude.json'), '{"x":1}');
  fs.writeFileSync(path.join(dir, 'claude-accounts.json'), JSON.stringify({ accounts: [{ id: 'acme12345678', name: 'Acme', addedAt: '2026-11-22', email: 'me@acme.com' }] }));
  const r = createConnections(dir);
  expect(r.list()).toEqual([expect.objectContaining({ id: 'acme12345678', kind: 'claude', name: 'Acme', email: 'me@acme.com' })]);
  expect(fs.readFileSync(path.join(r.dirOf('acme12345678'), '.claude.json'), 'utf8')).toBe('{"x":1}');
  expect(fs.existsSync(path.join(dir, 'claude-accounts.json'))).toBe(false);
  expect(fs.existsSync(path.join(dir, 'claude-accounts'))).toBe(false);
});
