// @vitest-environment happy-dom
import { customHomeHosts, cleanSiteUrl, learnSite } from '../src/shared/custom-site';
import { isHomeHost } from '../src/main/accounts/services';
import { parseNewAccount } from '../src/main/ipc-validation';
import { parseUnread } from '../src/main/unread/parsers';
import { linkedinUnread, telegramUnread, unreadSourceMatches } from '../src/shared/page-unread';
import { chainStep, routeLink, routeRedirect, signInFor } from '../src/main/links/router';
import { isPermissionAllowed } from '../src/main/views/permissions';
import { hasTab, hasTabs, mainIsMail } from '../src/shared/tabs';
import { resolveOpenUrl } from '../src/main/claude/open-url';
import { isNotionSamlHandoff, routePopup } from '../src/main/links/router';
import { userAgentFor } from '../src/main/views/user-agent';
import { SERVICES } from '../src/main/accounts/services';
import { iconCandidates } from '../src/main/avatars/sources';
import { ssoGroups } from '../src/shared/sso';
import { formatNotification } from '../src/main/notifications/format';
import type { Account } from '../src/shared/types';

const page = (html: string): ParentNode => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};

describe('custom app (any website)', () => {
  test('the site address: https only (http just for this Mac), no passwords in it, tidied', () => {
    expect(cleanSiteUrl('https://app.example.com/home')).toBe('https://app.example.com/home');
    expect(cleanSiteUrl('  app.example.com ')).toBe('https://app.example.com/'); // no scheme typed
    expect(cleanSiteUrl('http://localhost:3000')).toBe('http://localhost:3000/');
    for (const bad of ['http://example.com', 'https://user:pass@example.com', 'javascript:alert(1)', 'file:///etc/passwd', '', 'https://', 'x'.repeat(3000), 42])
      expect(cleanSiteUrl(bad)).toBeNull();
  });

  test('its pages are the site and its subdomains (registrable domain), never a whole shared host', () => {
    expect(customHomeHosts('https://app.example.com/x')).toEqual(['example.com', '.example.com']);
    expect(customHomeHosts('https://www.example.co.uk/')).toEqual(['example.co.uk', '.example.co.uk']);
    expect(customHomeHosts('https://acme.atlassian.net/jira')).toEqual(['acme.atlassian.net', '.acme.atlassian.net']);
    expect(customHomeHosts('https://acme.sharepoint.com/')).toEqual(['acme.sharepoint.com', '.acme.sharepoint.com']);
    expect(customHomeHosts('http://localhost:3000/')).toEqual(['localhost']);
    // shared hosts: the customer's own subdomain, longest suffix first
    expect(customHomeHosts('https://acme.my.salesforce.com/')).toEqual(['acme.my.salesforce.com', '.acme.my.salesforce.com']);
    expect(customHomeHosts('https://acme.lightning.force.com/')).toEqual(['acme.lightning.force.com', '.acme.lightning.force.com']);
    expect(customHomeHosts('https://acme.my.site.com/')).toEqual(['acme.my.site.com', '.acme.my.site.com']);
    expect(customHomeHosts('https://acme.okta.com/')).toEqual(['acme.okta.com', '.acme.okta.com']);
    expect(customHomeHosts('https://acme.us.auth0.com/')).toEqual(['acme.us.auth0.com', '.acme.us.auth0.com']);
    expect(customHomeHosts('https://acme.service-now.com/')).toEqual(['acme.service-now.com', '.acme.service-now.com']);
    expect(customHomeHosts('https://foo.github.io/')).toEqual(['foo.github.io', '.foo.github.io']);
    expect(customHomeHosts('https://bucket.s3.amazonaws.com/')).toEqual(['bucket.s3.amazonaws.com', '.bucket.s3.amazonaws.com']);
    expect(customHomeHosts('https://acme.ne.jp/')).toEqual(['acme.ne.jp', '.acme.ne.jp']);
    // an IP address is only itself; a trailing dot is ignored
    expect(customHomeHosts('https://192.168.1.10/')).toEqual(['192.168.1.10']);
    expect(customHomeHosts('https://acme.com./')).toEqual(['acme.com', '.acme.com']);
    const home = customHomeHosts('https://acme.atlassian.net/');
    expect(isHomeHost('custom', 'acme.atlassian.net', home)).toBe(true);
    expect(isHomeHost('custom', 'evil.atlassian.net', home)).toBe(false);
    expect(isHomeHost('custom', 'example.com', [])).toBe(false);
  });

  test("the site's own move on first load is learned (notion.so → notion.com); a sign-in elsewhere never is", () => {
    // Only on the very first load (siteMoves not set yet); the answer is then final ([] = nothing moved).
    expect(learnSite('https://notion.so/', undefined, 'https://www.notion.com/login')).toEqual(['https://www.notion.com/']);
    expect(learnSite('https://notion.so/', undefined, 'https://www.notion.so/x')).toEqual([]); // same site
    expect(learnSite('https://notion.so/', [], 'https://www.notion.com/x')).toBeNull(); // already decided
    expect(learnSite('https://acme.atlassian.net/', undefined, 'https://acme.okta.com/sso')).toEqual([]); // another brand
    expect(learnSite('https://app.example.com/', undefined, 'https://accounts.google.com/signin')).toEqual([]);
    expect(learnSite('https://foo.github.io/', undefined, 'https://foo.herokuapp.com/')).toEqual([]); // shared hosts: anyone's
    expect(learnSite('https://notion.so/', undefined, 'data:text/html,offline')).toBeNull(); // not loaded yet: decide later
    expect(customHomeHosts('https://notion.so/', ['https://www.notion.com/'])).toEqual(['notion.so', '.notion.so', 'notion.com', '.notion.com']);
  });

  test('a new custom app needs a valid address; other services ignore it', () => {
    expect(parseNewAccount({ service: 'custom', name: 'Notion', color: '#111111', url: 'notion.so' })).toEqual({
      service: 'custom', name: 'Notion', color: '#111111', url: 'https://notion.so/',
    });
    expect(parseNewAccount({ service: 'custom', name: 'X', color: '#111111' })).toBeNull();
    expect(parseNewAccount({ service: 'custom', name: 'X', color: '#111111', url: 'http://example.com' })).toBeNull();
    expect(parseNewAccount({ service: 'telegram', name: 'Telegram', color: '#111111', url: 'https://evil.example' })).toEqual({
      service: 'telegram', name: 'Telegram', color: '#111111',
    });
  });

  test('links: its own pages stay (new windows become tabs), "Sign in with Google" is a popup, the rest goes to the browser', () => {
    const homeHosts = customHomeHosts('https://www.notion.so/');
    const r = (url: string, disposition: 'navigate' | 'new-window', currentUrl?: string) =>
      routeLink({ service: 'custom', url, disposition, homeHosts, ...(currentUrl ? { currentUrl } : {}) });
    expect(r('https://www.notion.so/page-1', 'navigate')).toEqual({ kind: 'stay' });
    expect(r('https://www.notion.so/page-2', 'new-window')).toEqual({ kind: 'extra-tab', url: 'https://www.notion.so/page-2' });
    const google = 'https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=storagerelay%3A%2F%2Fhttps%2Fwww.notion.so%3Fid%3Dauth1';
    expect(r(google, 'new-window')).toEqual({ kind: 'auth-popup' }); // Google's popup sign-in (storagerelay)
    expect(r('https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=https%3A%2F%2Fevil.example', 'new-window')).toEqual({ kind: 'external', url: 'https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=https%3A%2F%2Fevil.example' });
    expect(r('https://example.com/', 'new-window')).toEqual({ kind: 'external', url: 'https://example.com/' });
    expect(r('https://example.com/', 'navigate', 'https://www.notion.so/')).toEqual({ kind: 'external', url: 'https://example.com/' });
    expect(signInFor('custom', 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fwww.notion.so%2Fcb', homeHosts)).toBe(true);
  });

  test('its tab strip has Home and the pages it opens', () => {
    expect(hasTabs('custom')).toBe(true);
    expect(hasTab('custom', 'main')).toBe(true);
    expect(hasTab('custom', 'calendar')).toBe(false);
    expect(hasTab('microsoft', 'teams')).toBe(true);
    expect(hasTab('google', 'teams')).toBe(false);
  });

  test("its icon is the one the site itself declares (never asked from Google: private hosts stay private)", () => {
    expect(iconCandidates({ service: 'custom', siteUrl: 'https://app.example.com/x', faviconUrl: 'https://app.example.com/favicon.png' })).toEqual([
      'https://app.example.com/favicon.png',
    ]);
    expect(iconCandidates({ service: 'custom', siteUrl: 'https://app.example.com/x' })).toEqual([]);
    expect(iconCandidates({ service: 'custom', siteUrl: 'https://app.example.com/', faviconUrl: 'http://app.example.com/f.ico' })).toEqual([]);
  });

  test('no camera or microphone for any website (only the known call apps)', () => {
    expect(isPermissionAllowed('media', 'https://app.example.com/')).toBe(false);
  });

  test("in a space it does not get the space's Google sign-in (any website would see the work account)", () => {
    expect(ssoGroups([{ id: 'g', service: 'google', spaceId: 'S' }, { id: 'c', service: 'custom', spaceId: 'S' }], [{ id: 'S', name: 'S' }])).toEqual([]);
  });

  test('its notifications are titled with its name only', () => {
    const a = { id: 'c', service: 'custom', name: 'Notion', color: '#000000', muted: false, hibernateWhenIdle: false } as Account;
    expect(formatNotification(a, { title: 'Hi' }).title).toBe('Notion');
  });

  test('unread from a "(N) " title prefix; otherwise nothing', () => {
    expect(parseUnread('custom', '(3) Inbox · Example')).toBe(3);
    expect(parseUnread('custom', 'Example')).toBe(0);
    expect(parseUnread('custom', '(2024) Annual report')).toBe(0);
    expect(parseUnread('custom', '(99+) Inbox')).toBe('dot');
  });
});

describe('Discord', () => {
  test('mentions and DMs from "(N)", other unread from "•"', () => {
    expect(parseUnread('discord', '(4) Discord | #general | Acme')).toBe(4);
    expect(parseUnread('discord', '• Discord | #general | Acme')).toBe('dot');
    expect(parseUnread('discord', 'Discord | Friends')).toBe(0);
    expect(parseUnread('discord', 'Loading…')).toBeNull();
  });

  test('invites and the app stay in the account; voice calls are allowed', () => {
    expect(isHomeHost('discord', 'discord.com')).toBe(true);
    expect(isHomeHost('discord', 'discord.gg')).toBe(true);
    expect(isPermissionAllowed('media', 'https://discord.com/channels/1/2')).toBe(true);
    expect(isPermissionAllowed('media', 'https://ptb.discord.com/channels/1/2')).toBe(true);
  });
});

describe('Telegram', () => {
  test('Web A: unread badges of chats that are not muted', () => {
    const root = page('<div class="chat-list"><div class="ListItem private"><div class="ChatBadge unread">2</div></div><div class="ListItem group"><div class="ChatBadge unread">5</div></div><div class="ListItem group"><div class="ChatBadge unread muted">40</div></div></div>');
    expect(telegramUnread(root, '/a/')).toBe(7);
  });

  test('Web K: dialog badges of chats that are not muted', () => {
    const root = page('<ul><li class="rp"><span class="dialog-subtitle-badge">3</span></li><li class="rp is-muted"><span class="dialog-subtitle-badge">9</span></li></ul>');
    expect(telegramUnread(root, '/k/')).toBe(3);
  });

  test('before the chat list is there the count is unknown; calls are allowed', () => {
    expect(telegramUnread(page('<div>Log in by QR code</div>'), '/a/')).toBeNull();
    expect(isPermissionAllowed('media', 'https://web.telegram.org/a/')).toBe(true);
  });
});

describe('LinkedIn', () => {
  test("the Messaging badge in LinkedIn's bar, found by its link (not notifications), on every page", () => {
    const root = page('<nav><a href="https://www.linkedin.com/messaging/"><span class="notification-badge__count">3</span>Messaging</a><a href="https://www.linkedin.com/notifications/"><span class="notification-badge__count">20</span></a></nav>');
    expect(linkedinUnread(root)).toBe(3);
    expect(linkedinUnread(page('<nav><a href="/messaging/">Messaging</a></nav>'))).toBe(0);
    expect(linkedinUnread(page('<div>Sign in</div>'))).toBeNull();
  });

  test('"Sign in with Google" or Apple is a popup', () => {
    expect(routeLink({ service: 'linkedin', url: 'https://accounts.google.com/o/oauth2/auth', disposition: 'new-window' })).toEqual({ kind: 'auth-popup' });
    expect(routeLink({ service: 'linkedin', url: 'https://appleid.apple.com/auth/authorize', disposition: 'new-window' })).toEqual({ kind: 'auth-popup' });
  });
});

test('a page may only report the count of its own app', () => {
  expect(unreadSourceMatches('telegram', 'main', 'https://web.telegram.org/a/')).toBe(true);
  expect(unreadSourceMatches('linkedin', 'main', 'https://www.linkedin.com/feed/')).toBe(true);
  expect(unreadSourceMatches('linkedin', 'main', 'https://web.telegram.org/a/')).toBe(false);
  expect(unreadSourceMatches('microsoft', 'main', 'https://outlook.office.com/mail/')).toBe(true);
  expect(unreadSourceMatches('microsoft', 'teams', 'https://teams.microsoft.com/v2/')).toBe(true);
  expect(unreadSourceMatches('discord', 'main', 'https://discord.com/app')).toBe(false); // Discord uses its title
  expect(unreadSourceMatches('telegram', 'extra:1', 'https://web.telegram.org/a/')).toBe(false);
});

describe('Zoom', () => {
  test('an account is accepted, and its pages, company addresses and regional hosts are its own', () => {
    expect(parseNewAccount({ service: 'zoom', name: 'Zoom', color: '#111111' })).toEqual({ service: 'zoom', name: 'Zoom', color: '#111111' });
    for (const h of ['zoom.us', 'app.zoom.us', 'acme.zoom.us', 'us02web.zoom.us']) expect(isHomeHost('zoom', h)).toBe(true);
    expect(isHomeHost('zoom', 'zoom.us.evil.example')).toBe(false);
    expect(routeLink({ service: 'zoom', url: 'https://app.zoom.us/wc/team-chat', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'zoom', url: 'https://example.com/', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://example.com/' });
  });

  test('meetings in its web client may use the camera and microphone', () => {
    expect(isPermissionAllowed('media', 'https://app.zoom.us/wc/123/join')).toBe(true);
    expect(isPermissionAllowed('media', 'https://zoom.us.evil.example/')).toBe(false);
  });

  test('"Sign in with Google, Microsoft or Apple" and company SSO stay in the account', () => {
    const google = 'https://accounts.google.com/o/oauth2/auth?client_id=x&redirect_uri=https%3A%2F%2Fzoom.us%2Fgoogle%2Foauth';
    expect(signInFor('zoom', google)).toBe(true);
    expect(signInFor('zoom', 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example')).toBe(false);
    expect(routeLink({ service: 'zoom', url: 'https://appleid.apple.com/auth/authorize', disposition: 'new-window' })).toEqual({ kind: 'auth-popup' });
    expect(routeRedirect({ service: 'zoom', url: google, chain: { signIn: false, trusted: false } })).toBe('allow');
    // Company SSO: Zoom's SAML start, then the company's identity provider.
    const chain = chainStep('zoom', 'https://acme.zoom.us/saml/login?from=signin', { signIn: false, trusted: false });
    expect(chain.signIn).toBe(true);
    expect(routeRedirect({ service: 'zoom', url: 'https://idp.acme.example/sso', chain })).toBe('allow');
    expect(routeRedirect({ service: 'zoom', url: 'https://idp.acme.example/sso', chain: { signIn: false, trusted: false } })).toBe('external');
  });

  test('unread messages from a "(N)" title; other Zoom titles mean none', () => {
    expect(parseUnread('zoom', '(3) Zoom Workplace')).toBe(3);
    expect(parseUnread('zoom', '(99+) Zoom')).toBe('dot');
    expect(parseUnread('zoom', 'Zoom Workplace')).toBe(0);
    expect(parseUnread('zoom', 'Loading…')).toBeNull();
  });
});

describe('mail apps: Proton Mail, iCloud Mail, Fastmail', () => {
  const ELECTRON_UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0 Electron/38.0 Safari/537.36';

  test('accounts are accepted, open on their mail page, and present a plain Chrome', () => {
    for (const service of ['proton', 'icloud', 'fastmail'] as const) {
      expect(parseNewAccount({ service, name: 'Mail', color: '#111111' })).toEqual({ service, name: 'Mail', color: '#111111' });
      expect(isHomeHost(service, new URL(SERVICES[service].startUrl).hostname)).toBe(true);
      expect(userAgentFor(service, ELECTRON_UA)).not.toContain('Electron');
      expect(hasTabs(service)).toBe(false);
    }
    expect(SERVICES.proton.startUrl).toBe('https://mail.proton.me/');
    expect(SERVICES.icloud.startUrl).toBe('https://www.icloud.com/mail/');
    expect(SERVICES.fastmail.startUrl).toBe('https://app.fastmail.com/');
  });

  test('their own pages and sign-in stay; everything else (links in emails) goes to the browser', () => {
    // Proton signs in on account.proton.me, then goes back to mail.proton.me.
    expect(routeLink({ service: 'proton', url: 'https://account.proton.me/mail', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'proton', url: 'https://mail.proton.me/u/0/inbox', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'fastmail', url: 'https://app.fastmail.com/mail/Inbox/', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'icloud', url: 'https://www.icloud.com/mail/', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    for (const service of ['proton', 'icloud', 'fastmail'] as const) {
      expect(routeLink({ service, url: 'https://example.com/newsletter', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://example.com/newsletter' });
      expect(routeLink({ service, url: 'https://example.com/x', disposition: 'navigate' })).toEqual({ kind: 'external', url: 'https://example.com/x' });
    }
    // Look-alike hosts are not theirs.
    for (const [service, host] of [['proton', 'proton.me.evil.example'], ['proton', 'evilproton.me'], ['icloud', 'icloud.com.evil.example'], ['icloud', 'evil.icloud.com.example'], ['fastmail', 'fastmail.com.evil.example']] as const)
      expect(isHomeHost(service, host)).toBe(false);
    // Proton's other apps are Proton's.
    expect(isHomeHost('proton', 'calendar.proton.me')).toBe(true);
  });

  test('no camera or microphone for mail', () => {
    for (const url of ['https://mail.proton.me/', 'https://www.icloud.com/mail/', 'https://app.fastmail.com/']) {
      expect(isPermissionAllowed('media', url)).toBe(false);
      expect(isPermissionAllowed('notifications', url)).toBe(true);
    }
  });

  test('the Inbox unread count from the title; other folders and messages keep the last count', () => {
    // Proton Mail: "(N) Folder | address | Proton Mail".
    expect(parseUnread('proton', '(3) Inbox | ann@proton.me | Proton Mail')).toBe(3);
    expect(parseUnread('proton', '(1.204) Inbox | ann@proton.me | Proton Mail')).toBe(1204);
    expect(parseUnread('proton', 'Inbox | ann@proton.me | Proton Mail')).toBe(0);
    expect(parseUnread('proton', '(2) Caixa de entrada | ann@proton.me | Proton Mail')).toBe(2);
    expect(parseUnread('proton', '(5) Sent | ann@proton.me | Proton Mail')).toBeNull();
    expect(parseUnread('proton', 'Lunch on Friday? | ann@proton.me | Proton Mail')).toBeNull();
    expect(parseUnread('proton', 'Proton Mail: Sign-in')).toBeNull();
    expect(parseUnread('proton', 'Proton Mail')).toBeNull();
    // Fastmail and iCloud Mail: the count in front, in brackets or after the folder.
    expect(parseUnread('fastmail', '[4] Inbox | Fastmail')).toBe(4);
    expect(parseUnread('fastmail', '(4) Inbox – ann@fastmail.com – Fastmail')).toBe(4);
    expect(parseUnread('fastmail', 'Inbox | Fastmail')).toBe(0);
    expect(parseUnread('fastmail', '(99+) Inbox | Fastmail')).toBe('dot');
    expect(parseUnread('fastmail', 'Log in | Fastmail')).toBeNull();
    expect(parseUnread('fastmail', '[2] Archive | Fastmail')).toBeNull();
    expect(parseUnread('icloud', 'Inbox (7) – iCloud Mail')).toBe(7);
    expect(parseUnread('icloud', 'iCloud Mail – Inbox')).toBe(0);
    expect(parseUnread('icloud', 'iCloud Mail - Apple iCloud')).toBeNull();
    // "Inbox Zero" or a subject merely containing the word is not the Inbox.
    expect(parseUnread('proton', 'Inbox Zero tips | ann@proton.me | Proton Mail')).toBeNull();
  });
});

describe('Notion', () => {
  const LOGIN = 'https://app.notion.com/login';
  const SAML = 'https://acme.okta.com/app/notion/exk1/sso/saml?SAMLRequest=abc&RelayState=v1.x&login_hint=ann%40acme.com';

  test('an account is accepted; the app, its old address, Calendar and Mail are its own, published sites are not', () => {
    expect(parseNewAccount({ service: 'notion', name: 'Notion', color: '#111111' })).toEqual({ service: 'notion', name: 'Notion', color: '#111111' });
    expect(SERVICES.notion.startUrl).toBe('https://app.notion.com/');
    for (const h of ['app.notion.com', 'www.notion.so', 'notion.so', 'www.notion.com', 'calendar.notion.so', 'mail.notion.so']) expect(isHomeHost('notion', h)).toBe(true);
    for (const h of ['acme.notion.site', 'file.notion.so', 'notion.so.evil.example', 'evilnotion.so']) expect(isHomeHost('notion', h)).toBe(false);
  });

  test('like any website, the pages it opens become tabs; its Home is not called mail', () => {
    expect(hasTabs('notion')).toBe(true);
    expect(hasTab('notion', 'main')).toBe(true);
    expect(mainIsMail('notion')).toBe(false);
    expect(mainIsMail('google')).toBe(true);
    expect(mainIsMail('custom')).toBe(false);
    expect(routeLink({ service: 'notion', url: 'https://app.notion.com/acme/Roadmap-123', disposition: 'navigate' })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'notion', url: 'https://app.notion.com/acme/Roadmap-123', disposition: 'new-window' })).toEqual({ kind: 'extra-tab', url: 'https://app.notion.com/acme/Roadmap-123' });
    expect(routeLink({ service: 'notion', url: 'https://example.com/doc', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://example.com/doc' });
    expect(routeLink({ service: 'notion', url: 'https://acme.notion.site/Public', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://acme.notion.site/Public' });
    // The assistant opens Notion pages in a tab of their own too.
    expect(resolveOpenUrl('notion', 'https://app.notion.com/acme/Roadmap-123')).toEqual({ kind: 'extra', url: 'https://app.notion.com/acme/Roadmap-123' });
  });

  test('"Sign in with Google, Apple, Microsoft or ChatGPT" runs in a popup that keeps its opener', () => {
    // Notion opens its own page in a sized popup, which then goes to Google.
    const start = 'https://app.notion.com/verifyNoPopupBlockerHtmlAndRedirect?redirectUri=https%3A%2F%2Fapp.notion.com%2Fgooglepopupredirect';
    expect(routeLink({ service: 'notion', url: start, disposition: 'new-window', popup: true })).toEqual({ kind: 'auth-popup' });
    expect(routeLink({ service: 'notion', url: 'about:blank', disposition: 'new-window', popup: true })).toEqual({ kind: 'auth-popup' });
    const google = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&redirect_uri=https%3A%2F%2Fapp.notion.com%2Fgooglepopupredirect';
    expect(routePopup('notion', google, start, false)).toBe('stay');
    expect(signInFor('notion', google)).toBe(true);
    for (const host of ['appleid.apple.com', 'login.microsoftonline.com', 'auth.openai.com'])
      expect(routePopup('notion', `https://${host}/authorize`, start, false)).toBe('stay');
    expect(routePopup('notion', 'https://evil.example/', start, false)).toBe('external');
    // A Google sign-in for some other site never runs in the account.
    expect(signInFor('notion', 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example')).toBe(false);
    expect(routeLink({ service: 'notion', url: 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example', disposition: 'navigate' })).toEqual({
      kind: 'external',
      url: 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example',
    });
  });

  test("company SSO: the sign-in page's SAML request goes to the identity provider, and its pages stay until back", () => {
    expect(routeLink({ service: 'notion', url: SAML, disposition: 'navigate', currentUrl: LOGIN })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'notion', url: SAML, disposition: 'navigate', currentUrl: 'https://www.notion.so/login?redirectURL=x' })).toEqual({ kind: 'stay' });
    // The hand-off the app marked (routeLink let it through from the sign-in page) starts the sign-in:
    // the provider's redirects are followed.
    expect(isNotionSamlHandoff(SAML, LOGIN)).toBe(true);
    const chain = chainStep('notion', SAML, { signIn: false, trusted: false }, [], true);
    expect(chain.signIn).toBe(true);
    // Without that mark, a SAMLRequest starts nothing.
    expect(chainStep('notion', SAML, { signIn: false, trusted: false }).signIn).toBe(false);
    expect(routeRedirect({ service: 'notion', url: 'https://acme.okta.com/signin/verify', chain })).toBe('allow');
    // On the provider (the app then marks the view as signing in), its own steps stay, then back to Notion.
    expect(routeLink({ service: 'notion', url: 'https://acme.okta.com/signin/verify/push', disposition: 'navigate', currentUrl: SAML, signingIn: true })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'notion', url: 'https://app.notion.com/sso/saml/callback', disposition: 'navigate', currentUrl: 'https://acme.okta.com/x', signingIn: true })).toEqual({ kind: 'stay' });
  });

  test('a SAMLRequest on a Notion or sign-in address never turns off redirect checks', () => {
    const fresh = { signIn: false, trusted: false };
    // A planted link to Notion's own pages or a sign-in host with ?SAMLRequest=, then a redirect off-site.
    for (const url of ['https://www.notion.so/x?SAMLRequest=1', 'https://app.notion.com/acme/Page-1?SAMLRequest=1', 'https://login.microsoftonline.com/t/saml2?SAMLRequest=1', 'https://accounts.google.com/x?SAMLRequest=1']) {
      expect(isNotionSamlHandoff(url, LOGIN)).toBe(false);
      for (const flagged of [false, true]) {
        const chain = chainStep('notion', url, fresh, [], flagged);
        expect(chain.signIn).toBe(false);
        expect(routeRedirect({ service: 'notion', url: 'https://evil.example/phish', chain })).toBe('external');
      }
    }
    // A later hop never counts as the hand-off (the app marks only the first URL).
    expect(isNotionSamlHandoff(SAML, 'https://app.notion.com/acme/Page-1')).toBe(false);
  });

  test('a SAML-looking link anywhere but the sign-in page goes to the browser', () => {
    const lure = 'https://evil.example/login?SAMLRequest=x';
    expect(routeLink({ service: 'notion', url: lure, disposition: 'navigate', currentUrl: 'https://app.notion.com/acme/Shared-page-1' })).toEqual({ kind: 'external', url: lure });
    expect(routeLink({ service: 'notion', url: lure, disposition: 'navigate', currentUrl: 'https://evil.example/login' })).toEqual({ kind: 'external', url: lure });
    expect(routeLink({ service: 'notion', url: lure, disposition: 'navigate' })).toEqual({ kind: 'external', url: lure });
    expect(routeLink({ service: 'notion', url: lure, disposition: 'new-window', currentUrl: LOGIN })).toEqual({ kind: 'external', url: lure });
    expect(routeLink({ service: 'notion', url: 'http://acme.okta.com/sso?SAMLRequest=x', disposition: 'navigate', currentUrl: LOGIN })).toEqual({ kind: 'external', url: 'http://acme.okta.com/sso?SAMLRequest=x' });
    // A login page on a look-alike host doesn't count.
    expect(routeLink({ service: 'notion', url: SAML, disposition: 'navigate', currentUrl: 'https://acme.notion.site/login' })).toEqual({ kind: 'external', url: SAML });
    // A server redirect to it, without a sign-in, is not followed.
    expect(routeRedirect({ service: 'notion', url: lure, chain: { signIn: false, trusted: false } })).toBe('external');
    // Other services never treat a SAML request this way.
    expect(chainStep('zoom', SAML, { signIn: false, trusted: false }).signIn).toBe(false);
    expect(routeLink({ service: 'slack', url: SAML, disposition: 'navigate', currentUrl: 'https://app.slack.com/login' })).toEqual({ kind: 'external', url: SAML });
  });

  test('the microphone for AI Meeting Notes; unread Inbox notifications from a "(N)" title', () => {
    expect(isPermissionAllowed('media', 'https://app.notion.com/acme/Meeting-1')).toBe(true);
    expect(isPermissionAllowed('media', 'https://acme.notion.site/')).toBe(false);
    expect(parseUnread('notion', '(2) Roadmap')).toBe(2);
    expect(parseUnread('notion', '(99+) Roadmap')).toBe('dot');
    expect(parseUnread('notion', 'Roadmap')).toBe(0);
    expect(parseUnread('notion', 'Notion - Log in')).toBeNull();
    expect(parseUnread('notion', 'Loading…')).toBeNull();
    expect(parseUnread('notion', '')).toBeNull();
  });
});
