import type { ServiceId, ViewKind } from '../../shared/types';
import { isHomeHost } from '../accounts/services';
import { microsoftSubApp } from '../links/router';
import { OUTLOOK_HOSTS } from '../../shared/ms-hosts';
import { subAppToKind } from '../../shared/types';

const REFUSED = { error: "Only pages of this account's service can be opened." };
const GOOGLE_KINDS: Record<string, ViewKind> = {
  'mail.google.com': 'main',
  'calendar.google.com': 'calendar',
  'drive.google.com': 'drive',
  'meet.google.com': 'meet',
};
/** Account security, admin, data export, payments and scripts: never opened by Claude. */
const BLOCKED_HOSTS = new Set([
  'accounts.google.com', 'accounts.youtube.com', 'myaccount.google.com', 'admin.google.com',
  'takeout.google.com', 'script.google.com', 'pay.google.com', 'payments.google.com', 'passwords.google.com',
  'login.microsoftonline.com', 'login.live.com', 'login.microsoft.com', 'account.live.com', 'mysignins.microsoft.com',
]);
/** OAuth / SSO / admin paths on any allowed host (e.g. installing a Slack app). */
const BLOCKED_PATHS = /^\/(oauth|openid|sso|admin|apps\/manage)(\/|$)|oauth/i;
/** Outlook settings (forwarding, rules, connected accounts) and sign-out. */
const BLOCKED_MICROSOFT_PATHS = /^\/(mail|calendar)\/(\d+\/)?options(\/|$)|^\/owa\/logoff\.owa/i;

/** Where Claude's open_url lands inside an account, or why it is refused. */
export function resolveOpenUrl(service: ServiceId, url: string, homeHosts: string[] = []): { kind: ViewKind | 'extra'; url: string } | { error: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return REFUSED;
  }
  if (u.protocol !== 'https:' || BLOCKED_HOSTS.has(u.hostname) || !isHomeHost(service, u.hostname, homeHosts)) return REFUSED;
  if (BLOCKED_PATHS.test(u.pathname) || /oauth/i.test(u.search)) return REFUSED;
  if (service === 'microsoft') {
    if (BLOCKED_MICROSOFT_PATHS.test(u.pathname)) return REFUSED;
    const sub = microsoftSubApp(u);
    if (sub) return { kind: subAppToKind(sub), url };
    return { kind: OUTLOOK_HOSTS.has(u.hostname) ? 'main' : 'extra', url };
  }
  if (service === 'custom' || service === 'notion') return { kind: 'extra', url }; // its own tab: Home stays as it is
  if (service !== 'google') return { kind: 'main', url };
  return { kind: GOOGLE_KINDS[u.hostname] ?? 'extra', url };
}
