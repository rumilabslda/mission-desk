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
    case 'custom':
      return parseCustom(title);
    case 'telegram':
    case 'linkedin':
      return null; // read from the page (src/shared/page-unread.ts)
  }
}
