import { BUILTIN, type Connection, type ConnectionInfo, type ConnectionKind, type ConnectionState } from '../../shared/connections';
import type { Connections } from './connections';

type CliKind = 'claude' | 'codex';
type AuthInfo = { loggedIn: boolean; email?: string; org?: string; plan?: string };
export type FlowResult = { ok: true; id: string } | { ok: false; error: string };

export interface FlowDeps {
  registry: Connections;
  /** The environment for that kind's program: this Mac's own (folder null) or an added connection's folder. */
  env(kind: CliKind, folder: string | null): Record<string, string>;
  installed(kind: CliKind): Promise<boolean>;
  /** Runs the program's own sign-in (it opens the browser) and resolves when it ends, however it ends. */
  signIn(kind: CliKind, env: Record<string, string>): Promise<void>;
  authInfo(kind: CliKind, env: Record<string, string>): Promise<AuthInfo | null>;
  signOut(kind: CliKind, env: Record<string, string>): Promise<void>;
  checkKey(key: string): Promise<{ ok: true } | { ok: false; message: string }>;
  getKey(name: string): string | null;
  setKey(name: string, key: string): void;
  removeKey(name: string): void;
}

export const keyNameOf = (id: string): string => (id === BUILTIN.openrouter ? 'openrouter' : `openrouter-${id}`);
const infoOf = (a: AuthInfo): Partial<Connection> => ({ ...(a.email ? { email: a.email } : {}), ...(a.org ? { org: a.org } : {}), ...(a.plan ? { plan: a.plan } : {}) });

/**
 * Setting up, signing in and removing assistant connections. Errors are codes ('name', 'taken',
 * 'not-installed', 'signed-out', 'unknown') or the OpenRouter check's own message. A connection
 * that isn't connected when its setup ends is not kept: its folder or key goes with it.
 */
export function createConnectionFlows(d: FlowDeps) {
  const { registry } = d;

  async function connectCli(kind: CliKind, folder: string | null, id: string): Promise<boolean> {
    const env = d.env(kind, folder);
    await d.signIn(kind, env);
    const info = await d.authInfo(kind, env).catch(() => null);
    if (!info?.loggedIn) return false;
    if (folder) registry.setInfo(id, infoOf(info));
    return true;
  }

  return {
    async create(kind: ConnectionKind, name: string, key?: string): Promise<FlowResult> {
      if (kind !== 'openrouter' && !(await d.installed(kind))) return { ok: false, error: 'not-installed' };
      if (kind === 'openrouter' && !key?.trim()) return { ok: false, error: 'key' };
      let c: Connection;
      try {
        c = registry.add(kind, name, { pending: true }); // in no list until it connects
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
      if (kind === 'openrouter') {
        const r = await d.checkKey(key!.trim());
        if (!r.ok) {
          registry.remove(c.id);
          return { ok: false, error: r.message };
        }
        try {
          d.setKey(keyNameOf(c.id), key!.trim());
        } catch (e) {
          registry.remove(c.id);
          return { ok: false, error: (e as Error).message };
        }
        registry.confirm(c.id);
        return { ok: true, id: c.id };
      }
      const folder = registry.dirOf(c.id);
      const ok = await connectCli(kind, folder, c.id).catch(() => false);
      if (!ok) {
        // A sign-in that half finished may have left a Keychain item for this folder: sign it out first.
        await d.signOut(kind, d.env(kind, folder)).catch(() => undefined);
        registry.remove(c.id);
        return { ok: false, error: 'signed-out' };
      }
      registry.confirm(c.id);
      return { ok: true, id: c.id };
    },

    /** Signs a connection in again (Claude, Codex), or replaces its key (OpenRouter). */
    async signInAgain(id: string, key?: string): Promise<{ ok: true } | { ok: false; error: string }> {
      const kind = id === BUILTIN.claude ? 'claude' : id === BUILTIN.codex ? 'codex' : id === BUILTIN.openrouter ? 'openrouter' : registry.get(id)?.kind;
      if (!kind) return { ok: false, error: 'unknown' };
      if (kind === 'openrouter') {
        if (!key?.trim()) return { ok: false, error: 'key' };
        const r = await d.checkKey(key.trim());
        if (!r.ok) return { ok: false, error: r.message };
        d.setKey(keyNameOf(id), key.trim());
        return { ok: true };
      }
      if (!(await d.installed(kind))) return { ok: false, error: 'not-installed' };
      const folder = id === BUILTIN[kind] ? null : registry.dirOf(id);
      return (await connectCli(kind, folder, id).catch(() => false)) ? { ok: true } : { ok: false, error: 'signed-out' };
    },

    /** Signs an added connection out and deletes its folder or key. Built-ins are never removed. */
    async remove(id: string): Promise<boolean> {
      const c = registry.get(id);
      if (!c || c.builtin) return false;
      // Out of the list first, at once: no session can start on it while it signs out.
      const env = c.kind === 'openrouter' ? null : d.env(c.kind, registry.dirOf(id));
      registry.forget(id);
      if (c.kind === 'openrouter') d.removeKey(keyNameOf(id));
      else if (env) await d.signOut(c.kind, env).catch(() => undefined);
      registry.removeFolder(id);
      return true;
    },

    /** Every connection that exists, built-ins first within each type, with whether it's ready. A built-in
   * that wasn't renamed has no name: Settings shows its name in the user's language. */
    async info(): Promise<ConnectionInfo[]> {
      const out: ConnectionInfo[] = [];
      for (const kind of ['claude', 'codex'] as const) {
        const installed = await d.installed(kind).catch(() => false);
        const state = async (folder: string | null): Promise<{ state: ConnectionState; info: AuthInfo | null }> => {
          if (!installed) return { state: 'not-installed', info: null };
          const info = await d.authInfo(kind, d.env(kind, folder)).catch(() => null);
          return { state: info?.loggedIn ? 'ready' : 'signed-out', info };
        };
        if (installed) {
          const b = BUILTIN[kind];
          const s = await state(null);
          out.push({ ...(registry.get(b) ?? { id: b, kind, name: '', addedAt: '' }), builtin: true, ...(s.info?.loggedIn ? infoOf(s.info) : {}), state: s.state });
        }
        for (const c of registry.list().filter((x) => x.kind === kind && !x.builtin)) {
          const s = await state(registry.dirOf(c.id));
          if (s.info?.loggedIn && (s.info.email !== c.email || s.info.org !== c.org)) registry.setInfo(c.id, infoOf(s.info));
          out.push({ ...c, ...(s.info?.loggedIn ? infoOf(s.info) : {}), state: s.state });
        }
      }
      if (d.getKey('openrouter') !== null) {
        const b = BUILTIN.openrouter;
        out.push({ ...(registry.get(b) ?? { id: b, kind: 'openrouter' as const, name: '', addedAt: '' }), builtin: true, state: 'ready' });
      }
      for (const c of registry.list().filter((x) => x.kind === 'openrouter' && !x.builtin)) {
        out.push({ ...c, state: d.getKey(keyNameOf(c.id)) !== null ? 'ready' : 'signed-out' });
      }
      return out;
    },
  };
}
export type ConnectionFlows = ReturnType<typeof createConnectionFlows>;
