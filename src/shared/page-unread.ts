/// <reference lib="dom" />
// Read-only unread counts from pages that don't put them in the title: Outlook, Teams,
// Telegram and LinkedIn.
// Pure functions of a DOM root, so they can be tested on fixture HTML.
import { OUTLOOK_HOSTS, TEAMS_HOSTS } from './ms-hosts';

const INBOX_NAMES = ['inbox', 'caixa de entrada', 'bandeja de entrada', 'boîte de réception', 'posteingang', 'posta in arrivo', 'postvak in'];
const UNREAD_WORDS = /(\d[\d.,\s]*)\s*(?:unread|não lid|nao lid|sin leer|no leído|non lu|ungelesen|non lett|ongelezen)/i;

function toNumber(s: string | null | undefined): number | null {
  const digits = (s ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function isInbox(el: Element): boolean {
  const labels = [el.getAttribute('title'), el.getAttribute('aria-label'), el.querySelector('[title]')?.getAttribute('title')];
  return labels.some((l) => {
    const v = (l ?? '').trim().toLowerCase();
    // "Inbox", or Outlook's label "Inbox, 3 unread" / "Inbox 3 unread" — never "Inbox Zero".
    return INBOX_NAMES.some((n) => v === n || v.startsWith(`${n},`) || new RegExp(`^${n}\\s+\\d`).test(v));
  });
}

/** The Outlook Inbox's unread count; null while the folder list isn't there. */
export function outlookInboxUnread(root: ParentNode): number | null {
  const inbox = [...root.querySelectorAll('[role="treeitem"]')].find(isInbox);
  if (!inbox) return null;
  const sr = inbox.querySelector('.screenReaderOnly');
  const before = toNumber(sr?.previousElementSibling?.textContent);
  if (before !== null) return before;
  const m = UNREAD_WORDS.exec(inbox.getAttribute('aria-label') ?? '') ?? UNREAD_WORDS.exec(inbox.textContent ?? '');
  return m ? (toNumber(m[1]) ?? 0) : 0;
}

/**
 * Teams' unread count: the "(N)" title prefix, else the largest badge in the app bar (Activity,
 * Chat…: a chat mention shows in both, so they are not added). Null before the app bar is there.
 */
export function teamsUnread(root: ParentNode, title: string): number | null {
  const prefix = /^\((\d+)\)/.exec(title);
  if (prefix) return Number(prefix[1]);
  const bars = root.querySelectorAll('nav, [role="navigation"]');
  if (!bars.length) return null; // still signing in or loading
  let max = 0;
  for (const bar of bars) for (const b of bar.querySelectorAll('.fui-Badge')) max = Math.max(max, toNumber(b.textContent) ?? 0);
  return max;
}

/** Telegram Web (A or K): the badges of chats that are not muted; null before the chat list is there. */
export function telegramUnread(root: ParentNode, path: string): number | null {
  const k = path.startsWith('/k');
  const badges = root.querySelectorAll(k ? '.rp:not(.is-muted) .dialog-subtitle-badge' : '.chat-list .ListItem .ChatBadge.unread:not(.muted)');
  const list = root.querySelector(k ? '.rp' : '.chat-list');
  if (!list) return null;
  let sum = 0;
  for (const b of badges) sum += toNumber(b.textContent) ?? 0;
  return sum;
}

/** LinkedIn: the Messaging badge in its bar, found by its link (class names change); not notifications. */
export function linkedinUnread(root: ParentNode): number | null {
  const link = root.querySelector('nav a[href*="/messaging/"], header a[href*="/messaging/"]');
  if (!link) return null; // signed out or still loading
  const badge = link.querySelector('[class*="badge"]');
  return toNumber(badge?.textContent) ?? 0;
}

/** Which page may report which view's count: a count never comes from another app's page. */
const SOURCES: Record<string, Record<string, Set<string>>> = {
  microsoft: { main: OUTLOOK_HOSTS, teams: TEAMS_HOSTS },
  telegram: { main: new Set(['web.telegram.org']) },
  linkedin: { main: new Set(['www.linkedin.com']) },
};

export function unreadSourceMatches(service: string, kind: string, url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return SOURCES[service]?.[kind]?.has(host) ?? false;
}

/** The reader for a page, if it is one of those apps. */
export function readerFor(host: string): ((root: ParentNode, title: string, path: string) => number | null) | null {
  if (OUTLOOK_HOSTS.has(host)) return (root) => outlookInboxUnread(root);
  if (TEAMS_HOSTS.has(host)) return (root, title) => teamsUnread(root, title);
  if (host === 'web.telegram.org') return (root, _t, path) => telegramUnread(root, path);
  if (host === 'www.linkedin.com') return (root) => linkedinUnread(root);
  return null;
}
