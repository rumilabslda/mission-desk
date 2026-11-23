import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ADDED_ID, BUILTIN, isBuiltinId, isConnectionKind, type Connection, type ConnectionKind } from '../../shared/connections';

/** What a built-in is called until the user renames it. */
const BUILTIN_NAMES: Record<string, string> = {
  [BUILTIN.claude]: 'Claude Code (this Mac)',
  [BUILTIN.codex]: 'Codex (this Mac)',
  [BUILTIN.openrouter]: 'OpenRouter',
};
const BASE_NAMES: Record<ConnectionKind, string> = { claude: 'Claude', codex: 'Codex', openrouter: 'OpenRouter' };
const BUILTIN_KIND: Record<string, ConnectionKind> = { [BUILTIN.claude]: 'claude', [BUILTIN.codex]: 'codex', [BUILTIN.openrouter]: 'openrouter' };

const cleanName = (name: string): string => name.replace(/\s+/g, ' ').trim().slice(0, 40);
const str = (v: unknown, max: number): string | undefined => (typeof v === 'string' ? v.slice(0, max) : undefined);

function sanitize(raw: unknown, kind?: ConnectionKind): Connection | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = r.id;
  if (typeof id !== 'string' || typeof r.name !== 'string') return null;
  const builtin = isBuiltinId(id);
  if (!builtin && !ADDED_ID.test(id)) return null;
  const k = builtin ? BUILTIN_KIND[id] : (kind ?? r.kind);
  if (!isConnectionKind(k)) return null;
  const name = cleanName(r.name);
  if (!name) return null;
  const email = str(r.email, 200);
  const org = str(r.org, 200);
  const plan = str(r.plan, 40);
  return {
    id,
    kind: k,
    name,
    addedAt: String(r.addedAt ?? ''),
    ...(builtin ? { builtin: true } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(org !== undefined ? { org } : {}),
    ...(plan !== undefined ? { plan } : {}),
  };
}

/**
 * The assistant connections: a list in <dir>/connections.json (mode 600) and, for each added Claude
 * Code or Codex connection, its own folder <dir>/connections/<id> (mode 700). Built-ins are stored
 * only once renamed. Yesterday's <dir>/claude-accounts.json is taken over once, on load.
 */
export function createConnections(dir: string) {
  const file = path.join(dir, 'connections.json');
  const root = path.join(dir, 'connections');
  let items: Connection[] = load();
  migrateClaudeAccounts();

  function load(): Connection[] {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { connections?: unknown };
      if (!Array.isArray(raw.connections)) return [];
      const seen = new Set<string>();
      return raw.connections.map((c) => sanitize(c)).filter((c): c is Connection => !!c && !seen.has(c.id) && !!seen.add(c.id));
    } catch {
      return [];
    }
  }

  function save(): void {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ connections: items }, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  function dirOf(id: string): string {
    if (!ADDED_ID.test(id)) throw new Error('bad connection id');
    return path.join(root, id);
  }

  function migrateClaudeAccounts(): void {
    const oldFile = path.join(dir, 'claude-accounts.json');
    const oldRoot = path.join(dir, 'claude-accounts');
    if (!fs.existsSync(oldFile)) return;
    let accounts: unknown[] = [];
    try {
      const raw = JSON.parse(fs.readFileSync(oldFile, 'utf8')) as { accounts?: unknown };
      if (Array.isArray(raw.accounts)) accounts = raw.accounts;
    } catch {
      /* a damaged old file has nothing to bring over */
    }
    for (const a of accounts) {
      const c = sanitize(a, 'claude');
      if (!c || c.builtin || items.some((x) => x.id === c.id)) continue;
      const from = path.join(oldRoot, c.id);
      const to = dirOf(c.id);
      try {
        if (fs.existsSync(from) && !fs.existsSync(to)) {
          fs.mkdirSync(root, { recursive: true });
          fs.renameSync(from, to);
        }
      } catch {
        continue; // its folder couldn't move: leave the account where it was rather than lose its sign-in
      }
      items = [...items, c];
    }
    save();
    fs.rmSync(oldFile, { force: true });
    try {
      fs.rmdirSync(oldRoot); // only when empty: anything left there stays
    } catch {
      /* not there, or not empty */
    }
  }

  const nameOf = (id: string): string => items.find((c) => c.id === id)?.name ?? BUILTIN_NAMES[id] ?? '';
  const taken = (name: string, except?: string): boolean => {
    const low = name.toLowerCase();
    const names = [...items.filter((c) => c.id !== except).map((c) => c.name), ...Object.keys(BUILTIN_NAMES).filter((id) => id !== except && !items.some((c) => c.id === id)).map((id) => BUILTIN_NAMES[id])];
    return names.some((n) => n.toLowerCase() === low);
  };
  const checkName = (name: string, except?: string): string => {
    const clean = cleanName(name);
    if (!clean) throw new Error('name');
    if (taken(clean, except)) throw new Error('taken');
    return clean;
  };

  return {
    list: (): Connection[] => items,
    get: (id: string): Connection | undefined => items.find((c) => c.id === id),
    dirOf,
    nameOf,
    uniqueName(kind: ConnectionKind): string {
      for (let n = 2; ; n++) {
        const name = `${BASE_NAMES[kind]} ${n}`;
        if (!taken(name)) return name;
      }
    },
    add(kind: ConnectionKind, name: string): Connection {
      if (!isConnectionKind(kind)) throw new Error('kind');
      const clean = checkName(name);
      const c: Connection = { id: randomBytes(6).toString('hex'), kind, name: clean, addedAt: new Date().toISOString() };
      if (kind !== 'openrouter') {
        fs.mkdirSync(dirOf(c.id), { recursive: true, mode: 0o700 });
        fs.chmodSync(dirOf(c.id), 0o700);
      }
      items = [...items, c];
      save();
      return c;
    },
    rename(id: string, name: string): void {
      const clean = checkName(name, id);
      if (isBuiltinId(id) && !items.some((c) => c.id === id)) {
        items = [...items, { id, kind: BUILTIN_KIND[id], name: clean, addedAt: '', builtin: true }];
      } else if (items.some((c) => c.id === id)) {
        items = items.map((c) => (c.id === id ? { ...c, name: clean } : c));
      } else return;
      save();
    },
    setInfo(id: string, info: { email?: string; org?: string; plan?: string }): void {
      if (!items.some((c) => c.id === id)) return;
      items = items.map((c) => (c.id === id ? { ...c, ...info } : c));
      save();
    },
    /** Forgets an added connection and deletes its folder. Built-ins are never removed. */
    remove(id: string): boolean {
      if (isBuiltinId(id) || !items.some((c) => c.id === id)) return false;
      items = items.filter((c) => c.id !== id);
      save();
      fs.rmSync(dirOf(id), { recursive: true, force: true });
      return true;
    },
  };
}
export type Connections = ReturnType<typeof createConnections>;
