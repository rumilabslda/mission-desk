import { toPcm16 } from './pcm';

/**
 * The hidden capture page (#capture): records the meeting tab and the microphone while main asks,
 * and streams 100 ms Int16 frames to main. Never plays anything back; nothing is stored.
 */
const RATE = 16000;
const FRAME = RATE / 10;

interface Running {
  ctx: AudioContext;
  streams: MediaStream[];
}
let running: Running | null = null;

async function channel(ctx: AudioContext, stream: MediaStream, ch: 'me' | 'call'): Promise<void> {
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'pcm-forward');
  let pending: Float32Array[] = [];
  let count = 0;
  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    pending.push(e.data);
    count += e.data.length;
    if (count < FRAME) return;
    const all = new Float32Array(count);
    let o = 0;
    for (const p of pending) {
      all.set(p, o);
      o += p.length;
    }
    pending = [];
    count = 0;
    window.missiondesk.capturePcm(ch, toPcm16([all], ctx.sampleRate));
  };
  src.connect(node);
  // A worklet only runs when connected to the graph's output; a muted gain keeps the page silent.
  const mute = ctx.createGain();
  mute.gain.value = 0;
  node.connect(mute).connect(ctx.destination);
}

async function start(callSourceId: string | null): Promise<void> {
  stop();
  const ctx = new AudioContext({ sampleRate: RATE });
  await ctx.audioWorklet.addModule('pcm-worklet.js');
  const streams: MediaStream[] = [];
  const state = { me: false, call: false, error: undefined as string | undefined };
  if (callSourceId) {
    try {
      const call = await navigator.mediaDevices.getUserMedia({
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: callSourceId } } as unknown as MediaTrackConstraints,
        video: false,
      });
      streams.push(call);
      await channel(ctx, call, 'call');
      state.call = true;
    } catch (e) {
      state.error = `call: ${(e as Error).message}`;
    }
  }
  try {
    const me = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    streams.push(me);
    await channel(ctx, me, 'me');
    state.me = true;
  } catch (e) {
    state.error = `${state.error ? `${state.error}; ` : ''}me: ${(e as Error).message}`;
  }
  running = { ctx, streams };
  window.missiondesk.captureState(state);
}

function stop(): void {
  if (!running) return;
  for (const s of running.streams) for (const t of s.getTracks()) t.stop();
  void running.ctx.close();
  running = null;
}

export function startCapturePage(): void {
  window.missiondesk.onCaptureStart(({ callSourceId }) => void start(callSourceId));
  window.missiondesk.onCaptureStop(stop);
}
