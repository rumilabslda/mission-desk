import type { ServiceId } from './types';

/** Each service's own name (brand names: not translated). */
const SERVICE_NAMES: Record<Exclude<ServiceId, 'custom'>, string> = {
  google: 'Google',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  microsoft: 'Microsoft 365',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  zoom: 'Zoom',
  proton: 'Proton Mail',
  icloud: 'iCloud Mail',
  fastmail: 'Fastmail',
  notion: 'Notion',
};

/** A name from a site address: "app.notion.so" → "Notion". */
export function nameFromSite(url: string): string {
  try {
    const labels = new URL(url).hostname.split('.').filter((l) => !['www', 'app', 'web', 'my'].includes(l));
    const first = labels[0] ?? '';
    return first.charAt(0).toUpperCase() + first.slice(1);
  } catch {
    return '';
  }
}

/**
 * The name of an app added without one (the space already says whose it is):
 * its service's name, or for a website, its address's.
 */
export function defaultAccountName(service: ServiceId, siteUrl?: string): string {
  if (service !== 'custom') return SERVICE_NAMES[service];
  return (siteUrl && nameFromSite(siteUrl)) || 'Website';
}
