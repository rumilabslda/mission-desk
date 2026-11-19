import { ipcMain, Notification } from 'electron';
import type { Account, ViewKind } from '../../shared/types';
import { SERVICE_IPC } from '../../shared/service-ipc';
import type { ViewRegistry } from '../views/registry';
import { formatNotification, shouldNotify } from './format';
import { createShownNotifications } from './registry';

export interface NotificationBridgeDeps {
  registry: ViewRegistry<unknown>;
  account(id: string): Account | undefined;
  onClick(accountId: string, kind: ViewKind): void;
  onInCall(accountId: string, kind: ViewKind, inCall: boolean): void;
  /** The user can see this page right now (window focused, this view shown). */
  onScreen(accountId: string, kind: ViewKind): boolean;
  /** A notification was shown (Home lists it). */
  onMessage(m: { accountId: string; kind: ViewKind; sender: number; id: number; title: unknown; body: unknown; tag: unknown }): void;
  /** The page closed one of its notifications, or the user clicked it (read). */
  onMessageGone(sender: number, id: number): void;
}

/** Turns notifications and call status from service pages into app behaviour. */
export function registerNotificationBridge(deps: NotificationBridgeDeps): { dismiss(sender: number, id: number): void } {
  const shown = createShownNotifications<Notification>(); // references kept until dismissed (bounded)
  const watched = new WeakSet<Electron.WebContents>();

  ipcMain.on(SERVICE_IPC.notify, (e, payload: { id?: unknown; title?: unknown; body?: unknown; tag?: unknown }) => {
    const owner = deps.registry.accountFor(e.sender.id);
    const account = owner && deps.account(owner.accountId);
    if (!owner || !account || !shouldNotify(account)) return;
    const n = new Notification(
      formatNotification(account, { title: payload?.title as string, body: payload?.body as string }),
    );
    const sender = e.sender;
    if (!watched.has(sender)) {
      watched.add(sender);
      sender.on('did-navigate', () => shown.forgetSender(sender.id)); // a reload restarts the page's ids
    }
    const tag = typeof payload?.tag === 'string' ? payload.tag.slice(0, 200) : '';
    shown.add(sender.id, Number(payload?.id) || 0, tag, n);
    deps.onMessage({ accountId: owner.accountId, kind: owner.kind, sender: sender.id, id: Number(payload?.id) || 0, title: payload?.title, body: payload?.body, tag: payload?.tag });
    n.on('click', () => {
      shown.forget(n);
      deps.onMessageGone(sender.id, Number(payload?.id) || 0);
      deps.onClick(owner.accountId, owner.kind);
      if (!sender.isDestroyed()) sender.send(SERVICE_IPC.notificationClick, Number(payload?.id) || 0);
    });
    n.on('close', () => shown.forget(n));
    n.show();
  });

  ipcMain.on(SERVICE_IPC.notificationClose, (e, id: unknown) => {
    const owner = deps.registry.accountFor(e.sender.id);
    if (!owner) return;
    // Only a real close means read (a toast timing out off screen doesn't).
    if (shown.close(e.sender.id, Number(id) || 0, deps.onScreen(owner.accountId, owner.kind))) deps.onMessageGone(e.sender.id, Number(id) || 0);
  });

  ipcMain.on(SERVICE_IPC.inCall, (e, inCall: unknown) => {
    const owner = deps.registry.accountFor(e.sender.id);
    if (owner) deps.onInCall(owner.accountId, owner.kind, inCall === true);
  });

  return {
    /** Opened from Home: its Mac notification goes too. */
    dismiss: (sender, id) => void shown.close(sender, id, true),
  };
}
