import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** A Chrome profile: its folder inside Chrome's data (e.g. "Profile 2"), the name the user gave it, and the Google account signed in to it. */
export interface ChromeProfile {
  dir: string;
  name: string;
  email?: string;
}

/** Profile folders look like "Default" or "Profile 3": nothing that could act as a path or a flag. */
const SAFE_DIR = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$/;

/** Chrome lists its profiles in "Local State" (profile.info_cache). */
export function parseChromeProfiles(localState: string): ChromeProfile[] {
  let cache: unknown;
  try {
    cache = (JSON.parse(localState) as { profile?: { info_cache?: unknown } })?.profile?.info_cache;
  } catch {
    return [];
  }
  if (typeof cache !== 'object' || cache === null) return [];
  return Object.entries(cache as Record<string, { name?: unknown; user_name?: unknown }>)
    .filter(([dir]) => SAFE_DIR.test(dir) && !dir.includes('..'))
    .map(([dir, info]) => {
      const name = typeof info?.name === 'string' && info.name.trim() ? info.name.trim() : dir;
      const email = typeof info?.user_name === 'string' && info.user_name.includes('@') ? info.user_name.trim().toLowerCase() : undefined;
      return email ? { dir, name, email } : { dir, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Chrome's profiles on this Mac (none elsewhere, or without Chrome). */
export function listChromeProfiles(): ChromeProfile[] {
  if (process.platform !== 'darwin') return [];
  try {
    return parseChromeProfiles(readFileSync(join(homedir(), 'Library/Application Support/Google/Chrome/Local State'), 'utf8'));
  } catch {
    return [];
  }
}

/** `open -na "Google Chrome" --args …`: a running Chrome takes the link into that profile. */
export function chromeOpenArgs(url: string, dir: string): string[] {
  return ['-na', 'Google Chrome', '--args', `--profile-directory=${dir}`, url];
}

/** Opens a web link in one of Chrome's profiles. False when that can't be done here (the caller uses the default browser). */
export function openInChromeProfile(url: string, dir: string): boolean {
  if (!/^https?:\/\//.test(url)) return false;
  if (!listChromeProfiles().some((p) => p.dir === dir)) return false; // the profile was deleted, or this isn't a Mac
  execFile('/usr/bin/open', chromeOpenArgs(url, dir), () => undefined);
  return true;
}

/** Domains anyone can have an address at: two addresses there say nothing about being the same person. */
const SHARED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
  'yahoo.com', 'proton.me', 'protonmail.com', 'pm.me', 'fastmail.com', 'aol.com', 'gmx.com', 'gmx.net', 'zoho.com',
  'sapo.pt', 'hotmail.pt', 'outlook.pt', 'yahoo.com.br', 'uol.com.br', 'bol.com.br',
]);

const domainOf = (email: string): string => email.slice(email.lastIndexOf('@') + 1).toLowerCase();

export interface ProfileClues {
  profiles: ChromeProfile[];
  /** The profile chosen by hand for the app's space. */
  manual?: string;
  /** The app's own address (a Gmail account's). */
  email?: string;
  /** Addresses of the other accounts in the app's space, in sidebar order. */
  spaceEmails: string[];
  /** A website app's own hosts. */
  hosts?: string[];
}

/**
 * The Chrome profile an app's browser links open in: the one chosen for its space; else the profile
 * signed in to the app's own address, then to a space mate's; else one at the same company (its
 * domain, never a shared one like gmail.com), by address and then by a website app's host.
 * Null: the default browser.
 */
export function pickChromeProfile({ profiles, manual, email, spaceEmails, hosts = [] }: ProfileClues): { dir: string; auto: boolean } | null {
  if (manual && profiles.some((p) => p.dir === manual)) return { dir: manual, auto: false };
  const signedIn = profiles.filter((p): p is ChromeProfile & { email: string } => !!p.email);
  const emails = [email, ...spaceEmails].filter((e): e is string => !!e).map((e) => e.toLowerCase());
  const company = (domain: string): ChromeProfile | undefined => (SHARED_DOMAINS.has(domain) ? undefined : signedIn.find((p) => domainOf(p.email) === domain));
  // The app's own address first (the same address, then its company), then each space mate's.
  for (const e of emails) {
    const p = signedIn.find((x) => x.email === e) ?? company(domainOf(e));
    if (p) return { dir: p.dir, auto: true };
  }
  for (const host of hosts.map((h) => h.toLowerCase())) {
    const p = signedIn.find((x) => !SHARED_DOMAINS.has(domainOf(x.email)) && (host === domainOf(x.email) || host.endsWith(`.${domainOf(x.email)}`)));
    if (p) return { dir: p.dir, auto: true };
  }
  return null;
}
