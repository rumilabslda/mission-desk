import type { ServiceId } from '../../shared/types';

export interface ServiceDefinition {
  label: string;
  startUrl: string;
  /** Hosts that count as "inside the service". A leading "." matches any subdomain. */
  homeHosts: string[];
}

export const SERVICES: Record<ServiceId, ServiceDefinition> = {
  google: {
    label: 'Google',
    startUrl: 'https://mail.google.com/',
    // Every Google product host (Gmail, Calendar, Drive, Meet, Docs, Chat, Keep, Admin…).
    homeHosts: ['.google.com'],
  },
  slack: {
    label: 'Slack',
    startUrl: 'https://app.slack.com/client',
    homeHosts: ['app.slack.com', 'slack.com', '.slack.com'],
  },
  whatsapp: {
    label: 'WhatsApp',
    startUrl: 'https://web.whatsapp.com/',
    homeHosts: ['web.whatsapp.com'],
  },
  microsoft: {
    label: 'Microsoft 365',
    startUrl: 'https://outlook.office.com/mail/',
    // Outlook, Teams, sign-in, and the Office/OneDrive/SharePoint pages they open.
    homeHosts: [
      'outlook.office.com',
      'outlook.office365.com',
      'outlook.live.com',
      'outlook.cloud.microsoft',
      'teams.microsoft.com',
      'teams.live.com',
      'teams.cloud.microsoft',
      'login.microsoftonline.com',
      'login.live.com',
      'login.microsoft.com',
      'account.live.com',
      'mysignins.microsoft.com',
      'www.office.com',
      'www.microsoft365.com',
      'm365.cloud.microsoft',
      'onedrive.live.com',
      // Not '.sharepoint.com' or '.officeapps.live.com': anyone can own a SharePoint tenant or
      // point an Office viewer at any file, so those links open in the browser.
    ],
  },
  telegram: {
    label: 'Telegram',
    startUrl: 'https://web.telegram.org/a/',
    homeHosts: ['web.telegram.org'],
  },
  linkedin: {
    label: 'LinkedIn',
    startUrl: 'https://www.linkedin.com/messaging/',
    homeHosts: ['www.linkedin.com', 'linkedin.com'],
  },
  discord: {
    label: 'Discord',
    startUrl: 'https://discord.com/app',
    homeHosts: ['discord.com', 'ptb.discord.com', 'canary.discord.com', 'discord.gg'],
  },
  // Any website: its address and its pages are per account (Account.url, customHomeHosts).
  custom: {
    label: 'Website',
    startUrl: 'about:blank',
    homeHosts: [],
  },
};


/** Google hosts that are not part of the signed-in account (search and redirects). */
const NOT_ACCOUNT_HOSTS = new Set(['www.google.com']);

/** `extraHosts`: a custom app's own hosts (customHomeHosts), in the same format. */
export function isHomeHost(service: ServiceId, host: string, extraHosts: string[] = []): boolean {
  if (NOT_ACCOUNT_HOSTS.has(host)) return false;
  return [...SERVICES[service].homeHosts, ...extraHosts].some((h) => (h.startsWith('.') ? host.endsWith(h) : host === h));
}
