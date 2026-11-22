import { type BrowserWindow, WebContentsView } from 'electron';
import type { Account, ViewKind } from '../../shared/types';
import { GOOGLE_TABSTRIP_HEIGHT, SIDEBAR_WIDTH } from '../../shared/layout';
import { SERVICES } from '../accounts/services';
import { hasTabs, tabUrl } from '../../shared/tabs';
import { accountSession } from './session';
import type { ViewRegistry } from './registry';

export interface ViewManagerDeps {
  registry: ViewRegistry<WebContentsView>;
  preloadPath: string;
  /** Called once per new view so the controller can attach its listeners. */
  onViewCreated(account: Account, kind: ViewKind, view: WebContentsView): void;
  /** Called after a view is hidden or shown, for the hibernation scheduler. */
  onVisibilityChanged(accountId: string, kind: ViewKind, visible: boolean): void;
  /** Extra space above the page for this account (e.g. the Claude banner). */
  topInset?(accountId: string): number;
  /** Space on the right for the assistant panel. */
  rightInset?(): number;
  /** A page of the account's own service: only those are reopened after hibernation or a crash. */
  isHomeUrl?(account: Account, url: string): boolean;
  /**
   * A page closed itself (window.close() on a sign-in's last page, for one): the view is gone from
   * the registry; `onScreen` says it was the one showing. Not called when Mission Desk closed it.
   */
  onViewGone?(account: Account, kind: ViewKind, onScreen: boolean): void;
}

export interface ViewManager {
  ensure(account: Account, kind: ViewKind, url?: string): WebContentsView;
  show(account: Account, kind: ViewKind): void;
  current(): { accountId: string; kind: ViewKind } | null;
  /** Hides whatever page is on screen (e.g. for the "All calendars" view). */
  hideAll(): void;
  hibernate(accountId: string, kind: ViewKind): void;
  /** Destroys a view for good (e.g. a closed extra tab), even if it is on screen. */
  close(accountId: string, kind: ViewKind): void;
  destroyAccount(accountId: string): void;
  layout(): void;
  setModalOpen(open: boolean): void;
  /** Briefly draws a hidden view on top (no selection or focus change) while `fn` runs. */
  peek<T>(accountId: string, kind: ViewKind, fn: () => Promise<T>): Promise<T>;
}

function defaultUrl(account: Account, kind: ViewKind): string {
  if (kind === 'main') return account.service === 'custom' ? (account.url ?? 'about:blank') : SERVICES[account.service].startUrl;
  const tab = tabUrl(account.service, kind);
  if (tab) return tab;
  return 'about:blank'; // an extra tab with no remembered URL
}

export function createViewManager(win: BrowserWindow, deps: ViewManagerDeps): ViewManager {
  const { registry } = deps;
  let active: { account: Account; kind: ViewKind } | null = null;
  const owners = new WeakMap<WebContentsView, Account>();
  let modalOpen = false;

  function destroy(view: WebContentsView): void {
    win.contentView.removeChildView(view);
    if (!view.webContents.isDestroyed()) view.webContents.close();
  }

  function bounds(account: Account): Electron.Rectangle {
    const { width, height } = win.getContentBounds();
    const top = (hasTabs(account.service) ? GOOGLE_TABSTRIP_HEIGHT : 0) + (deps.topInset?.(account.id) ?? 0);
    const right = deps.rightInset?.() ?? 0;
    return { x: SIDEBAR_WIDTH, y: top, width: Math.max(0, width - SIDEBAR_WIDTH - right), height: Math.max(0, height - top) };
  }

  const manager: ViewManager = {
    ensure(account, kind, url) {
      let existing = registry.get(account.id, kind);
      if (existing?.webContents.isDestroyed()) {
        // Gone without Mission Desk closing it: never hand out a dead page.
        registry.removeView(account.id, kind);
        win.contentView.removeChildView(existing);
        existing = undefined;
      }
      if (existing) {
        if (url) void existing.webContents.loadURL(url);
        return existing;
      }
      const view = new WebContentsView({
        webPreferences: {
          session: accountSession(account.id, account.service),
          preload: deps.preloadPath,
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
        },
      });
      view.setVisible(false);
      owners.set(view, account);
      view.setBounds(bounds(account)); // real size from the start, so hidden pages lay out correctly
      registry.set(account.id, kind, view, view.webContents.id);
      const remember = (_e: unknown, navigatedUrl: string): void => {
        if (/^https?:/.test(navigatedUrl) && (deps.isHomeUrl?.(account, navigatedUrl) ?? true)) registry.setLastUrl(account.id, kind, navigatedUrl);
      };
      view.webContents.on('did-navigate', remember);
      view.webContents.on('did-navigate-in-page', remember);
      view.webContents.once('destroyed', () => {
        if (registry.get(account.id, kind) !== view) return; // Mission Desk closed it (hibernation, a closed tab…)
        registry.removeView(account.id, kind);
        if (!win.isDestroyed()) win.contentView.removeChildView(view);
        const onScreen = active?.account.id === account.id && active.kind === kind;
        if (onScreen) active = null;
        deps.onViewGone?.(account, kind, onScreen);
      });
      win.contentView.addChildView(view);
      deps.onViewCreated(account, kind, view);
      void view.webContents.loadURL(url ?? registry.lastUrl(account.id, kind) ?? defaultUrl(account, kind));
      return view;
    },

    show(account, kind) {
      const target = manager.ensure(account, kind);
      const previous = active;
      active = { account, kind };
      for (const id of [previous?.account.id, account.id]) {
        if (!id) continue;
        for (const k of registry.kinds(id)) {
          const view = registry.get(id, k)!;
          const visible = view === target && !modalOpen;
          if (view.getVisible() !== visible) {
            view.setVisible(visible);
            deps.onVisibilityChanged(id, k, visible);
          }
        }
      }
      target.setBounds(bounds(account));
      if (!modalOpen) target.webContents.focus();
    },

    current: () => (active ? { accountId: active.account.id, kind: active.kind } : null),

    hideAll() {
      if (!active) return;
      const { account, kind } = active;
      active = null;
      const view = registry.get(account.id, kind);
      if (view?.getVisible()) {
        view.setVisible(false);
        deps.onVisibilityChanged(account.id, kind, false);
      }
    },

    hibernate(accountId, kind) {
      if (active?.account.id === accountId && active.kind === kind) return; // never hibernate what is on screen
      const view = registry.removeView(accountId, kind);
      if (view) destroy(view);
    },

    close(accountId, kind) {
      const view = deps.registry.removeView(accountId, kind);
      if (view) destroy(view);
      if (active?.account.id === accountId && active.kind === kind) active = null;
    },

    destroyAccount(accountId) {
      for (const view of registry.removeAccount(accountId)) destroy(view);
      if (active?.account.id === accountId) active = null;
    },

    layout() {
      for (const child of win.contentView.children) {
        const owner = owners.get(child as WebContentsView);
        if (owner) child.setBounds(bounds(owner));
      }
    },

    async peek(accountId, kind, fn) {
      const view = registry.get(accountId, kind);
      const owner = view && owners.get(view);
      if (!view || !owner) throw new Error('The page is not loaded.');
      if (view.getVisible()) return fn();
      view.setBounds(bounds(owner));
      win.contentView.addChildView(view); // on top, without changing the selection or focus
      view.setVisible(true);
      try {
        return await fn();
      } finally {
        view.setVisible(false);
      }
    },

    setModalOpen(open) {
      modalOpen = open;
      if (!active) return;
      const view = registry.get(active.account.id, active.kind);
      if (view) view.setVisible(!open);
    },
  };
  return manager;
}
