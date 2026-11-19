import { buildMcpServer } from '../src/main/claude/server';
import { inProcessTools } from '../src/main/assistant/inprocess-tools';

test("Mission Desk's tools, used in the app: JSON schemas for the model, calls reach the space's session", async () => {
  const calls: string[] = [];
  const tools = await inProcessTools(
    buildMcpServer(async (tool) => {
      calls.push(tool);
      return { text: 'Acme (google)' };
    }),
  );
  const list = tools.defs.find((d) => d.name === 'list_accounts');
  expect(list?.inputSchema).toMatchObject({ type: 'object' });
  expect(tools.defs.length).toBeGreaterThanOrEqual(8);
  const r = await tools.call('list_accounts', {}, new AbortController().signal);
  expect(calls).toEqual(['list_accounts']);
  expect(r).toEqual({ text: 'Acme (google)', isError: false });
});
