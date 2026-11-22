import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClaudeAccounts } from '../src/main/assistant/claude-accounts';
import { claudeEnv, claudeTarget, isClaudeAccountRef, parseAuthInfo } from '../src/shared/claude-accounts';
import { scopeConfig } from '../src/shared/assistant-engines';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-claude-acc-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('a space uses this Mac’s Claude account unless it picked another', () => {
  expect(scopeConfig({}, 'space:a').claudeAccount).toBe('');
  expect(scopeConfig({ scopes: { 'space:a': { claudeAccount: 'acme1234' } } }, 'space:a').claudeAccount).toBe('acme1234');
  expect(scopeConfig({ scopes: { 'space:a': { claudeAccount: '../evil' } } }, 'space:a').claudeAccount).toBe('');
  expect(isClaudeAccountRef('')).toBe(true);
  expect(isClaudeAccountRef('acme1234')).toBe(true);
  expect(isClaudeAccountRef('../x')).toBe(false);
});

test('an account that was removed is never replaced by the personal one', () => {
  const accounts = [{ id: 'acme1234', name: 'Acme', addedAt: '' }];
  const dirOf = (id: string) => `/data/claude-accounts/${id}`;
  expect(claudeTarget('', accounts, dirOf)).toEqual({ kind: 'mac' });
  expect(claudeTarget('acme1234', accounts, dirOf)).toEqual({ kind: 'account', id: 'acme1234', dir: '/data/claude-accounts/acme1234' });
  expect(claudeTarget('gone5678', accounts, dirOf)).toEqual({ kind: 'missing' });
});

test('Claude Code runs with the space’s account folder; this Mac’s account keeps the environment as it is', () => {
  const base = { PATH: '/bin', CLAUDE_CONFIG_DIR: '/Users/me/.claude-work' };
  expect(claudeEnv(base, { kind: 'mac' })).toEqual(base);
  expect(claudeEnv(base, { kind: 'account', id: 'a', dir: '/data/a' })).toEqual({ PATH: '/bin', CLAUDE_CONFIG_DIR: '/data/a' });
  expect(() => claudeEnv(base, { kind: 'missing' })).toThrow();
});

test('the sign-in status says who is signed in', () => {
  expect(parseAuthInfo('{"loggedIn":true,"authMethod":"claude.ai","email":"me@acme.com","orgName":"Acme","subscriptionType":"team"}')).toEqual({
    loggedIn: true,
    email: 'me@acme.com',
    org: 'Acme',
    plan: 'team',
  });
  expect(parseAuthInfo('{"loggedIn":false,"authMethod":"none"}')).toEqual({ loggedIn: false });
  expect(parseAuthInfo('not json')).toBeNull();
});

test('the registry adds, keeps and removes accounts, each with its own folder', () => {
  const r = createClaudeAccounts(dir);
  const a = r.add('  Acme  ');
  expect(a.name).toBe('Acme');
  expect(a.id).toMatch(/^[a-z0-9]{8,16}$/);
  expect(fs.existsSync(r.dirOf(a.id))).toBe(true);
  expect(fs.statSync(r.dirOf(a.id)).mode & 0o777).toBe(0o700);
  r.setInfo(a.id, { email: 'me@acme.com', org: 'Acme', plan: 'team' });
  const again = createClaudeAccounts(dir);
  expect(again.list()).toEqual([expect.objectContaining({ id: a.id, name: 'Acme', email: 'me@acme.com' })]);
  expect(again.remove(a.id)).toBe(true);
  expect(again.list()).toEqual([]);
  expect(fs.existsSync(r.dirOf(a.id))).toBe(false);
  expect(() => r.add('   ')).toThrow();
});

test('a damaged registry file loads as empty, and bad entries are dropped', () => {
  fs.writeFileSync(path.join(dir, 'claude-accounts.json'), JSON.stringify({ accounts: [{ id: '../x', name: 'Bad' }, { id: 'good1234', name: 'Good', addedAt: '' }] }));
  expect(createClaudeAccounts(dir).list().map((x) => x.id)).toEqual(['good1234']);
  fs.writeFileSync(path.join(dir, 'claude-accounts.json'), '{nope');
  expect(createClaudeAccounts(dir).list()).toEqual([]);
});
