/**
 * More than one Claude Code account (personal, a client's…): each extra account has its own Claude Code
 * folder (CLAUDE_CONFIG_DIR), so its sign-in, settings and conversations stay apart. A space picks one;
 * '' is this Mac's own Claude Code account.
 */

export interface ClaudeAccount {
  id: string;
  name: string;
  addedAt: string;
  email?: string;
  org?: string;
  plan?: string;
}

export type ClaudeTarget = { kind: 'mac' } | { kind: 'account'; id: string; dir: string } | { kind: 'missing' };

export const isClaudeAccountRef = (v: unknown): v is string => v === '' || (typeof v === 'string' && /^[a-z0-9]{8,16}$/.test(v));

/** Which Claude Code a space runs. An account that no longer exists is "missing", never the personal one. */
export function claudeTarget(ref: string, accounts: { id: string }[], dirOf: (id: string) => string): ClaudeTarget {
  if (!ref) return { kind: 'mac' };
  return accounts.some((a) => a.id === ref) ? { kind: 'account', id: ref, dir: dirOf(ref) } : { kind: 'missing' };
}

/** The environment Claude Code is started with for that target. */
export function claudeEnv(base: Record<string, string>, target: ClaudeTarget): Record<string, string> {
  if (target.kind === 'missing') throw new Error('This space’s Claude account was removed.');
  return target.kind === 'mac' ? base : { ...base, CLAUDE_CONFIG_DIR: target.dir };
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
