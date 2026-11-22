/** Where the transcription bar sits over the meeting view: top-centred, 560 px wide at most, one or two lines. */
export function meetingBarBounds(view: { x: number; y: number; width: number; height: number }, lines: 1 | 2 = 1): { x: number; y: number; width: number; height: number } {
  const width = Math.max(0, Math.min(560, view.width - 16));
  return { x: view.x + Math.round((view.width - width) / 2), y: view.y + 8, width, height: lines === 2 ? 60 : 36 };
}

type View = { accountId: string; kind: string };
/**
 * Which view the bar covers, and what it shows there: the Ask question over the call that asks
 * (a meeting in an Ask space, or a second call), the live controls over the meeting being
 * transcribed. Only a view on screen gets the bar.
 */
export function barTarget<K extends string>(
  live: { accountId: string; kind: K } | null,
  asking: { accountId: string; kind: K; switchTo: boolean } | null,
  visible: (accountId: string, kind: K) => boolean,
): { accountId: string; kind: K; mode: 'ask' | 'live' } | null {
  if (asking && visible(asking.accountId, asking.kind)) return { accountId: asking.accountId, kind: asking.kind, mode: 'ask' };
  if (live && visible(live.accountId, live.kind)) return { accountId: live.accountId, kind: live.kind, mode: 'live' };
  return null;
}
export type { View };
