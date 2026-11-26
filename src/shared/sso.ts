import type { ServiceId, Space } from './types';

/**
 * Shared Google sign-in inside a space: which accounts share Google's
 * sign-in cookies with which. Only Google cookies are ever shared.
 */

/** google.<tld> (incl. country domains like google.co.uk) or youtube.com, and their subdomains. */
export function isGoogleCookieDomain(domain: string): boolean {
  const d = domain.replace(/^\./, '').toLowerCase();
  return /(^|\.)google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(d) || /(^|\.)youtube\.com$/.test(d);
}

export interface SsoGroup {
  spaceId: string;
  /** The Google account whose sign-in is shared, or null when the space has none. */
  identityId: string | null;
  /** The identity (first, when there is one) and the other participants. */
  members: string[];
}

interface SsoAccount {
  id: string;
  service: ServiceId;
  spaceId?: string;
}

/**
 * The apps that offer "Sign in with Google" and get the space's Google sign-in.
 * Not custom apps: any website would get the work Google account. Not Microsoft 365
 * (its own sign-in), WhatsApp (never touched), nor apps without Google sign-in.
 */
const GOOGLE_SIGN_IN_APPS: ReadonlySet<ServiceId> = new Set<ServiceId>(['slack', 'linkedin', 'zoom', 'notion']);

/** The groups of accounts that share Google sign-in (only groups of 2 or more). */
export function ssoGroups(accounts: SsoAccount[], spaces: Space[]): SsoGroup[] {
  const groups: SsoGroup[] = [];
  for (const space of spaces) {
    if (space.shareGoogle === false) continue;
    const inSpace = accounts.filter((a) => a.spaceId === space.id);
    const googles = inSpace.filter((a) => a.service === 'google');
    const identity = googles.find((a) => a.id === space.googleAccountId) ?? googles[0] ?? null;
    const others = inSpace.filter((a) => GOOGLE_SIGN_IN_APPS.has(a.service));
    const members = [...(identity ? [identity.id] : []), ...others.map((a) => a.id)];
    if (members.length >= 2) groups.push({ spaceId: space.id, identityId: identity?.id ?? null, members });
  }
  return groups;
}
