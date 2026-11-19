// Is the user's Claude Code ready for the assistant? Reads only what `claude --version` and
// `claude auth status` print (the sign-in state), never Claude Code's credentials.

import type { ClaudeStatus } from '../../shared/assistant';
export type { ClaudeStatus };

export function parseAuthStatus(out: string): boolean | null {
  try {
    const v = JSON.parse(out) as { loggedIn?: unknown };
    return typeof v.loggedIn === 'boolean' ? v.loggedIn : null;
  } catch {
    return null;
  }
}

export function parseVersion(out: string): string | undefined {
  return /^(\d+\.\d+\.\d+)/.exec(out.trim())?.[1];
}

export async function checkClaude(io: {
  find(): Promise<string | null>;
  run(cmd: string, args: string[]): Promise<string>;
}): Promise<ClaudeStatus> {
  const cmd = await io.find();
  if (!cmd) return { state: 'not-installed' };
  const version = parseVersion(await io.run(cmd, ['--version']).catch(() => ''));
  const signedIn = parseAuthStatus(await io.run(cmd, ['auth', 'status']).catch(() => ''));
  if (!version && signedIn === null) return { state: 'not-installed' }; // found, but it doesn't run
  return { state: signedIn === false ? 'signed-out' : 'ready', ...(version ? { version } : {}) };
}

/** A command's output, also when it exits with an error code (`auth status` exits 1 when signed out). */
export function outputOf(err: Error | null, stdout: string): string {
  if (stdout.trim()) return stdout;
  if (err) throw err;
  return stdout;
}
