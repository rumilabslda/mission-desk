/**
 * Assistant connections: named sign-ins the user sets up in Settings → Integrations (several Claude
 * Code accounts, Codex accounts, OpenRouter keys…), each chosen per space. An added Claude Code or
 * Codex connection has its own folder (CLAUDE_CONFIG_DIR / CODEX_HOME), so its sign-in, settings and
 * conversations stay apart; an OpenRouter connection has its own key. The built-ins are what the Mac
 * already has (its own Claude Code and Codex sign-ins, the OpenRouter key saved before).
 */

export type ConnectionKind = 'claude' | 'codex' | 'openrouter';
export const CONNECTION_KINDS: ConnectionKind[] = ['claude', 'codex', 'openrouter'];

export interface Connection {
  id: string;
  kind: ConnectionKind;
  name: string;
  addedAt: string;
  builtin?: boolean;
  email?: string;
  org?: string;
  plan?: string;
}

export const BUILTIN: Record<ConnectionKind, string> = { claude: 'mac-claude', codex: 'mac-codex', openrouter: 'openrouter' };
const BUILTIN_IDS = new Set(Object.values(BUILTIN));
export const ADDED_ID = /^[a-z0-9]{12}$/;

export const isConnectionKind = (v: unknown): v is ConnectionKind => v === 'claude' || v === 'codex' || v === 'openrouter';
/** '' (the type's built-in), a built-in id, or an added connection's id. */
export const isConnectionRef = (v: unknown): v is string => v === '' || (typeof v === 'string' && (BUILTIN_IDS.has(v) || ADDED_ID.test(v)));
export const isBuiltinId = (id: string): boolean => BUILTIN_IDS.has(id);

export type ConnectionTarget =
  | { kind: ConnectionKind; builtin: true }
  | { kind: 'claude' | 'codex'; id: string; dir: string }
  | { kind: 'openrouter'; id: string; keyName: string }
  | { kind: 'missing' };

/** Which connection a space's assistant runs on. One that doesn't exist (removed) is missing: never another. */
export function connectionTarget(engine: ConnectionKind, ref: string, list: Connection[], dirOf: (id: string) => string): ConnectionTarget {
  if (ref === '' || ref === BUILTIN[engine]) return { kind: engine, builtin: true };
  const c = list.find((x) => x.id === ref && !x.builtin);
  if (!c || c.kind !== engine) return { kind: 'missing' };
  if (c.kind === 'openrouter') return { kind: 'openrouter', id: c.id, keyName: `openrouter-${c.id}` };
  return { kind: c.kind, id: c.id, dir: dirOf(c.id) };
}

/** The environment a Claude Code or Codex process is started with for that connection. */
export function connectionEnv(base: Record<string, string>, t: ConnectionTarget): Record<string, string> {
  if (t.kind === 'missing') throw new Error('This space’s assistant connection was removed.');
  if ('builtin' in t) return base;
  if (t.kind === 'claude') return { ...base, CLAUDE_CONFIG_DIR: t.dir };
  if (t.kind === 'codex') return { ...base, CODEX_HOME: t.dir };
  return base;
}

/** `claude auth status --json`: who is signed in. Null when it isn't that JSON. */
export function parseAuthInfo(out: string): { loggedIn: boolean; email?: string; org?: string; plan?: string } | null {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(out) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof j !== 'object' || j === null || typeof j.loggedIn !== 'boolean') return null;
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length <= 200 ? v : undefined);
  if (!j.loggedIn) return { loggedIn: false };
  return {
    loggedIn: true,
    ...(str(j.email) ? { email: str(j.email) } : {}),
    ...(str(j.orgName) ? { org: str(j.orgName) } : {}),
    ...(str(j.subscriptionType) ? { plan: str(j.subscriptionType) } : {}),
  };
}
