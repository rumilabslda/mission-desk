import type { UnreadCount } from '../../shared/types';
import { GMAIL_FEED_URL, GMAIL_PRIMARY_FEED_URL, type MailEntry, parseGmailFeed } from './gmail-feed';

export interface GmailMailDeps {
  /** A GET with the account's cookies. */
  fetch(accountId: string, url: string): Promise<{ status: number; text(): Promise<string> }>;
  onChange(accountId: string): void;
  /** What Gmail's title counts as unread (Primary only, when the inbox has tabs). */
  unread(accountId: string): UnreadCount;
  /** A burst of refreshes (the unread count settling) makes one fetch after this long. */
  delayMs?: number;
}

/** Each Google account's unread Inbox mail, kept in memory and refreshed on demand. */
export function createGmailMail(deps: GmailMailDeps) {
  const delay = deps.delayMs ?? 1500;
  const byAccount = new Map<string, MailEntry[]>();
  const working = new Set<string>();
  const pending = new Map<string, Promise<void>>();
  const sig = (es: MailEntry[] | undefined): string => (es ?? []).map((e) => `${e.id}:${e.at}`).join(',');

  async function load(accountId: string): Promise<void> {
    let entries: MailEntry[] | null = null;
    try {
      const res = await deps.fetch(accountId, GMAIL_FEED_URL);
      if (res.status === 200) entries = parseGmailFeed(await res.text());
      else if (res.status !== 401 && res.status !== 403) return; // a server blip: keep what we had
      // Inbox tabs: Gmail counts only Primary, the feed has every tab. Then Primary's own feed.
      const n = deps.unread(accountId);
      if (entries && typeof n === 'number' && entries.length > n) {
        const primary = await deps.fetch(accountId, GMAIL_PRIMARY_FEED_URL);
        const p = primary.status === 200 ? parseGmailFeed(await primary.text()) : null;
        if (p && p.length > 0) entries = p;
      }
    } catch {
      return; // offline: keep what we had
    }
    const before = sig(byAccount.get(accountId));
    if (entries) {
      working.add(accountId);
      byAccount.set(accountId, entries);
    } else {
      working.delete(accountId);
      byAccount.delete(accountId);
    }
    if (sig(byAccount.get(accountId)) !== before) deps.onChange(accountId);
  }

  return {
    refresh(accountId: string): Promise<void> {
      const p = pending.get(accountId);
      if (p) return p;
      const next = new Promise<void>((r) => setTimeout(r, delay))
        .then(() => load(accountId))
        .finally(() => pending.delete(accountId));
      pending.set(accountId, next);
      return next;
    },
    entries: (accountId: string): MailEntry[] => byAccount.get(accountId) ?? [],
    /** The feed answered for this account (so its emails show without notifications). */
    working: (accountId: string): boolean => working.has(accountId),
    forget(accountId: string): void {
      const had = (byAccount.get(accountId)?.length ?? 0) > 0;
      byAccount.delete(accountId);
      if (had) deps.onChange(accountId);
    },
    /** The account was removed. */
    drop(accountId: string): void {
      byAccount.delete(accountId);
      working.delete(accountId);
    },
  };
}

export type GmailMail = ReturnType<typeof createGmailMail>;
