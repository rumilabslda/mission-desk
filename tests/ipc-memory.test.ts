import { vi } from 'vitest';

const handlers = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
vi.mock('electron', () => ({
  ipcMain: {
    on: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
    handle: (ch: string, fn: (e: unknown, ...a: unknown[]) => unknown) => handlers.set(ch, fn),
  },
}));

test('the memory opens only for a real scope, and only from Mission Desk’s own pages', async () => {
  const { registerIpc } = await import('../src/main/ipc');
  const { IPC } = await import('../src/shared/ipc');
  const opened: unknown[] = [];
  const panel = { id: 'assistant-panel' };
  const controller = new Proxy(
    { assistantWebContents: () => [panel], meetingBarWebContents: () => null, spacePanelWebContents: () => null, quickWebContents: () => null, openMemory: (s: string) => opened.push(s) },
    { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => null) },
  );
  registerIpc({ webContents: { id: 'main' } } as never, controller as never);
  const send = (sender: unknown, scope: unknown) => handlers.get(IPC.openMemory)!({ sender }, scope);
  send(panel, 'space:abc');
  send(panel, 'nospace');
  send(panel, '../x');
  send(panel, 42);
  send({ id: 'some web page' }, 'space:abc');
  expect(opened).toEqual(['space:abc', 'nospace']);
});
