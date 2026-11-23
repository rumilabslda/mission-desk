import { connectionEnv, type ConnectionKind, type ConnectionTarget } from '../../shared/connections';

/**
 * The environment a Claude Code or Codex session of that kind starts with. A removed connection, or
 * one of another kind, is an error: the session never falls back to another sign-in.
 */
export function sessionEnvFor(kind: ConnectionKind, base: Record<string, string>, target: ConnectionTarget): Record<string, string> | { error: 'missing' } {
  if (target.kind !== kind) return { error: 'missing' };
  return connectionEnv(base, target);
}

/** The Keychain name of the OpenRouter key a connection uses; null when it isn't an OpenRouter one. */
export function openRouterKeyName(target: ConnectionTarget): string | null {
  if (target.kind !== 'openrouter') return null;
  return 'builtin' in target ? 'openrouter' : target.keyName;
}
