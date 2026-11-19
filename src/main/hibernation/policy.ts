import type { Account, AppState, ViewKind } from '../../shared/types';
import type { ViewPolicy } from './scheduler';

export const IDLE_MS = 10 * 60 * 1000;
export const STAGGER_MS = 3000;

/** The views that run in the background so notifications arrive: the main page, and Teams once used. */
export function backgroundKinds(account: Account): ViewKind[] {
  return account.service === 'microsoft' && account.teamsInBackground ? ['main', 'teams'] : ['main'];
}

export function viewPolicy(account: Account, kind: ViewKind): ViewPolicy {
  if (backgroundKinds(account).includes(kind)) return account.hibernateWhenIdle ? 'idle' : 'always-on';
  return 'idle';
}

export function startupPlan(state: AppState): { immediate: string | null; staggered: string[] } {
  const active = state.accounts.find((a) => a.id === state.activeAccountId) ?? state.accounts[0];
  const immediate = active?.id ?? null;
  const staggered = state.accounts.filter((a) => a.id !== immediate && !a.hibernateWhenIdle).map((a) => a.id);
  return { immediate, staggered };
}
