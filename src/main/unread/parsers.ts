import type { ServiceId, UnreadCount } from '../../shared/types';

const GMAIL_INBOX = /^(?:Inbox|Caixa de entrada)(?: \(([\d.,\s]+)\))? - /;

function toNumber(digits: string): number {
  return Number(digits.replace(/[^\d]/g, ''));
}

function parseGoogle(title: string): UnreadCount | null {
  const m = GMAIL_INBOX.exec(title);
  if (!m) return null; // another label, a search, or still loading
  return m[1] ? toNumber(m[1]) : 0;
}

function parseSlack(title: string): UnreadCount | null {
  if (!title.includes('Slack')) return null;
  const count = /^\((\d+)\)/.exec(title);
  if (count) return Number(count[1]);
  if (/^[*!]\s/.test(title)) return 'dot';
  return 0;
}

function parseWhatsApp(title: string): UnreadCount | null {
  const count = /^\((\d+)\)/.exec(title);
  if (count) return Number(count[1]);
  if (title === 'WhatsApp') return 0;
  return null;
}

/** Outlook and Teams counts come from the page (src/shared/page-unread.ts); a "(N)" title is used when present. */
function parseMicrosoft(title: string): UnreadCount | null {
  const count = /^\((\d+)\)/.exec(title);
  return count ? Number(count[1]) : null;
}

/** Discord: "(N) Discord | …" for mentions and DMs, "• Discord | …" for other unread. */
function parseDiscord(title: string): UnreadCount | null {
  const count = /^\((\d+)\)\s/.exec(title);
  if (count) return Number(count[1]);
  if (/^•\s/.test(title)) return 'dot';
  if (/\bDiscord\b/.test(title)) return 0;
  return null;
}

/**
 * Zoom on the web: a "(N) " title prefix when Team Chat has unread messages, like most web apps.
 * Unknown (null) on other titles, so a page that doesn't say keeps the last count.
 */
function parseZoom(title: string): UnreadCount | null {
  if (/^\(\d+\+\)\s/.test(title)) return 'dot';
  const count = /^\((\d{1,3}(?:[.,]\d{3})*)\)\s/.exec(title);
  if (count) return toNumber(count[1]);
  return /\bZoom\b/.test(title) ? 0 : null;
}

const INBOX = /^(?:inbox|caixa de entrada|entrada|bandeja de entrada|boîte de réception|posteingang|posta in arrivo|postvak in)(?:\s*\((\d[\d.,]*)\))?$/i;

/**
 * Proton Mail, iCloud Mail, Fastmail: the Inbox's unread count from the title, which names the
 * open folder ("(3) Inbox | ann@proton.me | Proton Mail", "[3] Inbox | Fastmail", "Inbox (3) – …").
 * Another folder or a message says nothing about the Inbox: unknown (null), the last count stays.
 */
function parseMailInbox(title: string): UnreadCount | null {
  const prefix = /^[([](\d[\d.,]*)(\+)?[)\]]\s*/.exec(title);
  const rest = prefix ? title.slice(prefix[0].length) : title;
  for (const part of rest.split(/\s+[|–—·-]\s+/)) {
    const inbox = INBOX.exec(part.trim());
    if (!inbox) continue;
    if (prefix?.[2]) return 'dot'; // "(99+)"
    const n = prefix?.[1] ?? inbox[1];
    return n ? toNumber(n) : 0;
  }
  return null;
}

/** Notion: a "(N) " title prefix for unread Inbox notifications; page names otherwise. */
function parseNotion(title: string): UnreadCount | null {
  if (/^\(\d+\+\)\s/.test(title)) return 'dot';
  const count = /^\((\d{1,3}(?:[.,]\d{3})*)\)\s/.exec(title);
  if (count) return toNumber(count[1]);
  return title.trim() && !/^(?:Loading|Notion)\b/i.test(title) ? 0 : null;
}

/** Any website: a "(N) " title prefix, the common convention; otherwise nothing. */
function parseCustom(title: string): UnreadCount | null {
  if (/^\(\d+\+\)\s/.test(title)) return 'dot'; // "(99+) …"
  const count = /^\((\d{1,3}(?:[.,]\d{3})*)\)\s/.exec(title);
  return count ? toNumber(count[1]) : 0;
}

/** Page title → unread count. `null` means unknown: keep the last value. */
export function parseUnread(service: ServiceId, title: string): UnreadCount | null {
  switch (service) {
    case 'google':
      return parseGoogle(title);
    case 'slack':
      return parseSlack(title);
    case 'whatsapp':
      return parseWhatsApp(title);
    case 'microsoft':
      return parseMicrosoft(title);
    case 'discord':
      return parseDiscord(title);
    case 'zoom':
      return parseZoom(title);
    case 'proton':
    case 'icloud':
    case 'fastmail':
      return parseMailInbox(title);
    case 'notion':
      return parseNotion(title);
    case 'custom':
      return parseCustom(title);
    case 'telegram':
    case 'linkedin':
      return null; // read from the page (src/shared/page-unread.ts)
  }
}
