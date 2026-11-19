import type { Account, ClaudeAccess } from '../../shared/types';

export const READ_TOOLS = ['list_accounts', 'read_page', 'get_elements', 'screenshot', 'open_url'] as const;
export const ACT_TOOLS = ['click', 'type', 'press'] as const;
export type ToolName = (typeof READ_TOOLS)[number] | (typeof ACT_TOOLS)[number];

export const isActTool = (tool: ToolName): boolean => (ACT_TOOLS as readonly string[]).includes(tool);

export function allows(access: ClaudeAccess | undefined, tool: ToolName): boolean {
  if (access === 'act') return true;
  if (access === 'read') return !isActTool(tool);
  return false;
}

/** Finds an account Claude may see, by id or by name. Never guesses between two. */
export function findAccount(accounts: Account[], query: string): { account: Account } | { error: string } {
  const visible = accounts.filter((a) => (a.claudeAccess ?? 'off') !== 'off');
  const q = query.trim();
  const byId = visible.find((a) => a.id === q);
  if (byId) return { account: byId };
  const byName = visible.filter((a) => a.name.trim().toLowerCase() === q.toLowerCase());
  if (byName.length === 1) return { account: byName[0] };
  if (byName.length > 1) return { error: `More than one account is called '${q}'; use its id.` };
  return { error: `Account '${q}' not found or Claude access is Off.` };
}
