import path from 'node:path';
import { type BrowserWindow, type WebContents, WebContentsView, screen } from 'electron';
import { type FabPlace, type Rect, chatRect, fabRect, resizeRect, snapFab, FAB } from './assistant-layout';
import { IPC } from '../../shared/ipc';
import type { FabToast } from '../../shared/quick';

/** Room beside the button for its confirmation toast. */
const TOAST_WIDTH = 330;

export interface AssistantOverlay {
  /** Places the button and the chat window (window resized, button shown or hidden). */
  layout(): void;
  /** Puts both above the account pages again (a new page view was added). */
  raise(): void;
  setOpen(open: boolean): void;
  /** Hides both while a dialog of the main UI is open (they would cover it). */
  setSuppressed(suppressed: boolean): void;
  /** The chat window's page, once created. */
  chat(): WebContents | null;
  /** Both pages (they get the UI's snapshot and may call the UI's IPC). */
  webContents(): WebContents[];
  /** The user drags the button: it follows the pointer, then sticks to the nearer side. */
  dragStart(): void;
  dragEnd(): void;
  /** The user drags the chat window's edges: they follow the pointer; the size is kept. */
  resizeStart(edges: ResizeEdges): void;
  resizeEnd(): void;
  /** Where the button is now (window coordinates) and the side it sits on. */
  fab(): { rect: Rect; side: 'left' | 'right' };
  /**
   * A confirmation beside the button (null clears it); "done" and "error" go away by themselves.
   * False when the button isn't on screen to show it (the caller tells the user another way).
   */
  toast(t: FabToast | null): boolean;
}

export type ResizeEdges = { x?: 'left' | 'right'; y?: 'top' | 'bottom' };

/**
 * The assistant floats above the account pages: a round button in the bottom-right corner and,
 * when open, a chat window above it. Account pages are native views over the UI, so each is
 * its own small transparent view loading the UI page (#assistant-fab, #assistant).
 */
export function createAssistantOverlay(
  win: BrowserWindow,
  deps: {
    uiPreloadPath: string;
    buttonVisible(): boolean;
    width(): number;
    height(): number;
    setSize(width: number, height: number): void;
    focusBack(): void;
    place(): FabPlace | undefined;
    setPlace(place: FabPlace): void;
  },
): AssistantOverlay {
  let open = false;
  let suppressed = false;
  let toasting = false;
  let toastTimer: NodeJS.Timeout | undefined;
  const sideNow = (): 'left' | 'right' => (deps.place()?.side === 'left' ? 'left' : 'right');

  function makeView(hash: string): WebContentsView {
    const v = new WebContentsView({
      webPreferences: { preload: deps.uiPreloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    v.setBackgroundColor('#00000000');
    v.setVisible(false);
    v.webContents.on('will-navigate', (e) => e.preventDefault());
    v.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const load = (): void => {
      if (process.env.ELECTRON_RENDERER_URL) void v.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}#${hash}`);
      else void v.webContents.loadFile(path.join(__dirname, '../renderer/index.html'), { hash });
    };
    v.webContents.on('render-process-gone', () => setTimeout(() => !v.webContents.isDestroyed() && load(), 500)); // a crash: load it again
    load();
    win.contentView.addChildView(v);
    return v;
  }

  const fabView = makeView('assistant-fab');
  let chatView: WebContentsView | null = null; // created on first open

  let drag: { timer: NodeJS.Timeout; centre: { x: number; y: number } } | null = null;
  let resizing: { timer: NodeJS.Timeout; edges: ResizeEdges; start: Rect; from: { x: number; y: number }; now: Rect } | null = null;

  /** While resizing: the dragged edges under the pointer. */
  function followResize(): void {
    if (!resizing || !chatView || win.isDestroyed()) return;
    const c = win.getContentBounds();
    const pt = screen.getCursorScreenPoint();
    resizing.now = resizeRect({ width: c.width, height: c.height }, resizing.start, resizing.edges, { dx: pt.x - resizing.from.x, dy: pt.y - resizing.from.y });
    chatView.setBounds(resizing.now);
  }

  function place(fab: { x: number; y: number; width: number; height: number }, side: 'left' | 'right'): void {
    const { width, height } = win.getContentBounds();
    fab.y = Math.max(0, fab.y);
    const showFab = !suppressed && (deps.buttonVisible() || open);
    // With a toast the view widens towards the window's middle; the button stays where it is.
    const wide = toasting && !drag;
    fabView.setBounds(wide ? { ...fab, x: side === 'right' ? fab.x - TOAST_WIDTH : fab.x, width: fab.width + TOAST_WIDTH } : fab);
    fabView.setVisible(showFab);
    if (chatView) {
      if (!resizing) chatView.setBounds(chatRect({ width, height }, fab, side, deps.width(), deps.height()));
      chatView.setVisible(open && !suppressed);
    }
  }

  function layout(): void {
    if (drag) return; // the drag places them
    const { width, height } = win.getContentBounds();
    const saved = deps.place();
    const p = saved && (saved.side === 'left' || saved.side === 'right') && Number.isFinite(saved.y) ? saved : undefined; // a bad saved value: default place
    place(fabRect({ width, height }, p), p?.side ?? 'right');
  }

  /** While dragging: the button's centre under the pointer, inside the window. */
  function follow(): void {
    if (!drag || win.isDestroyed()) return;
    const c = win.getContentBounds();
    const pt = screen.getCursorScreenPoint();
    const x = Math.max(FAB / 2, Math.min(c.width - FAB / 2, pt.x - c.x));
    const y = Math.max(FAB / 2, Math.min(c.height - FAB / 2, pt.y - c.y));
    drag.centre = { x, y };
    const side = snapFab({ width: c.width, height: c.height }, drag.centre).side;
    place({ x: Math.round(x - FAB / 2), y: Math.round(y - FAB / 2), width: FAB, height: FAB }, side);
  }

  function raise(): void {
    // addChildView of a view already in the window moves it to the top.
    if (chatView) win.contentView.addChildView(chatView);
    win.contentView.addChildView(fabView);
  }

  layout(); // place and show the button now, not only after the first resize

  return {
    layout,
    raise,
    setOpen(next) {
      open = next;
      if (open && !chatView) chatView = makeView('assistant');
      raise();
      layout();
      if (open && chatView && !suppressed) {
        const cv = chatView;
        if (cv.webContents.isLoading()) cv.webContents.once('did-finish-load', () => open && !suppressed && cv.webContents.focus());
        cv.webContents.focus();
      } else if (!open) {
        deps.focusBack(); // back to the page the user was in (typing must not go to a hidden view)
      }
    },
    setSuppressed(s) {
      suppressed = s;
      layout();
      // A dialog of the main UI opened: keystrokes must reach it, not the hidden chat.
      if (s && (chatView?.webContents.isFocused() || fabView.webContents.isFocused()) && !win.isDestroyed()) win.webContents.focus();
      if (!s && open && chatView) chatView.webContents.focus();
    },
    fab: () => {
      const r = fabView.getBounds();
      // Without the toast's extra room (the button is FAB wide, at the end towards its side).
      return { rect: { ...r, x: sideNow() === 'right' ? r.x + r.width - FAB : r.x, width: FAB }, side: sideNow() };
    },
    toast(t) {
      clearTimeout(toastTimer);
      const shown = !!t && !suppressed && (deps.buttonVisible() || open) && !fabView.webContents.isDestroyed();
      if (shown) {
        // The page first (so the button keeps its place), then the wider view.
        fabView.webContents.send(IPC.fabToast, { ...t, side: sideNow() });
        toasting = true;
        layout();
        toastTimer = setTimeout(() => this.toast(null), t.state === 'busy' ? 30_000 : t.state === 'error' ? 6000 : 4000);
      } else if (toasting) {
        // The narrower view first, then the page.
        toasting = false;
        layout();
        if (!fabView.webContents.isDestroyed()) fabView.webContents.send(IPC.fabToast, null);
      }
      return shown;
    },
    chat: () => (chatView && !chatView.webContents.isDestroyed() ? chatView.webContents : null),
    webContents: () => [fabView.webContents, ...(chatView ? [chatView.webContents] : [])].filter((w) => !w.isDestroyed()),
    resizeStart(edges) {
      if (resizing || !chatView) return;
      const start = chatView.getBounds();
      const mine = { timer: setInterval(followResize, 16), edges, start, from: screen.getCursorScreenPoint(), now: start };
      resizing = mine;
      setTimeout(() => resizing === mine && this.resizeEnd(), 60_000); // never stuck following the pointer
    },
    resizeEnd() {
      if (!resizing) return;
      clearInterval(resizing.timer);
      followResize();
      const { width, height } = resizing.now;
      resizing = null;
      deps.setSize(width, height);
      layout();
    },
    dragStart() {
      if (drag) return;
      const mine = { timer: setInterval(follow, 16), centre: { x: 0, y: 0 } };
      drag = mine;
      setTimeout(() => drag === mine && this.dragEnd(), 60_000); // never stuck following the pointer
    },
    dragEnd() {
      if (!drag) return;
      clearInterval(drag.timer);
      follow();
      const { width, height } = win.getContentBounds();
      const landed = snapFab({ width, height }, drag.centre);
      drag = null;
      deps.setPlace(landed);
      layout();
    },
  };
}
