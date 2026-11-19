/** Channels between service-page preloads and the main process. */
export const SERVICE_IPC = {
  notify: 'service:notify',
  notificationClick: 'service:notification-click',
  notificationClose: 'service:notification-close',
  inCall: 'service:in-call',
  identity: 'service:identity',
  /** Outlook's or Teams' unread count, read from the page (they don't show it in the title). */
  unread: 'service:unread',
} as const;

/** Image URLs a service page shows for its account (untrusted; checked in main). */
export interface IdentityPayload {
  photoUrl?: string;
  companyIconUrl?: string;
}

export interface NotifyPayload {
  id: number;
  title: string;
  body: string;
  tag: string;
}
