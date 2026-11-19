import type { ServiceId, UnreadCount } from '../../shared/types';
import { parseUnread } from './parsers';

export function dockBadgeText(counts: UnreadCount[]): string {
  const sum = counts.reduce<number>((n, c) => (typeof c === 'number' ? n + c : n), 0);
  if (sum > 0) return String(sum);
  return counts.includes('dot') ? '•' : '';
}

export interface UnreadTracker {
  /** Returns true when the account's count changed. Unknown titles keep the last value. */
  update(accountId: string, title: string, service: ServiceId): boolean;
  /** One view's count (e.g. Teams beside Outlook); the account shows the sum. Returns true when the sum changed. */
  set(accountId: string, part: string, count: UnreadCount): boolean;
  get(accountId: string): UnreadCount;
  all(): UnreadCount[];
  remove(accountId: string): void;
}

function sum(parts: Iterable<UnreadCount>): UnreadCount {
  let n = 0;
  let dot = false;
  for (const p of parts) {
    if (p === 'dot') dot = true;
    else n += p;
  }
  return n === 0 && dot ? 'dot' : n;
}

export function createUnreadTracker(): UnreadTracker {
  const counts = new Map<string, Map<string, UnreadCount>>(); // account → view → count
  const get = (accountId: string): UnreadCount => sum(counts.get(accountId)?.values() ?? []);
  function set(accountId: string, part: string, count: UnreadCount): boolean {
    const before = get(accountId);
    const parts = counts.get(accountId) ?? new Map<string, UnreadCount>();
    parts.set(part, count);
    counts.set(accountId, parts);
    return get(accountId) !== before;
  }
  return {
    update(accountId, title, service) {
      const next = parseUnread(service, title);
      return next === null ? false : set(accountId, 'main', next);
    },
    set,
    get,
    all: () => [...counts.keys()].map(get),
    remove: (accountId) => void counts.delete(accountId),
  };
}
