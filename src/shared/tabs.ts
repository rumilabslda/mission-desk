import type { ServiceId, ViewKind } from './types';

export interface TabDef {
  kind: ViewKind;
  title: string;
  url: string;
}

/** The fixed tabs of accounts that have several apps behind one sign-in. */
export const SERVICE_TABS: Partial<Record<ServiceId, TabDef[]>> = {
  google: [
    { kind: 'main', title: 'Gmail', url: 'https://mail.google.com/' },
    { kind: 'calendar', title: 'Calendar', url: 'https://calendar.google.com/' },
    { kind: 'drive', title: 'Drive', url: 'https://drive.google.com/' },
    { kind: 'meet', title: 'Meet', url: 'https://meet.google.com/' },
  ],
  // Personal Microsoft accounts are redirected to outlook.live.com and teams.live.com.
  microsoft: [
    { kind: 'main', title: 'Outlook', url: 'https://outlook.office.com/mail/' },
    { kind: 'calendar', title: 'Calendar', url: 'https://outlook.office.com/calendar/' },
    { kind: 'teams', title: 'Teams', url: 'https://teams.microsoft.com/v2/' },
  ],
  // Any website: its home page (Account.url) and the pages it opens as tabs.
  custom: [{ kind: 'main', title: 'Home', url: '' }],
};

export function hasTabs(service: ServiceId): boolean {
  return SERVICE_TABS[service] !== undefined;
}

/** The service has this fixed tab. */
export function hasTab(service: ServiceId, kind: ViewKind): boolean {
  return SERVICE_TABS[service]?.some((t) => t.kind === kind) ?? false;
}

/** The fixed tab's address (a custom app's Home is its own address, not here). */
export function tabUrl(service: ServiceId, kind: ViewKind): string | undefined {
  return SERVICE_TABS[service]?.find((t) => t.kind === kind)?.url || undefined;
}
