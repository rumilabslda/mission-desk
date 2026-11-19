import { claudeCandidates } from '../platform';

/** Where Claude Code is usually installed, best first. */
export async function findClaude(io: { exists(p: string): boolean; shell(): Promise<string | null>; home: string; platform?: NodeJS.Platform }): Promise<string | null> {
  const candidates = claudeCandidates(io.home, io.platform ?? process.platform);
  for (const c of candidates) if (io.exists(c)) return c;
  const fromShell = (await io.shell().catch(() => null))?.trim();
  return fromShell ? fromShell : null;
}
