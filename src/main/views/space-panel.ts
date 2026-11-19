import path from 'node:path';
import { type BrowserWindow, type WebContents, WebContentsView } from 'electron';
import { SIDEBAR_WIDTH } from '../../shared/layout';

const WIDTH = 248;
const ROW = 40;
const CHROME = 52; // title row + padding + the transparent margin for the shadow
const REOPEN_GUARD_MS = 300;

export interface SpacePanel {
  /** Shows the panel for a space next to the sidebar, `top` px from the window's top. */
  open(spaceId: string, top: number, rows: number): void;
  close(): void;
  spaceId(): string | null;
  webContents(): WebContents | null;
}

/**
 * "Folders with panel": account pages are native views above the UI, so the
 * panel is its own small view drawn on top of them, loading the UI page at
 * #space-panel. It closes when it loses focus.
 */
export function createSpacePanel(win: BrowserWindow, deps: { uiPreloadPath: string; onChange(): void }): SpacePanel {
  let view: WebContentsView | null = null;
  let current: string | null = null;
  let closedAt = 0;
  let closedSpace: string | null = null;

  function ensure(): WebContentsView {
    if (view && !view.webContents.isDestroyed()) return view;
    const v = new WebContentsView({
      webPreferences: { preload: deps.uiPreloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    v.setBackgroundColor('#00000000');
    v.setVisible(false);
    v.webContents.on('blur', () => panel.close());
    v.webContents.on('will-navigate', (e) => e.preventDefault());
    v.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    if (process.env.ELECTRON_RENDERER_URL) void v.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}#space-panel`);
    else void v.webContents.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'space-panel' });
    view = v;
    return v;
  }

  const panel: SpacePanel = {
    open(spaceId, top, rows) {
      // The click that toggles the tile first blurs the open panel; don't reopen it.
      if (closedSpace === spaceId && Date.now() - closedAt < REOPEN_GUARD_MS) return;
      const v = ensure();
      const { width, height } = win.getContentBounds();
      const h = Math.min(CHROME + ROW * Math.max(1, rows), Math.max(120, height - 16));
      const y = Math.max(8, Math.min(Math.round(top) - 8, height - h - 8));
      v.setBounds({ x: SIDEBAR_WIDTH + 2, y, width: Math.min(WIDTH, Math.max(0, width - SIDEBAR_WIDTH - 4)), height: h });
      win.contentView.addChildView(v); // on top of every page view
      v.setVisible(true);
      current = spaceId;
      deps.onChange();
      // It must hold the focus, or it would never get the blur that closes it (also on the first open, while loading).
      if (v.webContents.isLoading()) v.webContents.once('did-finish-load', () => current === spaceId && v.webContents.focus());
      v.webContents.focus();
    },
    close() {
      if (!current) return;
      closedSpace = current;
      closedAt = Date.now();
      current = null;
      if (view && !view.webContents.isDestroyed()) {
        const hadFocus = view.webContents.isFocused();
        view.setVisible(false);
        if (hadFocus && !win.isDestroyed()) win.webContents.focus(); // typing must not go to a hidden view
      }
      deps.onChange();
    },
    spaceId: () => current,
    webContents: () => (view && !view.webContents.isDestroyed() ? view.webContents : null),
  };
  return panel;
}
