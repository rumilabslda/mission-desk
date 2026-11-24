import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOrchestrator } from '../src/main/meetings/orchestrator';
import { createMeetingStore } from '../src/main/meetings/store';
import type { EngineId, SpaceMeetingSettings } from '../src/shared/meeting';

type Seg = { start: number; end: number; text: string };

function fakeTranscriber() {
  const segCbs: ((ch: 'me' | 'call', s: Seg) => void)[] = [];
  const errCbs: ((code: string, m: string) => void)[] = [];
  const t = {
    starts: [] as { engine: EngineId; locale: string; modelDir: string | null }[],
    fed: [] as ['me' | 'call', Int16Array][],
    finishes: 0,
    failStartWith: null as string | null,
    async start(o: { engine: EngineId; locale: string; modelDir: string | null }) {
      t.starts.push(o);
      if (t.failStartWith) {
        const code = t.failStartWith;
        t.failStartWith = null;
        throw Object.assign(new Error(code), { code });
      }
    },
    feed(ch: 'me' | 'call', pcm: Int16Array) {
      t.fed.push([ch, pcm]);
    },
    async finish() {
      t.finishes += 1;
    },
    onSegment(cb: (ch: 'me' | 'call', s: Seg) => void) {
      segCbs.push(cb);
      return () => {};
    },
    onGap() {
      return () => {};
    },
    onError(cb: (code: string, m: string) => void) {
      errCbs.push(cb);
      return () => {};
    },
    segment(ch: 'me' | 'call', s: Seg) {
      segCbs.forEach((cb) => cb(ch, s));
    },
  };
  return t;
}

let dir: string;
let now: number;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-orch-'));
  now = Date.parse('2026-11-22T10:00:00Z');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

type FakeRunner = { log: string[]; segments(s: unknown[]): void; pause(): void; resume(): void; hold(): void; notUseful(id: string): void; stop(): void; state(): { state: 'on'; count: number; list: [] } };
const fakeRunner = (): FakeRunner => {
  const log: string[] = [];
  return { log, segments: (s) => log.push(`seg:${(s[0] as { text: string }).text}`), pause: () => log.push('pause'), resume: () => log.push('resume'), hold: () => log.push('hold'), notUseful: (id) => log.push(`notUseful:${id}`), stop: () => log.push('stop'), state: () => ({ state: 'on', count: 0, list: [] }) };
};

function setup(opts: { mode?: SpaceMeetingSettings['mode']; fellBack?: string; alternate?: boolean; insights?: boolean; runner?: FakeRunner } = {}) {
  const store = createMeetingStore(dir, () => new Date(now));
  const tr = fakeTranscriber();
  let pcmCb: (ch: 'me' | 'call', d: Int16Array) => void = () => {};
  let stateCb: (s: { me: boolean; call: boolean }) => void = () => {};
  const settings: Record<string, SpaceMeetingSettings> = { 'space:s1': { mode: opts.mode ?? 'always', ...(opts.insights === false ? { insights: false } : {}) } };
  const runners: string[] = [];
  const ended: string[] = [];
  const captured: string[] = [];
  const o = createOrchestrator({
    store,
    transcriber: () => tr as never,
    capture: { start: async (wc) => void captured.push(String(wc)), stop: () => captured.push('stop') },
    onCapture: (pcm, state) => {
      pcmCb = pcm;
      stateCb = state;
      return () => {};
    },
    settingsFor: (scope) => settings[scope] ?? { mode: 'ask' },
    setSpaceMeetings: (scope, s) => (settings[scope] = s),
    engineFor: () => ({ engine: 'apple', modelDir: null, ...(opts.fellBack ? { fellBack: opts.fellBack } : {}) }),
    alternateEngine: () => (opts.alternate ? { engine: 'whisper', modelDir: '/models/whisper' } : null),
    defaultLanguage: () => 'pt-PT',
    scopeOf: (acc) => (acc === 'gone' ? null : acc.startsWith('n') ? 'nospace' : 'space:s1'),
    scopes: () => ['space:s1', 'nospace'],
    matchEvent: async () => undefined,
    titleFor: () => 'Weekly sync',
    webContentsOf: (acc, kind) => `${acc}/${kind}` as never,
    probe: () => {},
    probeReliable: () => true,
    push: () => {},
    ended: (m) => ended.push(m.id),
    now: () => now,
    ...(opts.runner ? { insights: (m) => (runners.push(m.id), opts.runner as never) } : {}),
  });
  const meet = (accountId = 'g1', key = 'meet:abc-defg-hij') => ({ accountId, kind: 'meet' as const, provider: 'meet' as const, key, url: 'https://meet.google.com/abc-defg-hij' });
  return { o, store, tr, ended, captured, settings, runners, pcm: (ch: 'me' | 'call', d: Int16Array) => pcmCb(ch, d), state: (s: { me: boolean; call: boolean }) => stateCb(s), meet };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

test('Always starts at once: engine, capture of that view, a stored meeting', async () => {
  const { o, tr, captured, store, meet } = setup();
  await o.start(meet());
  expect(tr.starts).toEqual([{ engine: 'apple', locale: 'pt-PT', modelDir: null }]);
  expect(captured).toEqual(['g1/meet']);
  expect(o.live()).toMatchObject({ scope: 'space:s1', accountId: 'g1', paused: false, language: 'pt-PT', engine: 'apple' });
  expect(store.list('space:s1', o.live()!.id)[0].state).toBe('transcribing');
});

test('Ask waits for an answer; "never" turns the space off', async () => {
  const { o, tr, settings, meet } = setup({ mode: 'ask' });
  await o.start(meet());
  expect(tr.starts).toEqual([]);
  expect(o.asking()).toMatchObject({ accountId: 'g1', kind: 'meet', switchTo: false });
  await o.answer(true, false);
  expect(tr.starts).toHaveLength(1);
  const b = setup({ mode: 'ask' });
  await b.o.start(b.meet());
  await b.o.answer(false, true);
  expect(b.tr.starts).toEqual([]);
  expect(b.settings['space:s1'].mode).toBe('off');
  expect(b.o.asking()).toBeNull();
});

test('Off does nothing', async () => {
  const { o, tr, meet } = setup({ mode: 'off' });
  await o.start(meet());
  expect(tr.starts).toEqual([]);
  expect(o.asking()).toBeNull();
});

test('a second call asks to switch and leaves the first alone until then', async () => {
  const { o, tr, meet, ended } = setup();
  await o.start(meet());
  const first = o.live()!.id;
  await o.start(meet('n1', 'meet:xyz-abcd-efg'));
  expect(o.live()!.id).toBe(first);
  expect(o.asking()).toMatchObject({ accountId: 'n1', switchTo: true });
  now += 10 * 60_000;
  tr.segment('me', { start: 0, end: 1000, text: 'olá' });
  await o.answer(true, false);
  expect(ended).toEqual([first]);
  expect(o.live()).toMatchObject({ accountId: 'n1', scope: 'nospace' });
});

test('muted or paused microphone audio reaches the engine as silence of the same length', async () => {
  const { o, tr, pcm, meet } = setup();
  await o.start(meet());
  o.onProbe('g1', 'meet', { speaking: [], muted: true });
  pcm('me', new Int16Array([5, 6, 7]));
  pcm('call', new Int16Array([5, 6, 7]));
  expect(tr.fed.map(([ch, d]) => [ch, [...d]])).toEqual([
    ['me', [0, 0, 0]],
    ['call', [5, 6, 7]],
  ]);
  o.onProbe('g1', 'meet', { speaking: [], muted: false });
  o.pause();
  pcm('call', new Int16Array([5, 6]));
  expect([...tr.fed.at(-1)![1]]).toEqual([0, 0]);
  expect(o.live()!.paused).toBe(true);
});

test('a meeting under a minute is dropped with no dialog', async () => {
  const { o, tr, store, ended, meet } = setup();
  await o.start(meet());
  const id = o.live()!.id;
  now += 45_000;
  tr.segment('me', { start: 0, end: 2000, text: 'olá' });
  await o.end('g1', 'meet', 'meet:abc-defg-hij');
  expect(ended).toEqual([]);
  expect(store.get('space:s1', id)).toBeNull();
});

test('a real meeting ends with its end time and the dialog', async () => {
  const { o, tr, store, ended, captured, meet } = setup();
  await o.start(meet());
  const id = o.live()!.id;
  o.onProbe('g1', 'meet', { speaking: ['Maria Silva'], muted: false });
  tr.segment('call', { start: 0, end: 900, text: 'Bom dia' });
  now += 10 * 60_000;
  await o.end('g1', 'meet', 'meet:abc-defg-hij');
  expect(tr.finishes).toBe(1);
  expect(captured.at(-1)).toBe('stop');
  const m = store.get('space:s1', id)!;
  expect(m.endedAt).toBe('2026-11-22T10:10:00.000Z');
  expect(m.segments).toEqual([{ start: 0, end: 900, speaker: 'Maria Silva', text: 'Bom dia' }]);
  expect(ended).toEqual([id]);
  expect(o.live()).toBeNull();
});

test('a fallback engine and a missing side show as notices', async () => {
  const { o, state, meet } = setup({ fellBack: 'Whisper is missing' });
  await o.start(meet());
  expect(o.live()!.notice).toMatchObject({ code: 'fellBack', text: 'Whisper is missing' });
  state({ me: true, call: false });
  expect(o.live()!.notice).toMatchObject({ code: 'missingSide' });
});

test('a missing Apple language falls back to an installed engine', async () => {
  const s = setup({ alternate: true });
  s.tr.failStartWith = 'localeMissing';
  await s.o.start(s.meet());
  expect(s.tr.starts.map((x) => x.engine)).toEqual(['apple', 'whisper']);
  expect(s.o.live()).toMatchObject({ engine: 'whisper', notice: { code: 'localeMissing', locale: 'pt-PT' } });
  expect(s.store.get('space:s1', s.o.live()!.id)!.engine).toBe('whisper');
  const t = setup({ alternate: false });
  t.tr.failStartWith = 'localeMissing';
  await t.o.start(t.meet());
  expect(t.o.live()!.notice).toMatchObject({ code: 'localeMissing', locale: 'pt-PT' });
});

test('recover() closes meetings left open by a quit, as not run', async () => {
  const { o, store } = setup();
  const m = store.create({ scope: 'space:s1', accountId: 'g1', provider: 'meet', url: 'u', title: 'T', startedAt: '2026-11-22T09:00:00.000Z', language: 'pt-PT', engine: 'apple' });
  store.append('space:s1', m.id, [{ start: 0, end: 125_000, speaker: 'me', text: 'x' }]);
  const empty = store.create({ scope: 'nospace', accountId: 'n1', provider: 'meet', url: 'u', title: 'T', startedAt: '2026-11-22T09:00:00.000Z', language: 'pt-PT', engine: 'apple' });
  o.recover();
  expect(store.get('space:s1', m.id)!.endedAt).toBe('2026-11-22T09:02:05.000Z');
  expect(store.list('space:s1')[0].state).toBe('notRun');
  expect(store.get('nospace', empty.id)).toBeNull();
});

test('changing the language restarts the engine in it', async () => {
  const { o, tr, store, meet } = setup();
  await o.start(meet());
  await o.setLanguage('en-US');
  expect(tr.starts.at(-1)).toMatchObject({ locale: 'en-US' });
  expect(store.get('space:s1', o.live()!.id)!.language).toBe('en-US');
  await flush();
});

// ── Final review fixes ─────────────────────────────────────────────────────────────────

test('C1: the last segments of a meeting that is finishing never land in the next one, even in another space', async () => {
  const s = setup();
  let release!: () => void;
  s.tr.finish = () => new Promise<void>((r) => (release = () => (s.tr.finishes++, r())));
  await s.o.start(s.meet());
  const a = s.o.live()!.id;
  now += 5 * 60_000;
  const stopping = s.o.stop();
  s.settings['nospace'] = { mode: 'always' };
  const next = s.o.start(s.meet('n1', 'meet:xyz-abcd-efg')); // another space
  await flush(); // B may have begun by now
  s.tr.segment('call', { start: 0, end: 900, text: 'last words of A' });
  release();
  await stopping;
  await next;
  expect(s.store.get('space:s1', a)!.segments.map((x) => x.text)).toEqual(['last words of A']);
  const b = s.o.live();
  if (b) expect(s.store.get(b.scope, b.id)!.segments).toEqual([]);
});

test('C1: two calls detected at once never both begin', async () => {
  const s = setup();
  s.settings['nospace'] = { mode: 'always' };
  await Promise.all([s.o.start(s.meet()), s.o.start(s.meet('n1', 'meet:xyz-abcd-efg'))]);
  expect(s.tr.starts).toHaveLength(1);
  expect(s.o.asking()).toMatchObject({ accountId: 'n1', switchTo: true });
});

test('I5: after hanging up (still in the 2-minute hold) nothing is transcribed, and the gap is marked', async () => {
  const s = setup();
  await s.o.start(s.meet());
  const id = s.o.live()!.id;
  now += 60_000;
  s.o.callChanged('g1', 'meet', false);
  s.pcm('me', new Int16Array([5, 5]));
  s.pcm('call', new Int16Array([5, 5]));
  expect(s.tr.fed.slice(-2).map(([, d]) => [...d])).toEqual([
    [0, 0],
    [0, 0],
  ]);
  now += 30_000;
  s.o.callChanged('g1', 'meet', true);
  s.pcm('me', new Int16Array([7]));
  expect([...s.tr.fed.at(-1)![1]]).toEqual([7]);
  expect(s.store.get('space:s1', id)!.gaps).toEqual([{ start: 60_000, end: 90_000 }]);
});

test('M4: an accidental join is measured to when it ended, not to when the engine finished', async () => {
  const s = setup();
  s.tr.finish = async () => {
    now += 60_000; // a slow flush
  };
  await s.o.start(s.meet());
  now += 40_000;
  s.tr.segment('me', { start: 0, end: 1000, text: 'oops' });
  await s.o.end('g1', 'meet', 'meet:abc-defg-hij');
  expect(s.ended).toEqual([]);
});

describe('live insights', () => {
  test('segments reach the insights runner, and live() shows its state', async () => {
    const runner = fakeRunner();
    const { o, tr, meet, runners } = setup({ runner });
    await o.start(meet());
    expect(runners).toEqual([o.live()!.id]);
    tr.segment('call', { start: 0, end: 1000, text: 'olá' } as never);
    expect(runner.log).toEqual(['seg:olá']);
    expect(o.live()?.insights).toEqual({ state: 'on', count: 0, list: [] });
  });

  test('pause and resume reach it', async () => {
    const runner = fakeRunner();
    const { o, meet } = setup({ runner });
    await o.start(meet());
    o.insightsPause();
    o.insightsResume();
    expect(runner.log).toEqual(['pause', 'resume']);
  });

  test('pausing the transcription drops a running insights request; Not useful reaches it', async () => {
    const runner = fakeRunner();
    const { o, meet } = setup({ runner });
    await o.start(meet());
    o.pause();
    o.insightNotUseful('abc');
    expect(runner.log).toEqual(['hold', 'notUseful:abc']);
  });

  test('ending stops it', async () => {
    const runner = fakeRunner();
    const { o, meet } = setup({ runner });
    await o.start(meet());
    await o.end('g1', 'meet', 'meet:abc-defg-hij');
    expect(runner.log).toContain('stop');
  });

  test('no runner when insights are off for the space', async () => {
    const runner = fakeRunner();
    const { o, meet, runners } = setup({ runner, insights: false });
    await o.start(meet());
    expect(runners).toEqual([]);
    expect(o.live()?.insights).toBeUndefined();
  });
});
