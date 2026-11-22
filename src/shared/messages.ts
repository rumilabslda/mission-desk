import { intlLocale, t } from './i18n';
import type { ViewKind } from './types';

/**
 * Home's message list: the notifications the apps send (a chat, a mail), one line per conversation.
 * Kept in memory only (never on disk), newest first.
 */
export const MAX_MESSAGES = 50;
/** Per app, so one busy page can't push the others' lines out. */
export const MAX_PER_ACCOUNT = 15;
const MAX_TITLE = 200;
const MAX_BODY = 300;

export interface Message {
  key: string;
  accountId: string;
  kind: ViewKind;
  /** The page that sent it and its id for the latest notification (to open the chat, or see it read). */
  sender: number;
  id: number;
  /** What the page called the conversation ('' when it gave nothing). */
  tag: string;
  title: string;
  body: string;
  at: number;
  /** Messages in this conversation since it was last read. */
  count: number;
}
export type Feed = Message[];

/** What the UI gets (no page internals). */
export interface MessageView {
  key: string;
  accountId: string;
  title: string;
  body: string;
  at: number;
  count: number;
}

// Cut first (a page may send megabytes), drop control and text-direction characters (a page must
// not reorder what Home shows), then collapse spaces.
const clean = (v: unknown, max: number): string =>
  typeof v === 'string'
    ? v
        .slice(0, max * 2)
        .replace(/[\u0000-\u0008\u000B-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';
// A conversation is the page's tag; without one, its title (two people with the same name in one app
// share a line, which is acceptable).
const conversation = (accountId: string, tag: string, title: string): string => `${accountId}\u0000${tag ? `t:${tag}` : `n:${title}`}`;

/** A notification arrives: it becomes the top line (replacing its conversation's older one). */
export function addMessage(
  feed: Feed,
  n: { accountId: string; kind: ViewKind; sender: number; id: number; title: unknown; body: unknown; tag: unknown },
  now: number,
): Feed {
  const title = clean(n.title, MAX_TITLE);
  const body = clean(n.body, MAX_BODY);
  if (!title && !body) return feed;
  const tag = clean(n.tag, MAX_TITLE);
  const key = conversation(n.accountId, tag, title);
  const before = feed.find((m) => m.key === key);
  const line: Message = { key, accountId: n.accountId, kind: n.kind, sender: n.sender, id: n.id, tag, title, body, at: now, count: (before?.count ?? 0) + 1 };
  const rest = feed.filter((m) => m.key !== key);
  const mine = rest.filter((m) => m.accountId === n.accountId);
  const drop = new Set(mine.slice(MAX_PER_ACCOUNT - 1).map((m) => m.key)); // this app's oldest beyond its share
  return [line, ...rest.filter((m) => !drop.has(m.key))].slice(0, MAX_MESSAGES);
}

/** The page closed a notification (usually: the chat was read there). Only its latest one counts. */
export function closeMessage(feed: Feed, sender: number, id: number): Feed {
  return feed.filter((m) => !(m.sender === sender && m.id === id));
}

/** The account has nothing unread any more: its lines go. */
export function forAccountRead(feed: Feed, accountId: string): Feed {
  return feed.filter((m) => m.accountId !== accountId);
}

const asNumber = (u: number | 'dot'): number => (u === 'dot' ? 1 : u);

/**
 * The app's unread count went down: only as many of its lines as it still has unread stay (the
 * newest). Nothing happens unless the count dropped, so an app that never reports a count keeps
 * its lines until they are read, opened or cleared.
 */
export function trimToUnread(feed: Feed, accountId: string, before: number | 'dot', now: number | 'dot'): Feed {
  const b = asNumber(before);
  const n = asNumber(now);
  if (n >= b) return feed;
  const mine = feed.filter((m) => m.accountId === accountId);
  if (mine.length <= n) return feed;
  const keep = new Set(mine.slice(0, n).map((m) => m.key));
  return feed.filter((m) => m.accountId !== accountId || keep.has(m.key));
}

export function removeMessage(feed: Feed, key: string): Feed {
  return feed.filter((m) => m.key !== key);
}

export function messageViews(feed: Feed, previews: boolean): MessageView[] {
  return feed.map((m) => ({ key: m.key, accountId: m.accountId, title: m.title, body: previews ? m.body : '', at: m.at, count: m.count }));
}

/** How long ago, on a line: "now", "5 min", "2 h", the weekday, then the date. */
export function ago(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return t('home.ago.now');
  if (min < 60) return t('home.ago.minutes', { count: min });
  if (min < 24 * 60) return t('home.ago.hours', { count: Math.floor(min / 60) });
  const fmt = min < 6 * 24 * 60 ? { weekday: 'short' as const } : { day: 'numeric' as const, month: 'short' as const };
  return new Intl.DateTimeFormat(intlLocale(), fmt).format(at);
}
