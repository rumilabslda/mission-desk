/**
 * Audio frames for the transcription helper: channels mixed to mono, resampled to 16 kHz
 * (linear interpolation; the capture page asks the AudioContext for 16 kHz, so this is a fallback),
 * as Int16.
 */
export function toPcm16(input: Float32Array[], inRate: number): Int16Array {
  const len = input[0]?.length ?? 0;
  const mono = new Float32Array(len);
  for (const ch of input) for (let i = 0; i < len; i++) mono[i] += ch[i] / input.length;
  const ratio = inRate / 16000;
  const outLen = Math.floor(len / ratio);
  const out = new Int16Array(outLen);
  for (let k = 0; k < outLen; k++) {
    const pos = k * ratio;
    const i = Math.floor(pos);
    const frac = pos - i;
    const v = frac === 0 || i + 1 >= len ? mono[i] : mono[i] * (1 - frac) + mono[i + 1] * frac;
    out[k] = Math.max(-1, Math.min(1, v)) * 32767;
  }
  return out;
}
