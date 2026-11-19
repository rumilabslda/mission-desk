import path from 'node:path';
import { type BrowserWindow, type WebContents, WebContentsView } from 'electron';
import { IPC } from '../../shared/ipc';
import type { QuickRequest } from '../../shared/quick';

export interface QuickOverlay {
  /** Shows a quick-entry pop-up (new to-do or event) over the whole window. */
  show(request: QuickRequest): void;
  /** Loads the hidden page ahead of time, so the first pop-up opens at once. */
  warm(): void;
  hide(): void;
  isOpen(): boolean;
  /** Follows the window's size while open. */
  layout(): void;
  webContents(): WebContents | null;
}

/**
 * The ⚡ quick actions' pop-ups. Account pages are native views above the UI, so the
 * pop-up is its own view on top of them (the page stays where it is, dimmed), loading the
 * UI page at #quick. Unlike the space panel it stays open on blur: the user may switch
 * apps to copy something into it. Esc, Cancel, a click outside or a save closes it.
 */
export function createQuickOverlay(win: BrowserWindow, deps: { uiPreloadPath: string; focusBack(): void }): QuickOverlay {
  let view: WebContentsView | null = null;
  let open = false;
  let pending: QuickRequest | null = null;

  function ensure(): WebContentsView {
    if (view && !view.webContents.isDestroyed()) return view;
    const v = new WebContentsView({
      webPreferences: { preload: deps.uiPreloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    v.setBackgroundColor('#00000000');
    v.setVisible(false);
    v.webContents.on('will-navigate', (e) => e.preventDefault());
    v.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    v.webContents.on('did-finish-load', () => {
      if (open && pending) v.webContents.send(IPC.quickRequest, pending);
    });
    if (process.env.ELECTRON_RENDERER_URL) void v.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}#quick`);
    else void v.webContents.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'quick' });
    view = v;
    return v;
  }

  const overlay: QuickOverlay = {
    show(request) {
      const v = ensure();
      pending = request;
      open = true;
      overlay.layout();
      win.contentView.addChildView(v); // on top of every page view (and the assistant)
      v.setVisible(true);
      if (!v.webContents.isLoading()) v.webContents.send(IPC.quickRequest, request);
      v.webContents.focus();
      // macOS sometimes keeps the old (empty) frame of a view shown again, without the dimmed backdrop.
      setTimeout(() => open && !v.webContents.isDestroyed() && v.webContents.invalidate(), 60);
    },
    warm() {
      ensure();
    },
    hide() {
      if (!open) return;
      open = false;
      pending = null;
      if (view && !view.webContents.isDestroyed()) {
        view.setVisible(false);
        view.webContents.send(IPC.quickRequest, null); // empty, so the next pop-up never shows the last one
      }
      if (!win.isDestroyed()) deps.focusBack(); // typing goes back to the page underneath
    },
    isOpen: () => open,
    layout() {
      if (!open || !view || view.webContents.isDestroyed()) return;
      const { width, height } = win.getContentBounds();
      view.setBounds({ x: 0, y: 0, width, height });
    },
    webContents: () => (view && !view.webContents.isDestroyed() ? view.webContents : null),
  };
  return overlay;
}
