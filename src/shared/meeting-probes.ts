import type { MeetingProviderId } from './meeting';

export interface ProbeResult {
  speaking: string[];
  muted: boolean | null;
}

/**
 * Reads, from a meeting page, who is speaking and whether the user is muted. Each provider's recipe
 * comes from looking at its live call page (plan Task 1, not done yet): until then every probe returns
 * the fallback, so others show as "Others" and the microphone is always transcribed. A recipe must
 * only read the DOM, never change it, and never throw.
 */
const FALLBACK = (): ProbeResult => ({ speaking: [], muted: null });

const PROBES: Record<MeetingProviderId, (doc: Document) => ProbeResult> = {
  meet: FALLBACK,
  teams: FALLBACK,
  zoom: FALLBACK,
};

/** Whether a provider's probe reads anything yet (false: names and mute aren't available). */
export const PROBE_RELIABLE: Record<MeetingProviderId, boolean> = { meet: false, teams: false, zoom: false };

export function probeFor(provider: MeetingProviderId): (doc: Document) => ProbeResult {
  const probe = PROBES[provider];
  return (doc) => {
    try {
      const r = probe(doc);
      return { speaking: r.speaking.slice(0, 20), muted: r.muted };
    } catch {
      return FALLBACK();
    }
  };
}
