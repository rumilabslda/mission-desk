import { EventEmitter } from 'node:events';
import { toPcm16 } from '../src/renderer/src/meetings/pcm';
import { playBack } from '../src/renderer/src/meetings/playback';
import { createCaptureHost } from '../src/main/meetings/capture-host';

test('two 48 kHz channels become 16 kHz mono Int16 at the same level', () => {
  const n = 4800; // 100 ms
  const sine = new Float32Array(n).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 1000 * i) / 48000));
  const out = toPcm16([sine, sine], 48000);
  expect(out).toBeInstanceOf(Int16Array);
  expect(out.length).toBe(n / 3);
  const peak = Math.max(...out);
  expect(Math.abs(peak - 0.5 * 32767) / (0.5 * 32767)).toBeLessThan(0.01);
});

test('16 kHz input is only converted; samples are clipped to Int16', () => {
  const out = toPcm16([new Float32Array([0, 1, -1, 2, -2])], 16000);
  expect([...out]).toEqual([0, 32767, -32767, 32767, -32767]);
});

class FakeWC extends EventEmitter {
  sent: [string, ...unknown[]][] = [];
  destroyed = false;
  send(ch: string, ...args: unknown[]) {
    this.sent.push([ch, ...args]);
  }
  isDestroyed() {
    return this.destroyed;
  }
  isLoading() {
    return false;
  }
}

function setup() {
  const page = new FakeWC();
  const pcm: [string, number][] = [];
  const states: unknown[] = [];
  const host = createCaptureHost({
    createPage: () => ({ webContents: page as never, destroy: () => (page.destroyed = true) }),
    onPcm: (ch, data) => pcm.push([ch, data.length]),
    onState: (s) => states.push(s),
  });
  return { host, page, pcm, states };
}

test('only the capture page may send audio', async () => {
  const { host, page, pcm } = setup();
  const source = { getMediaSourceId: () => 'tab-source-1', isDestroyed: () => false };
  await host.start(source as never);
  expect(page.sent).toEqual([['capture:start', { callSourceId: 'tab-source-1' }]]);
  host.receivePcm(page as never, 'me', new Int16Array(1600));
  host.receivePcm(new FakeWC() as never, 'me', new Int16Array(1600));
  host.receivePcm(page as never, 'nope' as never, new Int16Array(1600));
  expect(pcm).toEqual([['me', 1600]]);
  expect(host.isCapturePage(page as never)).toBe(true);
});

test('the page’s state is passed on, and stop tells the page', async () => {
  const { host, page, states } = setup();
  await host.start({ getMediaSourceId: () => 'x', isDestroyed: () => false } as never);
  host.receiveState(page as never, { me: true, call: false, error: 'tab capture failed' });
  expect(states).toEqual([{ me: true, call: false, error: 'tab capture failed' }]);
  host.stop();
  expect(page.sent.at(-1)).toEqual(['capture:stop']);
});

test('the captured call is played back to the speakers, since tab capture takes it off them', () => {
  const destination = { id: 'speakers' };
  const connected: unknown[] = [];
  const stream = { id: 'call' } as unknown as MediaStream;
  let from: unknown = null;
  const ctx = {
    destination,
    createMediaStreamSource: (s: MediaStream) => {
      from = s;
      return { connect: (to: unknown) => connected.push(to) };
    },
  };
  playBack(ctx as never, stream);
  expect(from).toBe(stream);
  expect(connected).toEqual([destination]);
});
