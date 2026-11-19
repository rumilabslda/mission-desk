import { vi } from 'vitest';

const views: { hash: string; visible: boolean; bounds: unknown }[] = [];
vi.mock('electron', () => {
  class WebContentsView {
    rec = { hash: '', visible: true, bounds: null as unknown };
    webContents = {
      on: () => undefined,
      once: () => undefined,
      setWindowOpenHandler: () => undefined,
      loadURL: async (url: string) => void (this.rec.hash = url.split('#')[1] ?? ''),
      loadFile: async (_f: string, o: { hash: string }) => void (this.rec.hash = o.hash),
      isLoading: () => false,
      isDestroyed: () => false,
      isFocused: () => false,
      focus: () => undefined,
    };
    constructor() {
      views.push(this.rec);
    }
    setBackgroundColor(): void {}
    setVisible(v: boolean): void {
      this.rec.visible = v;
    }
    setBounds(b: unknown): void {
      this.rec.bounds = b;
    }
  }
  return { WebContentsView, screen: { getCursorScreenPoint: () => ({ x: 0, y: 0 }) } };
});

test('the floating button shows as soon as the window opens (not only after a resize)', async () => {
  const { createAssistantOverlay } = await import('../src/main/views/assistant-overlay');
  const win = {
    contentView: { addChildView: () => undefined },
    getContentBounds: () => ({ x: 0, y: 0, width: 1400, height: 840 }),
    isDestroyed: () => false,
    webContents: { focus: () => undefined },
  };
  createAssistantOverlay(win as never, { uiPreloadPath: '/p', buttonVisible: () => true, width: () => 400, height: () => 680, setSize: () => undefined, focusBack: () => undefined, place: () => undefined, setPlace: () => undefined });
  expect(views[0].visible).toBe(true);
  expect(views[0].bounds).toMatchObject({ width: 52, height: 52 });
});
