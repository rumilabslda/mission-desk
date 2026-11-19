// @vitest-environment happy-dom
import { customHomeHosts, cleanSiteUrl, learnSite } from '../src/shared/custom-site';
import { isHomeHost } from '../src/main/accounts/services';
import { parseNewAccount } from '../src/main/ipc-validation';
import { parseUnread } from '../src/main/unread/parsers';
import { linkedinUnread, telegramUnread, unreadSourceMatches } from '../src/shared/page-unread';
import { routeLink, signInFor } from '../src/main/links/router';
import { isPermissionAllowed } from '../src/main/views/permissions';
import { hasTab, hasTabs } from '../src/shared/tabs';
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
