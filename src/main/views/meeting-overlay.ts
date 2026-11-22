import path from 'node:path';
import { type BrowserWindow, type WebContents, WebContentsView } from 'electron';

/**
 * The transcription bar, drawn over the meeting's own view (account pages are native views above
 * the UI, so it is a small view of its own, loading the UI page at #meeting-bar).
 */
export function createMeetingOverlay(win: BrowserWindow, deps: { uiPreloadPath: string }) {
  let view: WebContentsView | null = null;

  function ensure(): WebContentsView {
    if (view && !view.webContents.isDestroyed()) return view;
    const v = new WebContentsView({ webPreferences: { preload: deps.uiPreloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false } });
    v.setBackgroundColor('#00000000');
    v.setVisible(false);
    v.webContents.on('will-navigate', (e) => e.preventDefault());
    v.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    if (process.env.ELECTRON_RENDERER_URL) void v.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}#meeting-bar`);
    else void v.webContents.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'meeting-bar' });
    win.contentView.addChildView(v);
    view = v;
    return v;
  }

  return {
    /** Shows the bar at `bounds` (above every other view), or hides it (null). */
    place(bounds: Electron.Rectangle | null): void {
      if (!bounds) {
        if (view && !view.webContents.isDestroyed()) view.setVisible(false);
        return;
      }
      const v = ensure();
      win.contentView.addChildView(v); // back on top
      v.setBounds(bounds);
      v.setVisible(true);
    },
    webContents: (): WebContents | null => (view && !view.webContents.isDestroyed() ? view.webContents : null),
  };
}
export type MeetingOverlay = ReturnType<typeof createMeetingOverlay>;
