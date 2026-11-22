import type { AssistantEffort, AssistantEvent } from '../../shared/assistant';
import { t as tr } from '../../shared/i18n';

// OpenAI Codex as an assistant: one `codex exec --json` run per message (`resume` continues the
// thread). Only Mission Desk's tools: Codex's shell and web search are off, it runs read-only in an
// empty folder, and Mission Desk's MCP server is passed with -c (nothing is written to ~/.codex).

/** A TOML basic string (what `-c` expects): JSON escaping, plus DEL, and no lone surrogates. */
const toml = (s: string): string =>
  JSON.stringify(s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD')).replace(/\u007f/g, '\\u007f');

/** Codex's own tools and integrations, all off: only Mission Desk's tools remain (unknown keys are ignored by Codex). */
const FEATURES_OFF = ['shell_tool', 'unified_exec', 'view_image', 'apps', 'plugins', 'hooks', 'computer_use', 'browser_use', 'image_generation', 'multi_agent'];

export function buildCodexArgs(o: {
  cwd: string;
  mcp: { command: string; args: string[]; env: Record<string, string> };
  instructions: string;
  model: string;
  effort: AssistantEffort;
  resume?: string;
}): string[] {
  const env = `{${Object.entries(o.mcp.env)
    .map(([k, v]) => `${k}=${toml(v)}`)
    .join(',')}}`;
  // The whole MCP table is replaced, so no other server the user configured is there.
  const server = `{command=${toml(o.mcp.command)},args=[${o.mcp.args.map(toml).join(',')}],env=${env},required=true,default_tools_approval_mode="approve",tool_timeout_sec=600}`;
  const config = [
    ...FEATURES_OFF.map((f) => `features.${f}=false`),
    'web_search="disabled"',
    'approval_policy="never"',
    `developer_instructions=${toml(o.instructions)}`,
    `mcp_servers={missiondesk=${server}}`,
    `model_reasoning_effort=${toml(o.effort === 'max' || o.effort === 'xhigh' ? 'high' : o.effort)}`,
  ];
  const model = /^[A-Za-z0-9][\w.:-]{0,59}$/.test(o.model) ? o.model : ''; // never something that reads as a flag
  return [
    'exec',
    '--json',
    '--ignore-user-config', // the user's ~/.codex/config.toml (their other servers, hooks, providers) isn't loaded
    '--skip-git-repo-check',
    '--cd',
    o.cwd,
    '--sandbox',
    'read-only',
    ...(model ? ['-m', model] : []),
    ...config.flatMap((c) => ['-c', c]),
    ...(o.resume ? ['resume', o.resume] : []),
    '-', // the message comes on stdin (never in the process list)
  ];
}

type Item = { id?: string; type?: string; text?: string; tool?: string; arguments?: unknown; status?: string; command?: string };

const SIGNED_OUT = /not logged in|please log in|log in again|codex login|unauthori[sz]ed|\b401\b/i;

/**
 * Codex started something other than Mission Desk's tools (a shell command, a file change, a web
 * search, another MCP server, an unknown tool): the message saying so, so the run is stopped at once.
 */
export function forbiddenItem(raw: string): string | null {
  let e: { type?: string; item?: { type?: string; server?: string; tool?: string; command?: string } };
  try {
    e = JSON.parse(raw);
  } catch {
    return null;
  }
  if (e.type !== 'item.started' && e.type !== 'item.updated' && e.type !== 'item.completed') return null;
  const t = e.item?.type;
  if (!t || t === 'agent_message' || t === 'reasoning' || t === 'todo_list' || t === 'error') return null;
  if (t === 'mcp_tool_call') {
    if (e.item?.server === 'missiondesk') return null;
    return e.item?.server ? tr('assistant.error.codexForbiddenServer', { server: e.item.server }) : tr('assistant.error.codexForbiddenOtherServer');
  }
  if (t === 'command_execution') return tr('assistant.error.codexForbiddenCommand');
  return tr('assistant.error.codexForbiddenBuiltIn', { tool: t });
}

/** One line of `codex exec --json` → what the chat needs. */
export function parseCodexEvent(raw: string): AssistantEvent[] {
  let e: { type?: string; thread_id?: string; item?: Item; error?: { message?: string }; message?: string };
  try {
    e = JSON.parse(raw);
  } catch {
    return [];
  }
  const item = e.item ?? {};
  const id = item.id ?? '';
  switch (e.type) {
    case 'thread.started':
      return e.thread_id ? [{ type: 'init', model: 'Codex', sessionId: e.thread_id }] : [];
    case 'item.started':
      if (item.type === 'mcp_tool_call') return [{ type: 'tool', id, name: item.tool ?? 'tool', input: (item.arguments ?? {}) as Record<string, unknown> }];
      if (item.type === 'command_execution') return [{ type: 'tool', id, name: 'command', input: { command: item.command ?? '' } }];
      return [];
    case 'item.completed':
      if (item.type === 'mcp_tool_call' || item.type === 'command_execution') return [{ type: 'toolDone', id, isError: item.status === 'failed' || item.status === 'declined' }];
      if (item.type === 'agent_message' && item.text) return [{ type: 'text', delta: item.text }];
      return [];
    case 'turn.completed':
      return [{ type: 'done', isError: false }];
    case 'turn.failed': {
      const message = e.error?.message ?? tr('assistant.error.codexCouldNotAnswer');
      return [
        { type: 'done', isError: true, text: message },
        { type: 'error', kind: SIGNED_OUT.test(message) ? 'signed-out' : 'failed', message },
      ];
    }
    case 'error': {
      const message = e.message ?? tr('assistant.error.codexReported');
      return [{ type: 'error', kind: SIGNED_OUT.test(message) ? 'signed-out' : 'failed', message }];
    }
    default:
      return [];
  }
}
