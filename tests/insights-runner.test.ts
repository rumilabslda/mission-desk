import type { Ask } from '../src/main/meetings/one-shot';
import { createKeywordRetriever, type SourceItem } from '../src/main/meetings/insights/retrieve';
import { createInsightRunner, type InsightRunnerDeps } from '../src/main/meetings/insights/runner';
import type { MeetingInsight, Segment } from '../src/shared/meeting';

const START = Date.parse('2026-11-24T10:00:00Z');
const item = (id: string, text: string): SourceItem => ({ id, kind: 'meeting', text, date: '2026-11-12T10:00:00Z', label: 'Meeting of 12/11 · Decision', open: { kind: 'meeting', scope: 'space:a', id: 'm1' } });
const ITEMS = [item('d1', 'faturação atrasada em outubro'), item('d2', 'proposta da Acme em revisão'), item('d3', 'contrato renovado em março')];
const TEXTS = ['Faturação já foi falada a 12/11', 'A proposta está em revisão desde 12/11', 'O contrato foi renovado em março'];
const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(over: Partial<InsightRunnerDeps> & { answer?: (call: number) => string | Promise<string> } = {}) {
  let t = START;
  const calls: number[] = [];
  const saved: MeetingInsight[] = [];
  let sourcesCalls = 0;
  const answer = over.answer ?? ((n: number) => JSON.stringify({ insights: [{ kind: 'past', text: TEXTS[(n - 1) % 3] + ` ${'x'.repeat(n)}`.trim(), sources: [`d${((n - 1) % 3) + 1}`], said: 'faturação atrasada', confidence: 'high' }] }));
  const ask: Ask = async () => {
    calls.push(t);
    return answer(calls.length);
  };
  const runner = createInsightRunner({
    now: () => t,
    meeting: { scope: 'space:a', id: 'live', title: 'Acme', language: 'pt-PT', startedAt: START },
    ask: () => ask,
    unavailable: () => null,
    sources: () => (sourcesCalls++, ITEMS),
    retriever: createKeywordRetriever(),
    myName: 'Eu',
    save: (i) => saved.push(i),
    changed: () => {},
    ...over,
  });
  /** `secs` of speech ending at `at` seconds into the meeting. */
  const speak = async (at: number, secs: number, text = 'temos a faturação atrasada e a proposta da Acme e o contrato renovado') => {
    t = START + at * 1000;
    runner.segments([{ start: (at - secs) * 1000, end: at * 1000, speaker: 'João', text } as Segment]);
    await flush();
  };
  return { runner, calls, saved, speak, sourcesCount: () => sourcesCalls, setNow: (s: number) => (t = START + s * 1000) };
}

test('waits for 90 s of speech and 2 min', async () => {
  const { calls, speak } = setup();
  await speak(80, 80);
  expect(calls).toHaveLength(0);
  await speak(130, 20);
  expect(calls).toHaveLength(1);
  await speak(200, 90);
  expect(calls).toHaveLength(1);
  await speak(250, 10);
  expect(calls).toHaveLength(2);
});

test('never two requests at once', async () => {
  let release!: (v: string) => void;
  const { calls, speak } = setup({ answer: () => new Promise((r) => (release = r)) });
  await speak(130, 100);
  await speak(260, 100);
  await speak(400, 100);
  expect(calls).toHaveLength(1);
  release(JSON.stringify({ insights: [] }));
});

test('no items: never asks', async () => {
  const { calls, speak } = setup({ sources: () => [] });
  for (let s = 100; s <= 600; s += 100) await speak(s, 100);
  expect(calls).toHaveLength(0);
});

test('stop aborts and discards', async () => {
  let release!: (v: string) => void;
  const { runner, saved, speak } = setup({ answer: () => new Promise((r) => (release = r)) });
  await speak(130, 100);
  runner.stop();
  release(JSON.stringify({ insights: [{ kind: 'past', text: 'x', sources: ['d1'], said: 'faturação atrasada', confidence: 'high' }] }));
  await flush();
  expect(saved).toHaveLength(0);
});

test('pause and resume', async () => {
  const { runner, calls, speak } = setup();
  runner.pause();
  expect(runner.state().state).toBe('paused');
  await speak(200, 200);
  expect(calls).toHaveLength(0);
  runner.resume();
  await speak(260, 60);
  expect(calls).toHaveLength(0); // 60 s of new speech since resuming
  await speak(330, 40);
  expect(calls).toHaveLength(1); // 100 s of speech and 2 min since resuming at 200 s
});

test('two failures pause with the reason', async () => {
  const { runner, calls, speak } = setup({ answer: () => Promise.reject(new Error('signed out')) });
  await speak(130, 100);
  await speak(260, 100);
  expect(runner.state()).toMatchObject({ state: 'paused', reason: 'The assistant didn’t answer. Resume to try again.' });
  await speak(400, 100);
  expect(calls).toHaveLength(2);
});

test('timeout counts as a failure', async () => {
  const never: Ask = (_s, _u, signal) => new Promise((_r, reject) => signal.addEventListener('abort', () => reject(new Error('Stopped.'))));
  const { runner, speak } = setup({ ask: () => never, timeoutMs: 5 });
  await speak(130, 100);
  await new Promise((r) => setTimeout(r, 20));
  await speak(260, 100);
  await new Promise((r) => setTimeout(r, 20));
  expect(runner.state().state).toBe('paused');
});

test('cap reached: stops asking', async () => {
  // Every check cites a fresh item, so nothing is dropped as a repeat.
  const many = Array.from({ length: 20 }, (_, i) => item(`d${i + 1}`, `faturação atrasada ${i}`));
  const { calls, saved, speak } = setup({ sources: () => many, answer: (n) => JSON.stringify({ insights: [{ kind: 'past', text: `assunto ${n} ${'zq'.repeat(n)} ${n * 7}`, sources: [`d${n}`], said: 'faturação atrasada', confidence: 'high' }] }) });
  for (let k = 1; k <= 16; k++) await speak(130 * k, 100);
  expect(saved).toHaveLength(12);
  expect(calls).toHaveLength(12);
});

test('one card every 3 min', async () => {
  const { runner, speak } = setup();
  await speak(130, 100);
  const first = runner.state().latest;
  expect(first).toBeDefined();
  await speak(260, 100);
  expect(runner.state().list).toHaveLength(2);
  expect(runner.state().latest?.id).toBe(first?.id);
  await speak(400, 100);
  expect(runner.state().latest?.id).not.toBe(first?.id);
});

test('unavailable: state says why, no calls', async () => {
  const { runner, calls, speak } = setup({ unavailable: () => 'Claude Acme isn’t signed in.' });
  expect(runner.state()).toMatchObject({ state: 'unavailable', reason: 'Claude Acme isn’t signed in.' });
  await speak(130, 100);
  expect(calls).toHaveLength(0);
});

test('sources are rebuilt every 10 min', async () => {
  const { speak, sourcesCount } = setup();
  await speak(130, 100);
  expect(sourcesCount()).toBe(1);
  await speak(430, 100);
  expect(sourcesCount()).toBe(1);
  await speak(760, 100);
  expect(sourcesCount()).toBe(2);
});

describe('review fixes', () => {
  test('an answer still invalid after the retry is skipped, not counted as a failure', async () => {
    const { runner, calls, speak } = setup({ answer: () => 'not json at all' });
    await speak(130, 100);
    await speak(260, 100);
    await speak(400, 100);
    expect(runner.state().state).toBe('on');
    expect(calls).toHaveLength(6); // 3 checks, each asked twice
  });

  test('a real failure pauses with a translated reason, not the raw error', async () => {
    const { runner, speak } = setup({ answer: () => Promise.reject(new Error('Stopped.')) });
    await speak(130, 100);
    await speak(260, 100);
    expect(runner.state().state).toBe('paused');
    expect(runner.state().reason).not.toContain('Stopped.');
    expect(runner.state().reason).toBeTruthy();
  });

  test('the bar shows unavailable as soon as the connection says so, before any check', () => {
    let why: string | null = null;
    const { runner } = setup({ unavailable: () => why });
    expect(runner.state().state).toBe('on');
    why = 'Not connected';
    expect(runner.state()).toMatchObject({ state: 'unavailable', reason: 'Not connected' });
    why = null;
    expect(runner.state().state).toBe('on');
  });

  test('a throw while building a check is caught and the meeting goes on', async () => {
    let boom = true;
    const { calls, speak } = setup({ sources: () => (boom ? (() => { throw new RangeError('Invalid time value'); })() : ITEMS) });
    await expect(speak(130, 100)).resolves.toBeUndefined();
    boom = false;
    await speak(260, 100);
    expect(calls).toHaveLength(1);
  });

  test('earlier insights are listed in the request as already shown', async () => {
    const prompts: string[] = [];
    const { speak } = setup({
      ask: () => async (_s, user) => {
        prompts.push(user);
        return JSON.stringify({ insights: [{ kind: 'past', text: 'Faturação já foi falada a 12/11', sources: ['d1'], said: 'faturação atrasada', confidence: 'high' }] });
      },
    });
    await speak(130, 100);
    await speak(260, 100);
    expect(prompts[1]).toContain('Already shown');
    expect(prompts[1]).toContain('Faturação já foi falada a 12/11');
  });
});

describe('deferred review fixes', () => {
  test('hold (the transcription paused) drops a running request without pausing insights', async () => {
    let release!: (v: string) => void;
    let n = 0;
    const { runner, calls, saved, speak } = setup({ answer: () => (++n === 1 ? new Promise((r) => (release = r)) : JSON.stringify({ insights: [] })) });
    await speak(130, 100);
    expect(calls).toHaveLength(1);
    runner.hold();
    release(JSON.stringify({ insights: [{ kind: 'past', text: 'Faturação já foi falada a 12/11', sources: ['d1'], said: 'faturação atrasada', confidence: 'high' }] }));
    await flush();
    expect(saved).toHaveLength(0);
    expect(runner.state().state).toBe('on');
    await speak(260, 100);
    expect(calls).toHaveLength(2);
  });

  test('"Not useful" is reflected in the live list', async () => {
    const { runner, speak } = setup();
    await speak(130, 100);
    const id = runner.state().list[0].id;
    runner.notUseful(id);
    expect(runner.state().list[0].notUseful).toBe(true);
  });

  test('only the last 5 minutes are sent, however long the meeting', async () => {
    const prompts: string[] = [];
    const { speak } = setup({
      ask: () => async (_s: string, user: string) => {
        prompts.push(user);
        return JSON.stringify({ insights: [] });
      },
    });
    await speak(60, 60, 'faturação no início');
    for (let s = 200; s <= 1400; s += 120) await speak(s, 100);
    expect(prompts.at(-1)).not.toContain('faturação no início');
  });
});
