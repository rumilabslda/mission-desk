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

async function barIpc() {
  const { registerIpc } = await import('../src/main/ipc');
  const { IPC } = await import('../src/shared/ipc');
  const bar = { id: 'bar' };
  const calls: unknown[][] = [];
  const record = (name: string) => (...a: unknown[]) => void calls.push([name, ...a]);
  const controller = new Proxy(
    {
      meetingBarWebContents: () => bar,
      assistantWebContents: () => [],
      spacePanelWebContents: () => null,
      quickWebContents: () => null,
      meetingInsightsPause: record('pause'),
      meetingInsightsResume: record('resume'),
      meetingInsightNotUseful: record('notUseful'),
      meetingInsightOpen: record('open'),
      meetingBarHeight: record('height'),
    },
    { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => null) },
  );
  registerIpc({ webContents: { id: 'main' } } as never, controller as never);
  const send = (sender: unknown, ch: string, ...a: unknown[]) => handlers.get(ch)!({ sender }, ...a);
  return { IPC, bar, calls, send };
}

test('insight calls come only from the bar', async () => {
  const { IPC, bar, calls, send } = await barIpc();
  const page = { id: 'page' };
  for (const s of [page, { id: 'main' }]) {
    send(s, IPC.meetingInsightsPause);
    send(s, IPC.meetingInsightNotUseful, 'abc123def456');
    send(s, IPC.meetingBarHeight, 120);
  }
  expect(calls).toEqual([]);
  send(bar, IPC.meetingInsightsPause);
  send(bar, IPC.meetingInsightsResume);
  send(bar, IPC.meetingInsightNotUseful, 'abc123def456');
  send(bar, IPC.meetingInsightOpen, 'abc123def456', 1);
  send(bar, IPC.meetingBarHeight, 120);
  expect(calls).toEqual([['pause'], ['resume'], ['notUseful', 'abc123def456'], ['open', 'abc123def456', 1], ['height', 120]]);
});

test('bad ids, sources and heights are refused', async () => {
  const { IPC, bar, calls, send } = await barIpc();
  send(bar, IPC.meetingInsightNotUseful, '../x');
  send(bar, IPC.meetingInsightOpen, 'abc123def456', 3);
  send(bar, IPC.meetingInsightOpen, 'abc123def456', 1.5);
  send(bar, IPC.meetingBarHeight, 20);
  send(bar, IPC.meetingBarHeight, 401);
  send(bar, IPC.meetingBarHeight, '120');
  expect(calls).toEqual([]);
});
