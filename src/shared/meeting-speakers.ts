import type { Segment } from './meeting';

/** What a meeting page showed at one moment (ms since the meeting started). */
export interface ProbeSample {
  at: number;
  speaking: string[];
  /** The user's own mic as the page shows it; null when it can't be read. */
  muted: boolean | null;
}

/** How long one sample stands for (the page is read once a second). */
const SAMPLE_MS = 1000;

/** A participant's name as shown, made safe: one line, no "(You)" or "(Presenting)", 80 characters at most. */
export function cleanName(raw: string): string | null {
  const one = raw
    .replace(/\s+/g, ' ')
    .replace(/\((you|presenting|host|guest|você|tu)\)/gi, '')
    .trim();
  return one ? one.slice(0, 80) : null;
}

/**
 * The speaker of a finished piece of text: the microphone is "me"; the call is whoever the page
 * marked speaking for at least half of it, else "others".
 */
export function assignSpeakers(ch: 'me' | 'call', seg: { start: number; end: number; text: string }, samples: ProbeSample[]): Segment {
  if (ch === 'me') return { ...seg, speaker: 'me' };
  const length = Math.max(1, seg.end - seg.start);
  const share = new Map<string, number>();
  for (const sm of samples) {
    const overlap = Math.min(seg.end, sm.at + SAMPLE_MS) - Math.max(seg.start, sm.at);
    if (overlap <= 0) continue;
    for (const name of sm.speaking) share.set(name, (share.get(name) ?? 0) + overlap);
  }
  let best: [string, number] | null = null;
  for (const e of share) if (!best || e[1] > best[1]) best = e;
  return { ...seg, speaker: best && best[1] >= length / 2 ? best[0] : 'others' };
}

/** Whether the page showed the user muted at `at` (unknown counts as not muted). */
export function mutedAt(samples: ProbeSample[], at: number): boolean {
  let last: ProbeSample | null = null;
  for (const s of samples) if (s.at <= at && (!last || s.at >= last.at)) last = s;
  return last?.muted === true;
}
