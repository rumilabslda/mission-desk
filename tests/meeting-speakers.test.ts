import { Window } from 'happy-dom';
import { assignSpeakers, cleanName, mutedAt, type ProbeSample } from '../src/shared/meeting-speakers';
import { probeFor } from '../src/shared/meeting-probes';

const s = (at: number, speaking: string[], muted: boolean | null = null): ProbeSample => ({ at, speaking, muted });

test('the microphone is always "me"', () => {
  expect(assignSpeakers('me', { start: 0, end: 4000, text: 'Olá' }, [s(0, ['Maria Silva'])]).speaker).toBe('me');
});

test('a call segment goes to whoever the page marked speaking for most of it', () => {
  const samples = [s(0, ['Maria Silva']), s(1000, ['Maria Silva']), s(2000, ['Maria Silva']), s(3000, [])];
  expect(assignSpeakers('call', { start: 0, end: 4000, text: 'x' }, samples)).toEqual({ start: 0, end: 4000, speaker: 'Maria Silva', text: 'x' });
});

test('no one with half the segment gives "others"', () => {
  const samples = [s(0, ['Ana']), s(1000, ['Ana']), s(2000, ['Rui']), s(3000, ['Rui']), s(4000, [])];
  expect(assignSpeakers('call', { start: 0, end: 5000, text: 'x' }, samples).speaker).toBe('others');
  expect(assignSpeakers('call', { start: 0, end: 5000, text: 'x' }, []).speaker).toBe('others');
});

test('muted only when the page says so', () => {
  const samples = [s(0, [], null), s(1000, [], true), s(5000, [], false)];
  expect(mutedAt(samples, 500)).toBe(false);
  expect(mutedAt(samples, 1500)).toBe(true);
  expect(mutedAt(samples, 6000)).toBe(false);
  expect(mutedAt([], 100)).toBe(false);
});

test('names are cleaned', () => {
  expect(cleanName('  Maria Silva (You) ')).toBe('Maria Silva');
  expect(cleanName('Rui\n(Presenting)')).toBe('Rui');
  expect(cleanName('x'.repeat(200))).toHaveLength(80);
  expect(cleanName('   ')).toBeNull();
});

test('every provider’s probe returns something safe on a page with no markers', () => {
  const doc = new Window().document as unknown as Document;
  for (const p of ['meet', 'teams', 'zoom'] as const) expect(probeFor(p)(doc)).toEqual({ speaking: [], muted: null });
});
