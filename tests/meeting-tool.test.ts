import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assistantTools, type AssistantToolHost } from '../src/main/assistant/tools';
import { meetingsHost } from '../src/main/meetings/assistant-host';
import { createMeetingStore } from '../src/main/meetings/store';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-mtool-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function setup() {
  const store = createMeetingStore(dir);
  const base = { accountId: 'g1', provider: 'meet' as const, url: 'u', language: 'pt-PT', engine: 'apple' as const };
  const a = store.create({ ...base, scope: 'space:a', title: 'Acme pricing', startedAt: '2026-11-20T10:00:00.000Z' });
  store.append('space:a', a.id, [{ start: 0, end: 1000, speaker: 'Maria', text: 'Fica 10% abaixo.' }]);
  store.update('space:a', a.id, { endedAt: '2026-11-20T10:30:00.000Z', result: { summary: { decisions: ['10% discount'], points: [], nextSteps: [] } } });
  const b = store.create({ ...base, scope: 'space:b', title: 'Beta secret', startedAt: '2026-11-21T10:00:00.000Z' });
  store.update('space:b', b.id, { endedAt: '2026-11-21T10:30:00.000Z' });
  const n = store.create({ ...base, scope: 'nospace', title: 'Loose call', startedAt: '2026-11-22T10:00:00.000Z' });
  store.update('nospace', n.id, { endedAt: '2026-11-22T10:20:00.000Z' });
  const tool = (scope: string) => assistantTools({ ...meetingsHost(store, scope) } as unknown as AssistantToolHost).find((t) => t.name === 'meetings')!;
  return { a, b, n, tool };
}
type Tool = ReturnType<typeof assistantTools>[number];
const run = async (tool: Tool, args: Record<string, unknown>) => ((await tool.run(args as never, undefined as never)) as { text: string }).text;

test('a space’s assistant lists and reads only its own meetings', async () => {
  const { a, b, tool } = setup();
  const list = await run(tool('space:a'), {});
  expect(list).toContain('Acme pricing');
  expect(list).toContain(a.id);
  expect(list).not.toContain('Beta secret');
  expect(await run(tool('space:a'), { id: a.id })).toContain('10% discount');
  expect(await run(tool('space:a'), { id: a.id, part: 'transcript' })).toContain('[00:00] Maria: Fica 10% abaixo.');
  expect(await run(tool('space:a'), { id: b.id })).not.toContain('Beta');
});

test('"All spaces" sees only the meetings outside spaces', async () => {
  const { tool } = setup();
  const list = await run(tool('all'), {});
  expect(list).toContain('Loose call');
  expect(list).not.toContain('Acme pricing');
  expect(list).not.toContain('Beta secret');
});

test('a very long transcript is cut, and says so', async () => {
  const store = createMeetingStore(dir);
  const m = store.create({ scope: 'space:a', accountId: 'g1', provider: 'meet', url: 'u', title: 'Long', startedAt: '2026-11-20T10:00:00.000Z', language: 'en-US', engine: 'apple' });
  store.append('space:a', m.id, Array.from({ length: 3000 }, (_, i) => ({ start: i * 1000, end: i * 1000 + 900, speaker: 'others', text: 'x'.repeat(100) })));
  const tool = assistantTools({ ...meetingsHost(store, 'space:a') } as unknown as AssistantToolHost).find((t) => t.name === 'meetings')!;
  const text = await run(tool, { id: m.id, part: 'transcript' });
  expect(text.length).toBeLessThanOrEqual(200_200);
  expect(text).toMatch(/cut/i);
});
