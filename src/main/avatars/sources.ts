import type { ServiceId } from '../../shared/types';

/** What a service page tells us about its account (all optional, all untrusted). */
export interface PageIdentity {
  service: ServiceId;
  email?: string;
  photoUrl?: string;
  companyIconUrl?: string;
  /** A custom app's address. */
  siteUrl?: string;
  /** A custom app's icon, as its page declares it. */
  faviconUrl?: string;
}

const PERSONAL_GOOGLE_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

type Rule = { host: RegExp; path?: RegExp };

/** Where each service may point us to for images. Anything else is ignored. */
const IMAGE_RULES: Record<ServiceId, Rule[]> = {
  google: [
    { host: /(^|\.)googleusercontent\.com$/ },
    { host: /^lh\d\.google\.com$/ }, // Workspace profile photos
    { host: /^www\.google\.com$/, path: /^\/(u\/\d+\/)?ac\/images\/logo/ }, // Workspace company logo
  ],
  slack: [{ host: /(^|\.)slack-edge\.com$/ }, { host: /(^|\.)slack\.com$/ }],
  whatsapp: [{ host: /(^|\.)whatsapp\.net$/ }],
  microsoft: [], // Microsoft photos are not read (the letter or the logo is shown)
  telegram: [],
  linkedin: [],
  discord: [],
  zoom: [],
  custom: [], // a custom app's icon is its site's favicon (iconCandidates)
};

const GOOGLE_PHOTO = /^https:\/\/lh\d\.google(usercontent)?\.com\//;

/** The account button holds a decorative ring and the photo; take the photo. */
export function pickGooglePhoto(srcs: string[]): string | undefined {
  return srcs.find((s) => GOOGLE_PHOTO.test(s));
}

/**
 * Workspace serves Google's own logo (360×119) at the company-logo URL when the
 * company has not uploaded one; custom logos come back at 320×132.
 */
export function isDefaultWorkspaceLogo(url: string, size: { width: number; height: number }): boolean {
  return /\/ac\/images\/logo/.test(url) && size.width === 360 && size.height === 119;
}

/** Scales a size to fit in a `max`×`max` box, keeping its shape. */
export function fitWithin(size: { width: number; height: number }, max: number): { width: number; height: number } {
  const scale = max / Math.max(size.width, size.height);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

export function emailFromGmailTitle(title: string): string | null {
  // "Inbox - me@acme.com - Gmail" or, on Workspace, "… - Acme Group Mail".
  const m = / - ([^\s@]+@[^\s@]+\.[^\s@]+) - .+$/.exec(title);
  return m ? m[1] : null;
}

export function companyDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !PERSONAL_GOOGLE_DOMAINS.has(domain) ? domain : null;
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/** Google photo URLs end in "=s32-c…"; ask for a sharper one. */
export function googlePhotoAtSize(url: string, size: number): string {
  return url.replace(/=s\d+(?=[-?]|$)/, `=s${size}`);
}

export function isAllowedImageUrl(service: ServiceId, url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      IMAGE_RULES[service].some((r) => r.host.test(u.hostname) && (!r.path || r.path.test(u.pathname)))
    );
  } catch {
    return false;
  }
}

/** Image URLs to try, best first: the company logo, then the person's photo. */
export function iconCandidates(id: PageIdentity): string[] {
  const out: string[] = [];
  const allowed = (url: string | undefined): url is string => !!url && isAllowedImageUrl(id.service, url);
  if (id.service === 'custom') {
    // The page's own icon, fetched with the app's session (no third party learns the address).
    if (id.faviconUrl && /^https:\/\//.test(id.faviconUrl) && id.faviconUrl.length < 2048) out.push(id.faviconUrl);
    return out;
  }
  if (id.service === 'google') {
    const domain = id.email ? companyDomain(id.email) : null;
    if (domain && allowed(id.companyIconUrl)) out.push(id.companyIconUrl);
    if (domain) out.push(faviconUrl(domain));
    if (allowed(id.photoUrl)) out.push(googlePhotoAtSize(id.photoUrl, 128));
  } else {
    if (allowed(id.companyIconUrl)) out.push(id.companyIconUrl);
    if (allowed(id.photoUrl)) out.push(id.photoUrl);
  }
  return out;
}
