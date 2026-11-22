import { vi } from 'vitest';

const handlers = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
vi.mock('electron', () => ({
  ipcMain: {
    on: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
    handle: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
  },
}));

test('I2: the transcription bar gets the interface language like Mission Desk’s other pages', async () => {
  const { registerIpc } = await import('../src/main/ipc');
  const { IPC } = await import('../src/shared/ipc');
  const bar = { id: 'bar' };
  const controller = new Proxy(
    { meetingBarWebContents: () => bar, assistantWebContents: () => [], spacePanelWebContents: () => null, quickWebContents: () => null, localeInfo: () => ({ locale: 'pt-PT', format: 'pt-PT', system: 'en' }) },
    { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => null) },
  );
  registerIpc({ webContents: { id: 'main' } } as never, controller as never);
  const e = { sender: bar, returnValue: undefined as unknown };
  handlers.get(IPC.getLocale)!(e);
  expect(e.returnValue).toEqual({ locale: 'pt-PT', format: 'pt-PT', system: 'en' });
  const stranger = { sender: { id: 'page' }, returnValue: undefined as unknown };
  handlers.get(IPC.getLocale)!(stranger);
  expect(stranger.returnValue).toBeNull();
});
