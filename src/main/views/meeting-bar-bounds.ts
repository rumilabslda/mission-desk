/** Where the transcription bar sits over the meeting view: top-centred, 560 px wide at most, one or two lines. */
export function meetingBarBounds(view: { x: number; y: number; width: number; height: number }, lines: 1 | 2 = 1): { x: number; y: number; width: number; height: number } {
  const width = Math.max(0, Math.min(560, view.width - 16));
  return { x: view.x + Math.round((view.width - width) / 2), y: view.y + 8, width, height: lines === 2 ? 60 : 36 };
}
