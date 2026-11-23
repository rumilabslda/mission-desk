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

type Stored = Connection & { pending?: boolean };

/**
 * The assistant connections: a list in <dir>/connections.json (mode 600) and, for each added Claude
 * Code or Codex connection, its own folder <dir>/connections/<id> (mode 700). Built-ins are stored
 * only once renamed. Yesterday's <dir>/claude-accounts.json is taken over once, on load; its folders
 * stay where they are (<dir>/claude-accounts/<id>), since Claude Code keys its Keychain sign-in on
 * the folder's path. A connection still being set up is pending: in no list, and gone after a restart.
 */
export function createConnections(dir: string) {
  const file = path.join(dir, 'connections.json');
  const root = path.join(dir, 'connections');
  const legacyRoot = path.join(dir, 'claude-accounts');
  let items: Stored[] = load();
  dropPending();
  migrateClaudeAccounts();

  function load(): Stored[] {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { connections?: unknown };
      if (!Array.isArray(raw.connections)) return [];
      const seen = new Set<string>();
      return raw.connections
        .map((c): Stored | null => {
          const x = sanitize(c);
          return x && (c as { pending?: unknown }).pending === true && !x.builtin ? { ...x, pending: true } : x;
        })
        .filter((c): c is Stored => !!c && !seen.has(c.id) && !!seen.add(c.id));
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
    const legacy = path.join(legacyRoot, id); // an account from 2026-11-22: its sign-in is keyed on this path
    return fs.existsSync(legacy) ? legacy : path.join(root, id);
  }

  /** A setup the app quit in the middle of: nothing of it is kept. */
  function dropPending(): void {
    const pending = items.filter((c) => c.pending);
    if (!pending.length) return;
    items = items.filter((c) => !c.pending);
    try {
      save();
    } catch {
      return;
    }
    for (const c of pending) fs.rmSync(dirOf(c.id), { recursive: true, force: true });
  }

  function migrateClaudeAccounts(): void {
    const oldFile = path.join(dir, 'claude-accounts.json');
    if (!fs.existsSync(oldFile)) return;
    let accounts: unknown[];
    try {
      const raw = JSON.parse(fs.readFileSync(oldFile, 'utf8')) as { accounts?: unknown };
      accounts = Array.isArray(raw.accounts) ? raw.accounts : [];
    } catch {
      return; // damaged: left as it is, nothing taken over
    }
    const before = items;
    for (const a of accounts) {
      const c = sanitize(a, 'claude');
      if (!c || c.builtin || items.some((x) => x.id === c.id)) continue;
      items = [...items, c];
    }
    try {
      save();
    } catch {
      items = before; // not written: the old file stays, and is taken over next time
      return;
    }
    fs.rmSync(oldFile, { force: true });
  }

  const visible = (): Connection[] => items.filter((c) => !c.pending).map(({ pending: _p, ...c }) => c);
  const nameOf = (id: string): string => items.find((c) => c.id === id && !c.pending)?.name ?? BUILTIN_NAMES[id] ?? '';
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
    list: visible,
    get: (id: string): Connection | undefined => visible().find((c) => c.id === id),
    dirOf,
    nameOf,
    uniqueName(kind: ConnectionKind): string {
      for (let n = 2; ; n++) {
        const name = `${BASE_NAMES[kind]} ${n}`;
        if (!taken(name)) return name;
      }
    },
    /** Adds a connection; a pending one stays out of every list until confirm(). */
    add(kind: ConnectionKind, name: string, opts: { pending?: boolean } = {}): Connection {
      if (!isConnectionKind(kind)) throw new Error('kind');
      const clean = checkName(name);
      const c: Connection = { id: randomBytes(6).toString('hex'), kind, name: clean, addedAt: new Date().toISOString() };
      if (kind !== 'openrouter') {
        fs.mkdirSync(dirOf(c.id), { recursive: true, mode: 0o700 });
        fs.chmodSync(dirOf(c.id), 0o700);
      }
      items = [...items, opts.pending ? { ...c, pending: true } : c];
      save();
      return c;
    },
    /** A pending connection that connected: now it is listed and kept. */
    confirm(id: string): void {
      if (!items.some((c) => c.id === id && c.pending)) return;
      items = items.map((c) => (c.id === id ? (({ pending: _p, ...x }) => x)(c) : c));
      save();
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
    /** Takes an added connection (pending or not) out of the list; its folder stays until removeFolder. Built-ins are never removed. */
    forget(id: string): boolean {
      if (isBuiltinId(id) || !items.some((c) => c.id === id)) return false;
      items = items.filter((c) => c.id !== id);
      save();
      return true;
    },
    removeFolder(id: string): void {
      fs.rmSync(dirOf(id), { recursive: true, force: true });
    },
    /** Forgets an added connection and deletes its folder. */
    remove(id: string): boolean {
      if (isBuiltinId(id) || !items.some((c) => c.id === id)) return false;
      const folder = dirOf(id);
      items = items.filter((c) => c.id !== id);
      save();
      fs.rmSync(folder, { recursive: true, force: true });
      return true;
    },
  };
}
export type Connections = ReturnType<typeof createConnections>;
