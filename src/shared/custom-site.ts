import { parse } from 'tldts';
// A custom app is any website the user adds. These rules decide its address and which
// pages count as "inside" it (they stay in its view; everything else goes to the browser).

const MAX_URL = 2048;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Hosts where every customer gets a subdomain (anyone can register one), beyond the public
 * suffix list's private section: on these, a site is the customer's own subdomain. Matched
 * longest first (acme.my.salesforce.com → the org, not all of salesforce.com).
 */
const SHARED_HOSTS = new Set([
  'atlassian.net', 'sharepoint.com', 'zendesk.com', 'freshdesk.com', 'freshservice.com', 'monday.com', 'slack.com',
  'salesforce.com', 'my.salesforce.com', 'lightning.force.com', 'force.com', 'site.com', 'my.site.com',
  'okta.com', 'oktapreview.com', 'okta-emea.com', 'auth0.com', 'us.auth0.com', 'eu.auth0.com', 'au.auth0.com', 'jp.auth0.com', 'onelogin.com', 'service-now.com', 'servicenowservices.com',
  'awsapps.com', 'amazonaws.com', 'cloudfront.net', 'azurewebsites.net', 'myshopify.com', 'notion.site', 'webflow.io',
  'wordpress.com', 'blogspot.com', 'github.io', 'gitlab.io', 'vercel.app', 'netlify.app', 'herokuapp.com', 'web.app',
  'firebaseapp.com', 'pages.dev', 'workers.dev', 'onrender.com', 'fly.dev', 'ngrok.io', 'ngrok-free.app', 'bubbleapps.io',
  'glitch.me', 'repl.co', 'replit.app', 'airtableblocks.com', 'kinsta.cloud', 'wpengine.com', 'squarespace.com', 'wixsite.com',
]);

/** The site address the user typed, tidied: https (http only for this Mac), no credentials. */
export function cleanSiteUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const raw = v.trim();
  if (!raw || raw.length > MAX_URL) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!url.hostname || url.username || url.password) return null;
  const local = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) return null;
  if (!local && !url.hostname.includes('.')) return null;
  return url.href;
}

const clean = (host: string): string => host.toLowerCase().replace(/\.$/, '');

/** The customer's subdomain when the host is under a shared host, else null. */
function sharedTenant(host: string): string | null {
  const labels = host.split('.');
  for (let n = labels.length - 1; n >= 1; n--) {
    if (SHARED_HOSTS.has(labels.slice(-n).join('.'))) return labels.slice(-(n + 1)).join('.');
  }
  return null;
}

/** The site of a host: its registrable domain (public suffix list, private domains included), a shared host's tenant, or an IP itself. */
function siteOf(raw: string): string {
  const host = clean(raw);
  const p = parse(host, { allowPrivateDomains: true });
  if (p.isIp) return host;
  if (p.isPrivate && p.domain) return p.domain; // the public suffix list knows this shared host precisely
  return sharedTenant(host) ?? p.domain ?? host;
}

/** Anyone can get a name here (a shared host or the public suffix list's private section). */
function isSharedHost(raw: string): boolean {
  const host = clean(raw);
  return sharedTenant(host) !== null || parse(host, { allowPrivateDomains: true }).isPrivate === true;
}

function hostOf(url: string | undefined): string | null {
  try {
    return new URL(url ?? '').hostname || null;
  } catch {
    return null;
  }
}

function hostsOfSite(url: string | undefined): string[] {
  const raw = hostOf(url);
  if (!raw) return [];
  const host = clean(raw);
  if (LOCAL_HOSTS.has(host) || parse(host).isIp) return [host];
  const site = siteOf(host);
  return [site, `.${site}`];
}

/** The hosts inside a custom app: its site, sites it moved to (`learned`), and their subdomains (isHomeHost's format). */
export function customHomeHosts(siteUrl: string | undefined, learned: string[] = []): string[] {
  return [...new Set([siteUrl, ...learned].flatMap(hostsOfSite))];
}

/**
 * On the app's very first load (`learned` not set yet), the site may move to another domain of
 * the same brand (notion.so → www.notion.com). Returns the final list ([] when nothing moved:
 * same site, another brand such as a sign-in provider, or a shared host anyone can register),
 * or null when there is nothing to decide (already decided, or the page isn't loaded yet).
 */
export function learnSite(siteUrl: string, learned: string[] | undefined, landingUrl: string): string[] | null {
  if (learned !== undefined) return null;
  let landing: URL;
  try {
    landing = new URL(landingUrl);
  } catch {
    return null;
  }
  if (landing.protocol !== 'https:') return null;
  const start = hostOf(siteUrl);
  if (!start) return [];
  const host = clean(landing.hostname);
  const known = customHomeHosts(siteUrl);
  if (known.some((h) => (h.startsWith('.') ? host.endsWith(h) : host === h))) return [];
  if (parse(host).isIp || isSharedHost(host) || isSharedHost(start)) return [];
  const brand = (h: string): string => siteOf(h).split('.')[0];
  if (brand(start) !== brand(host)) return [];
  return [`${landing.origin}/`];
}
