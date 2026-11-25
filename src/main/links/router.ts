import { OUTLOOK_HOSTS, TEAMS_HOSTS } from '../../shared/ms-hosts';
import type { ServiceId, SubApp } from '../../shared/types';
import { isHomeHost } from '../accounts/services';

export type LinkDecision =
  | { kind: 'stay' }
  | { kind: 'subapp'; subApp: SubApp; url: string } // a tab of a tabbed account (Google, Microsoft 365)
  | { kind: 'extra-tab'; url: string }
  | { kind: 'auth-popup' }
  | { kind: 'external'; url: string };

export interface LinkInput {
  service: ServiceId;
  url: string;
  disposition: 'navigate' | 'new-window';
  /** The URL the view is on now. Off the service, an SSO sign-in is in progress. */
  currentUrl?: string;
  /**
   * This account is signing in (it reached its sign-in page with a return address on the service).
   * Only then may the sign-in page hand over to a company identity provider in the view.
   */
  signingIn?: boolean;
  /** A custom app's own hosts (customHomeHosts). */
  homeHosts?: string[];
  /** A new window opened as a popup (with a size), not a plain new tab. */
  popup?: boolean;
  /** Tabs that must not be replaced right now (e.g. Meet or Teams during a call). */
  busySubApps?: SubApp[];
  /** "Open links inside Mission Desk": a link to another site opens as a tab beside the app. */
  inApp?: boolean;
  /** The user Cmd-clicked (Ctrl-clicked) the link: it goes to the browser. */
  toBrowser?: boolean;
  /** The view is a link tab (an extra tab): moving around the site it shows stays in it. */
  browsing?: boolean;
}

function hostOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
}

// Gmail itself is not here: a Gmail popup (attachment, print) opens as an
// extra tab so it never replaces the inbox.
const GOOGLE_SUBAPP_HOSTS: Record<string, SubApp> = {
  'calendar.google.com': 'calendar',
  'drive.google.com': 'drive',
  'meet.google.com': 'meet',
};

/** Gmail wraps outgoing links as https://www.google.com/url?q=<target>. */
function unwrapGoogleRedirect(url: URL): URL {
  if (url.hostname === 'www.google.com' && url.pathname === '/url') {
    const target = url.searchParams.get('q') ?? url.searchParams.get('url');
    if (target) {
      try {
        return new URL(target);
      } catch {
        // not a URL: keep the original
      }
    }
  }
  return url;
}

/** Each service's own sign-in hosts (they may hand over to a company's identity provider). */
const AUTH_HOSTS: Partial<Record<ServiceId, Set<string>>> = {
  google: new Set(['accounts.google.com']),
  microsoft: new Set(['login.microsoftonline.com', 'login.live.com', 'login.microsoft.com']),
  slack: new Set(['accounts.google.com']), // "Sign in with Google"
  linkedin: new Set(['accounts.google.com', 'appleid.apple.com']),
  zoom: new Set(['accounts.google.com', 'appleid.apple.com', 'login.microsoftonline.com', 'login.live.com']), // "Sign in with…"
  notion: new Set(['accounts.google.com', 'appleid.apple.com', 'login.microsoftonline.com', 'login.live.com', 'auth.openai.com']), // …and "with ChatGPT"
  // Any website: "Sign in with Google / Microsoft / Apple".
  custom: new Set(['accounts.google.com', 'login.microsoftonline.com', 'login.live.com', 'appleid.apple.com']),
};
const isAuthHost = (service: ServiceId, host: string): boolean => AUTH_HOSTS[service]?.has(host) ?? false;

/** Where sign-in pages say to go back to once signed in. */
const RETURN_PARAMS = ['redirect_uri', 'continue', 'return_to', 'returnTo', 'next', 'callbackUrl', 'callback_url', 'redirectUrl', 'redirect_url', 'returnUrl', 'RelayState', 'redirect'];

/** A page of the service itself (a custom app's pages must be https, except on this Mac). */
function isSitePage(service: ServiceId, url: URL, homeHosts: string[]): boolean {
  if (!isHomeHost(service, url.hostname, homeHosts)) return false;
  if (service !== 'custom') return true;
  return url.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

/**
 * For a sign-in page: true when it signs in to this account (its return address is one of the
 * service's pages), false when it returns elsewhere (access for another app), null when it
 * doesn't say (a later step of the same sign-in) or isn't a sign-in page. A custom app's sign-in
 * may be on any domain (auth.example.com), so for it every page with a return address counts.
 */
export function signInFor(service: ServiceId, raw: string, homeHosts: string[] = []): boolean | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (service !== 'custom' && !isAuthHost(service, url.hostname)) return null;
  const params = service === 'custom' ? RETURN_PARAMS : ['redirect_uri', 'continue'];
  const back = params.map((p) => url.searchParams.get(p)).find((v) => v);
  if (!back) return null;
  let target: URL;
  try {
    // Google's popup sign-in returns to "storagerelay://https/<site>?id=…".
    target = new URL(back.replace(/^storagerelay:\/\/(https?)\//, '$1://'));
  } catch {
    return false;
  }
  return isSitePage(service, target, homeHosts) && !isAuthHost(service, target.hostname);
}

/** A sign-in started on the service's own SSO pages (Slack's SAML/OpenID start, Zoom's SSO). */
function isOwnSsoUrl(service: ServiceId, url: URL): boolean {
  if (service === 'zoom') {
    const zoom = url.hostname === 'zoom.us' || url.hostname.endsWith('.zoom.us');
    return zoom && (url.pathname.startsWith('/saml') || url.pathname.startsWith('/web/sso'));
  }
  if (service !== 'slack') return false;
  const slack = url.hostname === 'slack.com' || url.hostname.endsWith('.slack.com');
  return slack && (url.pathname.startsWith('/sso') || url.pathname.startsWith('/openid'));
}

/** Notion's sign-in page (app.notion.com/login, or its older address on notion.so). */
function isNotionLogin(raw: string | undefined): boolean {
  try {
    const url = new URL(raw ?? '');
    return url.protocol === 'https:' && isHomeHost('notion', url.hostname) && /^\/(login|signup)(\/|$)/.test(url.pathname);
  } catch {
    return false;
  }
}

/** A SAML sign-in request to a company's identity provider (Notion sends it from its sign-in page). */
function isSamlRequest(url: URL): boolean {
  return url.protocol === 'https:' && url.searchParams.has('SAMLRequest');
}

/**
 * Notion's company SSO hand-off: from Notion's own sign-in page to a SAML request on the company's
 * identity provider (never a Notion or sign-in host, which can't be the identity provider).
 */
export function isNotionSamlHandoff(raw: string, currentUrl: string | undefined): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return isSamlRequest(url) && !isHomeHost('notion', url.hostname) && !isAuthHost('notion', url.hostname) && isNotionLogin(currentUrl);
}

/** A navigation and its server redirects: whether it signs in to this account, or is the app's own load. */
export interface RedirectChain {
  /** It passed a sign-in page of this account (so its identity provider's hops are expected). */
  signIn: boolean;
  /** Mission Desk itself started it (an account's first load): its redirects are the service's own. */
  trusted: boolean;
}

/** The chain after one more hop. */
/**
 * `samlHandoff`: this navigation is the one routeLink let through as Notion's SSO hand-off (the app
 * marks it in will-navigate). Only that starts a sign-in; a SAMLRequest anywhere else does nothing.
 */
export function chainStep(service: ServiceId, raw: string, chain: RedirectChain, homeHosts: string[] = [], samlHandoff = false): RedirectChain {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return chain;
  }
  const saml = service === 'notion' && samlHandoff && isSamlRequest(url) && !isHomeHost('notion', url.hostname) && !isAuthHost('notion', url.hostname);
  const signIn = chain.signIn || signInFor(service, raw, homeHosts) === true || isOwnSsoUrl(service, url) || saml;
  return { signIn, trusted: chain.trusted };
}

/**
 * A server redirect (the page doesn't see it, so links rules alone can't catch it): to the
 * service or its own sign-in, it is followed; elsewhere only during this account's sign-in or
 * the app's own load; otherwise it goes to the browser (an open redirect, an OAuth error page).
 */
export function routeRedirect({ service, url: raw, chain, homeHosts = [], browsing = false }: { service: ServiceId; url: string; chain: RedirectChain; homeHosts?: string[]; browsing?: boolean }): 'allow' | 'external' {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'external';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'external';
  if (browsing) return 'allow'; // a link tab follows short links and the like, as a browser would
  if (isSitePage(service, url, homeHosts) || isAuthHost(service, url.hostname)) return 'allow';
  if (service === 'custom' && isHomeHost('custom', url.hostname, homeHosts)) return 'external'; // http: a downgrade
  if (signInFor(service, raw, homeHosts) === true) return 'allow'; // a sign-in that returns to the service
  return chain.signIn || chain.trusted ? 'allow' : 'external';
}


/** The Microsoft 365 tab a link belongs in; mail itself is not here (a pop-out never replaces the inbox). */
export function microsoftSubApp(url: URL): SubApp | null {
  if (TEAMS_HOSTS.has(url.hostname)) return 'teams';
  if (OUTLOOK_HOSTS.has(url.hostname) && /^\/calendar(\/|$)/.test(url.pathname)) return 'calendar';
  return null;
}

function isAuthUrl(service: ServiceId, url: URL): boolean {
  return isAuthHost(service, url.hostname) || isOwnSsoUrl(service, url);
}

/**
 * A navigation inside a sign-in popup: the service's own pages and sign-in stay; while this
 * account is signing in, so do its company identity provider's pages; everything else goes out.
 */
export function routePopup(service: ServiceId, url: string, currentUrl: string, signingIn: boolean, homeHosts: string[] = []): 'stay' | 'external' {
  const host = hostOf(url);
  if (host === null) return 'external';
  if (isHomeHost(service, host, homeHosts) || isAuthHost(service, host)) return 'stay';
  if (service === 'custom' && signInFor(service, url, homeHosts) === true) return 'stay';
  const current = hostOf(currentUrl);
  if (signingIn && current && (isAuthHost(service, current) || !isHomeHost(service, current, homeHosts))) return 'stay';
  return 'external';
}

export function routeLink({ service, url: raw, disposition, currentUrl, signingIn = false, homeHosts = [], popup = false, busySubApps = [], inApp = false, toBrowser = false, browsing = false }: LinkInput): LinkDecision {
  // MSAL (Outlook, Teams) and many sites open a blank popup, then send it to the sign-in page
  // (every navigation in it is checked: routePopup).
  if ((service === 'microsoft' || service === 'custom' || service === 'notion') && raw === 'about:blank' && disposition === 'new-window') return { kind: 'auth-popup' };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { kind: 'external', url: raw };
  }
  const url = unwrapGoogleRedirect(parsed);
  // Keep the caller's exact string unless we unwrapped a redirect.
  const href = url === parsed ? raw : url.href;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { kind: 'external', url: href };

  if (isAuthUrl(service, url)) {
    // A sign-in for another app (its return address is elsewhere) never runs in the account.
    // In a custom app only a sign-in back to the site does (not a sign-out of the space's Google).
    const forUs = signInFor(service, href, homeHosts);
    if (forUs === false || (service === 'custom' && forUs !== true)) return { kind: 'external', url: href };
    return disposition === 'new-window' ? { kind: 'auth-popup' } : { kind: 'stay' };
  }

  // Cmd-click (Ctrl-click): the user asked for the browser.
  if (toBrowser) return { kind: 'external', url: href };

  if (service === 'google' && isHomeHost('google', url.hostname)) {
    if (disposition === 'navigate') return { kind: 'stay' };
    const subApp = GOOGLE_SUBAPP_HOSTS[url.hostname];
    if (subApp && !busySubApps.includes(subApp)) return { kind: 'subapp', subApp, url: href };
    return { kind: 'extra-tab', url: href }; // Docs, Chat, Gmail popups, a busy Meet…
  }

  if (service === 'microsoft' && isHomeHost('microsoft', url.hostname)) {
    if (disposition === 'navigate') return { kind: 'stay' };
    const subApp = microsoftSubApp(url);
    if (subApp && !busySubApps.includes(subApp)) return { kind: 'subapp', subApp, url: href };
    return { kind: 'extra-tab', url: href }; // Office files, SharePoint, a mail pop-out, a busy Teams…
  }

  if (service === 'custom' && isSitePage('custom', url, homeHosts)) {
    if (disposition === 'navigate') return { kind: 'stay' };
    return popup ? { kind: 'auth-popup' } : { kind: 'extra-tab', url: href }; // a popup keeps its opener
  }
  // Notion, like a custom app: pages it opens become tabs, and its sign-in popups ("Sign in
  // with Google" starts on Notion's own page) keep their opener.
  if (service === 'notion' && isSitePage('notion', url, [])) {
    if (disposition === 'navigate') return { kind: 'stay' };
    return popup ? { kind: 'auth-popup' } : { kind: 'extra-tab', url: href };
  }
  // Notion's company SSO: its sign-in page sends the SAML request straight to the identity provider.
  if (service === 'notion' && disposition === 'navigate' && isNotionSamlHandoff(href, currentUrl)) return { kind: 'stay' };

  // A custom app's sign-in on another domain (its return address is the site).
  if (service === 'custom' && signInFor('custom', href, homeHosts) === true) {
    return disposition === 'navigate' ? { kind: 'stay' } : { kind: 'auth-popup' };
  }

  if (disposition === 'navigate') {
    if (service !== 'custom' && isHomeHost(service, url.hostname)) return { kind: 'stay' };
    // This account's sign-in handing over to a company identity provider, or going on there:
    // only while this account is signing in.
    const current = hostOf(currentUrl);
    if (current !== null && signingIn && (isAuthHost(service, current) || !isHomeHost(service, current, homeHosts))) return { kind: 'stay' };
    // A link tab is a small browser: the site it shows may link anywhere.
    if (browsing) return { kind: 'stay' };
  }
  return inApp ? { kind: 'extra-tab', url: href } : { kind: 'external', url: href };
}

const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

/** Only these links may be handed to the operating system. */
export function isSafeExternal(url: string): boolean {
  try {
    return SAFE_EXTERNAL_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}
