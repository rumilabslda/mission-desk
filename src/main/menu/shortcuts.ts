import type { Account } from '../../shared/types';

/** ⌘n selects the n-th account (1–9) in sidebar order. */
export function accountIdForShortcut(accounts: Account[], n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > 9) return null;
  return accounts[n - 1]?.id ?? null;
}
