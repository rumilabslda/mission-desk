// @vitest-environment happy-dom
import { expect, test, vi } from 'vitest';

test('I9: a stop while the capture is still starting leaves no stream running', async () => {
  const tracks: { stopped: boolean; stop(): void }[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const mediaDevices = {
    getUserMedia: async () => {
      await gate;
      const t = { stopped: false, stop() { t.stopped = true; } };
      tracks.push(t);
      return { getTracks: () => [t] };
    },
  };
  Object.defineProperty(navigator, 'mediaDevices', { value: mediaDevices, configurable: true });
  class FakeContext {
    sampleRate = 16000;
    destination = {};
    audioWorklet = { addModule: async () => undefined };
    createMediaStreamSource() { return { connect: () => undefined }; }
    createGain() { return { gain: { value: 1 }, connect: (x: unknown) => x }; }
    close = vi.fn(async () => undefined);
  }
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
  (globalThis as unknown as { AudioWorkletNode: unknown }).AudioWorkletNode = class { port = { onmessage: null }; connect(x: unknown) { return x; } };
  let onStart!: (o: { callSourceId: string | null }) => void;
  let onStop!: () => void;
  const states: unknown[] = [];
  (window as unknown as { missiondesk: unknown }).missiondesk = {
    onCaptureStart: (cb: typeof onStart) => (onStart = cb),
    onCaptureStop: (cb: typeof onStop) => (onStop = cb),
    capturePcm: () => undefined,
    captureState: (s: unknown) => states.push(s),
  };
  const { startCapturePage } = await import('../src/renderer/src/meetings/capture');
  startCapturePage();
  onStart({ callSourceId: 'tab-1' });
  await new Promise((r) => setTimeout(r, 0));
  onStop();
  release();
  await new Promise((r) => setTimeout(r, 10));
  expect(tracks.length).toBeGreaterThan(0);
  expect(tracks.every((t) => t.stopped)).toBe(true);
});
