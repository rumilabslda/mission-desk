import { BrowserWindow, type WebContents } from 'electron';
import path from 'node:path';

import { CAPTURE_IPC } from '../../shared/capture-ipc';

export { CAPTURE_IPC };

export interface CaptureState {
  me: boolean;
  call: boolean;
  error?: string;
}
interface Page {
  webContents: WebContents;
  destroy(): void;
}

/** The hidden page that records: Mission Desk's own UI page at #capture, never shown. */
export function capturePage(uiPreloadPath: string): Page {
  const w = new BrowserWindow({
    show: false,
    width: 10,
    height: 10,
    webPreferences: { preload: uiPreloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false },
  });
  w.webContents.on('will-navigate', (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (process.env.ELECTRON_RENDERER_URL) void w.loadURL(`${process.env.ELECTRON_RENDERER_URL}#capture`);
  else void w.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'capture' });
  return { webContents: w.webContents, destroy: () => w.destroy() };
}

/**
 * Records a meeting: the meeting view's own audio (a tab capture of that view only) and the
 * microphone, as 16 kHz PCM from the capture page. Nothing is written to disk here.
 */
export function createCaptureHost(deps: { createPage(): Page; onPcm(ch: 'me' | 'call', pcm: Int16Array): void; onState(s: CaptureState): void }) {
  let page: Page | null = null;

  function ensure(): Page {
    if (page && !page.webContents.isDestroyed()) return page;
    page = deps.createPage();
    return page;
  }

  const isCapturePage = (wc: WebContents): boolean => !!page && !page.webContents.isDestroyed() && wc === page.webContents;

  return {
    isCapturePage,
    /** Starts recording `source` (the meeting view) and the microphone. */
    async start(source: WebContents): Promise<void> {
      const p = ensure();
      if (p.webContents.isLoading()) await new Promise<void>((r) => p.webContents.once('did-finish-load', () => r()));
      const callSourceId = source.isDestroyed() ? null : source.getMediaSourceId(p.webContents);
      p.webContents.send(CAPTURE_IPC.start, { callSourceId });
    },
    stop(): void {
      if (page && !page.webContents.isDestroyed()) page.webContents.send(CAPTURE_IPC.stop);
    },
    receivePcm(sender: WebContents, ch: unknown, pcm: unknown): void {
      if (!isCapturePage(sender) || (ch !== 'me' && ch !== 'call')) return;
      const data = pcm instanceof Int16Array ? pcm : pcm instanceof Uint8Array && pcm.byteLength % 2 === 0 ? new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 2) : null;
      if (data && data.length <= 16_000) deps.onPcm(ch, data);
    },
    receiveState(sender: WebContents, s: unknown): void {
      if (!isCapturePage(sender) || typeof s !== 'object' || s === null) return;
      const o = s as Record<string, unknown>;
      deps.onState({ me: o.me === true, call: o.call === true, ...(typeof o.error === 'string' ? { error: o.error.slice(0, 200) } : {}) });
    },
    close(): void {
      page?.destroy();
      page = null;
    },
  };
}
export type CaptureHost = ReturnType<typeof createCaptureHost>;
