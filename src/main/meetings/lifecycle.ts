import type { MeetingStore } from './store';

/** The spaces a change would leave with no app (and so remove), given the accounts after it. */
export function spacesLeftEmpty<S extends { id: string }>(spaces: S[], accountsAfter: { spaceId?: string }[]): S[] {
  const used = new Set(accountsAfter.map((a) => a.spaceId).filter(Boolean));
  return spaces.filter((s) => !used.has(s.id));
}

/** Deletes transcripts older than the chosen period (summaries stay). 0 or unset: never. */
export function applyRetention(store: MeetingStore, days: number | undefined): number {
  return days ? store.pruneTranscripts(days) : 0;
}
