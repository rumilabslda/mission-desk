import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { ToolDef } from './openrouter-session';

/** Up to 10 minutes: a tool may be waiting for the user (the create-event confirmation). */
const TOOL_TIMEOUT_MS = 600_000;

export interface InProcessTools {
  defs: ToolDef[];
  call(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<{ text: string; isError: boolean }>;
}

/** Mission Desk's MCP tools, used inside the app (for engines Mission Desk drives itself, like OpenRouter). */
export async function inProcessTools(server: McpServer): Promise<InProcessTools> {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await server.connect(serverT);
  const client = new Client({ name: 'missiondesk-assistant', version: '1.0.0' });
  await client.connect(clientT);
  const { tools } = await client.listTools();
  return {
    defs: tools.map((x) => ({ name: x.name, description: x.description, inputSchema: x.inputSchema as Record<string, unknown> })),
    async call(name, args, signal) {
      const r = (await client.callTool({ name, arguments: args }, undefined, { signal, timeout: TOOL_TIMEOUT_MS })) as { content?: { type: string; text?: string }[]; isError?: boolean };
      const text = (r.content ?? []).map((c) => (c.type === 'text' ? (c.text ?? '') : c.type === 'image' ? '[screenshot taken]' : '')).join('\n');
      return { text: text || '(no output)', isError: r.isError === true };
    },
  };
}
