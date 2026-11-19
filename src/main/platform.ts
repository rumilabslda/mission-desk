import path from 'node:path';

/**
 * How to ask the system where a command-line tool is: the user's own login shell on macOS and
 * Linux (it knows their PATH), "where" on Windows.
 */
export function cliLookup(name: string, platform: NodeJS.Platform, shell: string | undefined): { cmd: string; args: string[] } {
  if (platform === 'win32') return { cmd: 'where', args: [name] };
  const sh = shell && path.isAbsolute(shell) ? shell : '/bin/sh';
  // zsh and bash read the user's PATH from an interactive login shell; plain sh only from a login one.
  return { cmd: sh, args: [/(zsh|bash)$/.test(sh) ? '-ilc' : '-lc', `command -v ${name}`] };
}

/** Where Claude Code is usually installed. */
export function claudeCandidates(home: string, platform: NodeJS.Platform): string[] {
  if (platform === 'win32') return [path.win32.join(home, '.local', 'bin', 'claude.exe')];
  return [
    path.join(home, '.local/bin/claude'),
    path.join(home, '.claude/local/claude'),
    ...(platform === 'darwin' ? ['/opt/homebrew/bin/claude'] : []),
    '/usr/local/bin/claude',
    ...(platform === 'linux' ? ['/usr/bin/claude'] : []),
  ];
}

/** Where the Codex CLI is usually installed. */
export function codexCandidates(home: string, platform: NodeJS.Platform): string[] {
  if (platform === 'win32') return [];
  return [
    path.join(home, '.local/bin/codex'),
    ...(platform === 'darwin' ? ['/opt/homebrew/bin/codex'] : []),
    '/usr/local/bin/codex',
    path.join(home, '.npm-global/bin/codex'),
    path.join(home, '.volta/bin/codex'),
  ];
}

/** The path a lookup printed: the shell's last line (login messages come first), or Windows' first match. */
export function lookupResult(out: string, platform: NodeJS.Platform): string | null {
  const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return (platform === 'win32' ? lines[0] : lines[lines.length - 1]) ?? null;
}
