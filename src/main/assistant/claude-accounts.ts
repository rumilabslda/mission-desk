import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ClaudeAccount } from '../../shared/claude-accounts';

/**
 * The extra Claude Code accounts: a list in <dir>/claude-accounts.json and one Claude Code folder each
 * in <dir>/claude-accounts/<id> (its sign-in, settings and conversations). Only on this Mac.
 */
export function createClaudeAccounts(dir: string) {
  const file = path.join(dir, 'claude-accounts.json');
  const root = path.join(dir, 'claude-accounts');
  const ID = /^[a-z0-9]{8,16}$/;
  let accounts: ClaudeAccount[] = load();

  function load(): ClaudeAccount[] {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { accounts?: unknown };
      if (!Array.isArray(raw.accounts)) return [];
      return raw.accounts
        .filter((a): a is ClaudeAccount => typeof a === 'object' && a !== null && typeof (a as ClaudeAccount).id === 'string' && ID.test((a as ClaudeAccount).id) && typeof (a as ClaudeAccount).name === 'string')
        .map((a) => ({
          id: a.id,
          name: a.name.slice(0, 40),
          addedAt: String(a.addedAt ?? ''),
          ...(typeof a.email === 'string' ? { email: a.email.slice(0, 200) } : {}),
          ...(typeof a.org === 'string' ? { org: a.org.slice(0, 200) } : {}),
          ...(typeof a.plan === 'string' ? { plan: a.plan.slice(0, 40) } : {}),
        }));
    } catch {
      return [];
    }
  }

  function save(): void {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ accounts }, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  const dirOf = (id: string): string => {
    if (!ID.test(id)) throw new Error('bad account id');
    return path.join(root, id);
  };

  return {
    list: (): ClaudeAccount[] => accounts,
    dirOf,
    add(name: string): ClaudeAccount {
      const clean = name.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!clean) throw new Error('A name is needed.');
      const a: ClaudeAccount = { id: randomBytes(6).toString('hex'), name: clean, addedAt: new Date().toISOString() };
      fs.mkdirSync(dirOf(a.id), { recursive: true, mode: 0o700 });
      fs.chmodSync(dirOf(a.id), 0o700);
      accounts = [...accounts, a];
      save();
      return a;
    },
    setInfo(id: string, info: { email?: string; org?: string; plan?: string }): void {
      accounts = accounts.map((a) => (a.id === id ? { ...a, ...info } : a));
      save();
    },
    rename(id: string, name: string): void {
      const clean = name.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!clean) return;
      accounts = accounts.map((a) => (a.id === id ? { ...a, name: clean } : a));
      save();
    },
    /** Forgets the account and deletes its Claude Code folder (sign-in, settings, conversations). */
    remove(id: string): boolean {
      if (!accounts.some((a) => a.id === id)) return false;
      accounts = accounts.filter((a) => a.id !== id);
      save();
      fs.rmSync(dirOf(id), { recursive: true, force: true });
      return true;
    },
  };
}
export type ClaudeAccounts = ReturnType<typeof createClaudeAccounts>;
