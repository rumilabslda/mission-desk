/** Above this, a compose link is cut short: the body goes to the clipboard instead. */
export const MAX_COMPOSE_URL = 7500;

/**
 * A "new message" link for the account's mail, filled in. The mail app keeps it as a draft;
 * nothing is sent. A body too long for a link is left out (the caller copies it to the clipboard).
 */
export function composeUrl(service: 'google' | 'microsoft', d: { to: string[]; subject: string; body: string }): { url: string; bodyInClipboard: boolean } {
  const e = encodeURIComponent;
  const base =
    service === 'google'
      ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${e(d.to.join(','))}&su=${e(d.subject)}`
      : `https://outlook.office.com/mail/deeplink/compose?to=${e(d.to.join(','))}&subject=${e(d.subject)}`;
  const full = `${base}&body=${e(d.body)}`;
  return full.length <= MAX_COMPOSE_URL ? { url: full, bodyInClipboard: false } : { url: base, bodyInClipboard: true };
}
