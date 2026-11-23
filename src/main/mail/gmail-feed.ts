import { clean, type Feed, MAX_BODY, MAX_PER_ACCOUNT, MAX_TITLE, type Message } from '../../shared/messages';
import type { UnreadCount } from '../../shared/types';

/**
 * Gmail's Atom feed of unread Inbox mail, read with the account's own cookies (as the Gmail page
 * would). Undocumented but long-lived; if Google drops it, Home falls back to notifications.
 */
export const GMAIL_FEED_URL = 'https://mail.google.com/mail/u/0/feed/atom';
/** Only the Primary tab (for an inbox with tabs, where Gmail's count is Primary's). */
export const GMAIL_PRIMARY_FEED_URL = `${GMAIL_FEED_URL}/%5Esq_ig_i_personal`;

export interface MailEntry {
  /** Gmail's hex message id (opens the conversation). */
  id: string;
  from: string;
  email: string;
  subject: string;
  summary: string;
  at: number;
}

const HEX_ID = /^[0-9a-f]{1,24}$/i;

// One pass, so "&amp;lt;" becomes "&lt;" and not "<".
const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k[0] === '#') {
      const code = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[k] ?? '';
  });

const tag = (xml: string, name: string): string => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1].trim()) : '';
};

/** The unread emails, newest first; null when the text isn't the feed (a sign-in page, an error). */
export function parseGmailFeed(xml: string): MailEntry[] | null {
  if (!/<feed[\s>]/.test(xml) || !/purl\.org\/atom/.test(xml)) return null;
  const out: MailEntry[] = [];
  for (const [, body] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const href = decode(/<link[^>]*\bhref="([^"]*)"/.exec(body)?.[1] ?? '');
    let id = '';
    try {
      id = new URL(href).searchParams.get('message_id') ?? '';
    } catch {
      // no link: skipped below
    }
    if (!HEX_ID.test(id)) continue;
    const author = /<author>([\s\S]*?)<\/author>/.exec(body)?.[1] ?? '';
    const email = tag(author, 'email');
    const at = Date.parse(tag(body, 'issued') || tag(body, 'modified'));
    out.push({
      id,
      from: tag(author, 'name') || email,
      email,
      subject: tag(body, 'title'),
      summary: tag(body, 'summary'),
      at: Number.isFinite(at) ? at : 0,
    });
  }
  return out.sort((a, b) => b.at - a.at);
}

export const mailKey = (accountId: string, id: string): string => `${accountId}\u0000m:${id}`;

/** Home's lines for one account's unread mail: no more than Gmail counts as unread, minus dismissed ones. */
export function mailLines(accountId: string, entries: MailEntry[], unread: UnreadCount, dismissed: ReadonlySet<string>): Message[] {
  const cap = Math.min(MAX_PER_ACCOUNT, typeof unread === 'number' ? unread : MAX_PER_ACCOUNT);
  return entries
    .slice(0, cap)
    .map((e): Message => {
      const subject = clean(e.subject, MAX_TITLE);
      const summary = clean(e.summary, MAX_BODY);
      return {
        key: mailKey(accountId, e.id),
        accountId,
        kind: 'main',
        sender: 0,
        id: 0,
        tag: '',
        title: clean(e.from, MAX_TITLE),
        body: clean(subject && summary ? `${subject} — ${summary}` : subject || summary, MAX_BODY),
        at: e.at,
        count: 1,
        mailId: e.id,
      };
    })
    .filter((m) => !dismissed.has(m.key));
}

/**
 * Notifications and unread mail in one list, newest first. A notification Gmail sent for an email
 * that is also in the feed (same sender, its text starts with the subject) is listed once.
 */
export function mergeMail(notes: Feed, mail: Message[]): Feed {
  const same = (n: Message): boolean => mail.some((m) => m.accountId === n.accountId && m.kind === n.kind && m.title === n.title && startsWithSubject(n, m));
  return [...mail, ...notes.filter((n) => !same(n))].sort((a, b) => b.at - a.at);
}

// The mail line's body is "subject — text" (a subject with a dash of its own still matches by its start).
function startsWithSubject(note: Message, mail: Message): boolean {
  const subject = mail.body.split(' — ')[0];
  return !!subject && note.body.startsWith(subject);
}

/** What makes the Gmail page show that conversation (null for anything but a hex id). */
export function gmailOpenCode(id: string): string | null {
  return HEX_ID.test(id) ? `location.hash = '#all/${id}'` : null;
}
