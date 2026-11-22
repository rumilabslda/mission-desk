import { EventEmitter } from 'node:events';
import { createTranscriber } from '../src/main/meetings/transcriber';

/** A fake md-transcriber process: records stdin lines, lets the test write stdout and exit. */
class FakeChild extends EventEmitter {
  lines: Record<string, unknown>[] = [];
  out = new EventEmitter();
  err = new EventEmitter();
  killed = false;
  stdin = {
    write: (s: string) => {
      for (const l of s.split('\n').filter(Boolean)) this.lines.push(JSON.parse(l));
      return true;
    },
    end: () => {},
  };
  stdout = { on: (ev: 'data', cb: (b: Buffer) => void) => this.out.on(ev, cb) };
  stderr = { on: (ev: 'data', cb: (b: Buffer) => void) => this.err.on(ev, cb) };
  kill() {
    this.killed = true;
  }
  say(raw: string) {
    this.out.emit('data', Buffer.from(raw));
  }
  types() {
    return this.lines.map((l) => l.type);
  }
}

let now = 0;
let children: FakeChild[];
const make = () => {
  children = [];
  return createTranscriber({
    spawn: () => {
      const c = new FakeChild();
      children.push(c);
      return c;
    },
    now: () => now,
  });
};
const flush = () => new Promise((r) => setTimeout(r, 0));
const pcm = (n: number) => new Int16Array(n).fill(1);

beforeEach(() => {
  now = 0;
});

test('reassembles lines split across chunks', async () => {
  const t = make();
  const segs: unknown[] = [];
  t.onSegment((ch, s) => segs.push([ch, s.text]));
  const started = t.start({ engine: 'apple', locale: 'pt-PT', modelDir: null });
  children[0].say('{"type":"rea');
  children[0].say('dy"}\n{"type":"segment","ch":"me","start":0,"end":900,"te');
  children[0].say('xt":"Olá"}\n');
  await started;
  expect(segs).toEqual([['me', 'Olá']]);
  expect(children[0].lines[0]).toEqual({ type: 'start', engine: 'apple', locale: 'pt-PT', modelDir: null });
});

test('a failed start rejects with the helper’s error code', async () => {
  const t = make();
  const started = t.start({ engine: 'apple', locale: 'xx-XX', modelDir: null });
  children[0].say('{"type":"error","code":"localeMissing","message":"no"}\n');
  await expect(started).rejects.toMatchObject({ code: 'localeMissing' });
});

test('audio before ready is buffered (5 s per channel at most) and sent once ready', async () => {
  const t = make();
  const started = t.start({ engine: 'apple', locale: 'en-US', modelDir: null });
  for (let i = 0; i < 60; i++) t.feed('call', pcm(1600)); // 6 s
  expect(children[0].types()).toEqual(['start']);
  children[0].say('{"type":"ready"}\n');
  await started;
  const audio = children[0].lines.filter((l) => l.type === 'audio');
  expect(audio).toHaveLength(50); // the oldest second was dropped
  expect(audio[0]).toMatchObject({ ch: 'call' });
  expect(Buffer.from(audio[0].pcm as string, 'base64')).toHaveLength(3200);
});

test('a crash mid-meeting restarts the helper, marks the gap and keeps times going', async () => {
  const t = make();
  const segs: [string, number, number][] = [];
  const gaps: { start: number; end: number }[] = [];
  t.onSegment((ch, s) => segs.push([ch, s.start, s.end]));
  t.onGap((g) => gaps.push(g));
  const started = t.start({ engine: 'apple', locale: 'en-US', modelDir: null });
  children[0].say('{"type":"ready"}\n');
  await started;
  for (let i = 0; i < 100; i++) t.feed('me', pcm(1600)); // 10 s sent
  children[0].say('{"type":"segment","ch":"me","start":0,"end":7000,"text":"a"}\n');
  children[0].emit('exit', 1);
  await flush();
  expect(children).toHaveLength(2);
  expect(children[1].lines[0]).toMatchObject({ type: 'start', engine: 'apple', locale: 'en-US' });
  children[1].say('{"type":"ready"}\n');
  await flush();
  children[1].say('{"type":"segment","ch":"me","start":500,"end":1500,"text":"b"}\n');
  expect(gaps).toEqual([{ start: 7000, end: 10000 }]);
  expect(segs).toEqual([
    ['me', 0, 7000],
    ['me', 10500, 11500],
  ]);
});

test('more than 3 crashes in a minute gives up with an error', async () => {
  const t = make();
  const errors: string[] = [];
  t.onError((code) => errors.push(code));
  const started = t.start({ engine: 'apple', locale: 'en-US', modelDir: null });
  children[0].say('{"type":"ready"}\n');
  await started;
  for (let i = 0; i < 4; i++) {
    now += 1000;
    children[children.length - 1].emit('exit', 1);
    await flush();
  }
  expect(children).toHaveLength(4);
  expect(errors).toEqual(['internal']);
});

test('finish waits for the helper to flush', async () => {
  const t = make();
  const started = t.start({ engine: 'apple', locale: 'en-US', modelDir: null });
  children[0].say('{"type":"ready"}\n');
  await started;
  let done = false;
  const f = t.finish().then(() => (done = true));
  await flush();
  expect(done).toBe(false);
  children[0].say('{"type":"finished"}\n');
  await f;
  expect(done).toBe(true);
});

test('capabilities and locale installs answer through the helper', async () => {
  const t = make();
  const caps = t.capabilities();
  children[0].say('{"type":"capabilities","engines":[{"id":"apple","available":true,"reason":null}],"apple":{"supported":["pt-PT"],"installed":[]}}\n');
  expect(await caps).toEqual({ engines: [{ id: 'apple', available: true, reason: null }], apple: { supported: ['pt-PT'], installed: [] } });
  const progress: number[] = [];
  const inst = t.installLocale('pt-PT', (f) => progress.push(f));
  children[0].say('{"type":"localeProgress","locale":"pt-PT","fraction":0.5}\n{"type":"localeInstalled","locale":"pt-PT"}\n');
  await inst;
  expect(progress).toEqual([0.5]);
});
