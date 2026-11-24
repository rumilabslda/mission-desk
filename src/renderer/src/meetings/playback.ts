/**
 * A tab capture takes the meeting view's sound away from the speakers for as long as it records
 * (Chromium diverts a captured tab's audio into the capture). Plays the call back on its own
 * context at the device's rate, so the other side stays audible at full quality; the 16 kHz
 * context is only for transcription. The microphone is never played back.
 */
export function playBack(ctx: Pick<AudioContext, 'createMediaStreamSource' | 'destination'>, stream: MediaStream): void {
  ctx.createMediaStreamSource(stream).connect(ctx.destination);
}
