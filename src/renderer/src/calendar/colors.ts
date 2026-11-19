import { ACCOUNT_COLORS } from '../../../shared/ipc';

/**
 * One colour per account in the combined calendar. Accounts keep their own
 * colour; when two share one, the later account gets the first unused palette
 * colour (only here: the account's own colour doesn't change).
 */
export function distinctColors(accounts: { id: string; color: string }[]): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  for (const a of accounts) {
    let color = a.color;
    if (used.has(color.toLowerCase())) color = ACCOUNT_COLORS.find((c) => !used.has(c.toLowerCase())) ?? a.color;
    used.add(color.toLowerCase());
    out.set(a.id, color);
  }
  return out;
}
