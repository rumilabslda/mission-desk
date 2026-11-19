// Which accounts an assistant conversation may see. In per-space mode each space has its own
// assistant (seeing only that space's accounts); "All spaces" and the one-for-everything mode
// see every account shared with Claude.

export type AssistantMode = 'space' | 'all';

type Acct = { id: string; spaceId?: string; claudeAccess?: 'off' | 'read' | 'act' };

export function scopeOfAccount(a: { spaceId?: string }, mode: AssistantMode): string {
  if (mode === 'all') return 'all';
  return a.spaceId ? `space:${a.spaceId}` : 'nospace';
}

/** The shared accounts (Claude access other than off) a scope sees. */
export function accountsInScope<A extends Acct>(accounts: A[], scope: string): A[] {
  const shared = accounts.filter((a) => (a.claudeAccess ?? 'off') !== 'off');
  if (scope === 'all') return shared;
  if (scope === 'nospace') return shared.filter((a) => !a.spaceId);
  if (scope.startsWith('space:')) return shared.filter((a) => a.spaceId === scope.slice(6));
  return [];
}

export function scopeList(accounts: { spaceId?: string }[], spaces: { id: string; name: string }[], mode: AssistantMode): { key: string; name: string }[] {
  if (mode === 'all') return [{ key: 'all', name: 'Everything' }];
  return [
    ...spaces.map((s) => ({ key: `space:${s.id}`, name: s.name })),
    ...(accounts.some((a) => !a.spaceId) ? [{ key: 'nospace', name: 'No space' }] : []),
    { key: 'all', name: 'All spaces' },
  ];
}

export function isScopeKey(v: unknown): v is string {
  return typeof v === 'string' && (v === 'all' || v === 'nospace' || /^space:[\w-]{1,64}$/.test(v));
}
