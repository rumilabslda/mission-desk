import { hasTabs, SERVICE_TABS } from '../../shared/tabs';
import path from 'node:path';
import { type BrowserWindow, dialog, type WebContents, type WebContentsView } from 'electron';
import type { Account, UnreadCount, ViewKind } from '../../shared/types';
import { appendLog } from './log';
import { createConsent, type Consent } from './consent';
import { createControlService, type ControlHost, type PageHandle } from './control';

const ISOLATED_WORLD = 1001;
const LOAD_TIMEOUT_MS = 15_000;
const KEY_CODES: Record<string, string> = {
  Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', Space: 'Space',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  PageUp: 'PageUp', PageDown: 'PageDown', Home: 'Home', End: 'End',
};
const KEY_CHARS: Record<string, string> = { Enter: '\r', Tab: '\t', Space: ' ' };

/** What the app controller lends to the Claude integration. */
export interface ClaudeHooks {
  win: BrowserWindow;
  userData: string;
  accounts(): Account[];
  account(id: string): Account | undefined;
  ensure(account: Account, kind: ViewKind, url?: string): WebContentsView;
  extraKinds(accountId: string): ViewKind[];
  /** The kind on screen if this account is the one shown, else null. */
  currentKind(accountId: string): ViewKind | null;
  /** A call (camera/microphone) is in progress in this view: it must not be reloaded. */
  inCall(accountId: string, kind: ViewKind): boolean;
  /** Selects the account and tab so the user sees what Claude does. */
  show(accountId: string, kind: ViewKind): void;
  /** Opens a new extra Google tab without switching to it; returns its kind. */
  openExtra(account: Account, url: string): ViewKind;
  unread(accountId: string): UnreadCount;
  /** Something Claude-related changed (grants): push a new UI snapshot. */
  onChange(): void;
  /** Captures a view without changing what the user sees (see ViewManager.peek). */
  peek<T>(accountId: string, kind: ViewKind, fn: () => Promise<T>): Promise<T>;
}

function waitForLoad(wc: WebContents): Promise<void> {
  if (!wc.isLoading()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      wc.off('did-stop-loading', done);
      reject(new Error('Timed out loading the page (15 s).'));
    }, LOAD_TIMEOUT_MS);
    function done(): void {
      clearTimeout(timer);
      resolve();
    }
    wc.once('did-stop-loading', done);
  });
}

const CONSENT_TIMEOUT_MS = 60_000;

function pageHandle(wc: WebContents, peek: <T>(fn: () => Promise<T>) => Promise<T>): PageHandle {
  return {
    url: () => wc.getURL(),
    title: () => wc.getTitle(),
    evalIsolated: <T,>(code: string) => wc.executeJavaScriptInIsolatedWorld(ISOLATED_WORLD, [{ code }]) as Promise<T>,
    async capturePng(maxWidth) {
      // Chromium only draws views that are on screen, so draw this one on top for a moment.
      let image = await peek(async () => {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 100));
          try {
            const shot = await wc.capturePage();
            if (!shot.isEmpty()) return shot;
          } catch {
            // not drawn yet
          }
        }
        return null;
      });
      if (!image) throw new Error('The page could not be captured right now.');
      if (image.getSize().width > maxWidth) image = image.resize({ width: maxWidth, quality: 'good' });
      return image.toPNG();
    },
    mouseClick(x, y) {
      wc.sendInputEvent({ type: 'mouseMove', x, y });
      wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
      wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    },
    insertText(text) {
      void wc.insertText(text);
    },
    key(key, modifiers) {
      const keyCode = KEY_CODES[key];
      const mods = modifiers.map((m) => (m === 'cmd' ? 'meta' : 'shift')) as ('meta' | 'shift')[];
      wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods });
      if (KEY_CHARS[key] && mods.length === 0) wc.sendInputEvent({ type: 'char', keyCode: KEY_CHARS[key] });
      wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods });
    },
  };
}

export function createClaudeIntegration(h: ClaudeHooks) {
  const base: Consent = createConsent(() => Date.now());
  const consent: Consent = {
    ...base,
    grant: (id) => {
      base.grant(id);
      h.onChange();
    },
    revoke: (id) => {
      base.revoke(id);
      h.onChange();
    },
    revokeAll: () => {
      base.revokeAll();
      h.onChange();
    },
  };

  // Expired grants disappear from the UI within a minute.
  let lastActive = '';
  setInterval(() => {
    const now = base.active().join(',');
    if (now !== lastActive) {
      lastActive = now;
      h.onChange();
    }
  }, 60_000).unref();

  const host: ControlHost = {
    accounts: h.accounts,
    tabs: (id) => {
      const a = h.account(id);
      const fixed: ViewKind[] = a ? (SERVICE_TABS[a.service]?.map((t) => t.kind) ?? ['main']) : ['main'];
      return a && hasTabs(a.service) ? [...fixed, ...h.extraKinds(id)] : fixed;
    },
    defaultKind: (id) => h.currentKind(id) ?? 'main',
    async page(id, kind) {
      const a = h.account(id);
      if (!a) throw new Error('The account was removed.');
      const wc = h.ensure(a, kind).webContents;
      await waitForLoad(wc);
      return pageHandle(wc, (fn) => h.peek(id, kind, fn));
    },
    show: h.show,
    async openUrl(id, target) {
      const a = h.account(id);
      if (!a) throw new Error('The account was removed.');
      if (target.kind === 'extra') return h.openExtra(a, target.url);
      if (h.inCall(id, target.kind)) {
        // Loading the URL there would end the call: use a tab of its own, or refuse.
        if (hasTabs(a.service)) return h.openExtra(a, target.url);
        throw new Error('A call is in progress on that page. Try again after the call.');
      }
      h.ensure(a, target.kind, target.url);
      return target.kind;
    },
    async askConsent(a, signal) {
      if (h.win.isMinimized()) h.win.restore();
      h.win.show();
      h.win.focus();
      // Closes by itself if Claude cancels, the connection drops, or nobody answers in a minute.
      const timeout = AbortSignal.timeout(CONSENT_TIMEOUT_MS);
      const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const { response } = await dialog.showMessageBox(h.win, {
        signal: abort,
        type: 'question',
        message: `Allow Claude to act in ${a.name} for 30 minutes?`,
        detail: 'Claude will be able to click and type in this account. Stop it any time with the Stop button or ⌘.',
        buttons: ['Allow', 'Deny'],
        defaultId: 1,
        cancelId: 1,
      });
      return response === 0 && !abort.aborted;
    },
    log: (line) => appendLog(path.join(h.userData, 'claude-activity.log'), line),
    unread: h.unread,
  };

  const service = createControlService(host, consent);
  return {
    /** A new set of element refs, one per MCP connection (`neverSend` for the in-app assistant). */
    session: (opts?: { neverSend?: boolean; only?: (a: Account) => boolean }) => service.session(opts),
    acting: (): string[] => base.active(),
    /** Stop Claude acting in one account, or everywhere. */
    stop(accountId?: string): void {
      if (accountId) consent.revoke(accountId);
      else consent.revokeAll();
    },
  };
}
export type ClaudeIntegration = ReturnType<typeof createClaudeIntegration>;
