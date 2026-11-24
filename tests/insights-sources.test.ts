import { buildSources, type SourcesInput } from '../src/main/meetings/insights/sources';
import type { Meeting } from '../src/shared/meeting';
import type { Message } from '../src/shared/messages';
import type { Todo } from '../src/shared/types';

const meeting = (id: string, scope: string, startedAt: string, summary?: Meeting['result']): Meeting => ({
  id, scope, accountId: 'g1', provider: 'meet', url: 'https://meet.google.com/abc-defg-hij', title: id, startedAt, language: 'pt-PT', engine: 'apple', segments: [], gaps: [], ...(summary ? { result: summary } : {}),
});
const todo = (id: string, over: Partial<Todo>): Todo => ({ id, text: id, done: false, createdAt: '2026-11-10T10:00:00Z', day: '2026-11-10', ...over });
const message = (key: string, accountId: string, at: number, body = 'corpo'): Message => ({ key, accountId, kind: 'main', sender: 1, id: 1, tag: '', title: `t-${key}`, body, at, count: 1 });

function input(over: Partial<SourcesInput> = {}): SourcesInput {
  return {
    scope: 'space:a',
    liveId: 'live',
    notes: { 'space:a': [{ id: 'n', text: 'A Acme revê a faturação em dezembro', createdAt: '2026-11-01T00:00:00Z' }], 'space:b': [{ id: 'nb', text: 'segredo do B', createdAt: '2026-11-01T00:00:00Z' }], nospace: [{ id: 'nn', text: 'nota solta', createdAt: '2026-11-01T00:00:00Z' }] },
    meetings: [
      meeting('past', 'space:a', '2026-11-12T10:00:00Z', { summary: { decisions: ['Preço fixo até março'], points: ['Atraso na faturação'], nextSteps: ['Enviar proposta'] } }),
      meeting('live', 'space:a', '2026-11-24T10:00:00Z', { summary: { decisions: ['ao vivo'], points: [], nextSteps: [] } }),
      meeting('other', 'space:b', '2026-11-12T10:00:00Z', { summary: { decisions: ['do B'], points: [], nextSteps: [] } }),
    ],
    todos: [
      todo('t-open', { tag: { kind: 'space', id: 'a' } }),
      todo('t-wait', { tag: { kind: 'space', id: 'a' }, waitingOn: 'João' }),
      todo('t-done', { tag: { kind: 'space', id: 'a' }, done: true }),
      todo('t-b', { tag: { kind: 'space', id: 'b' } }),
      todo('t-loose', {}),
    ],
    feed: [message('m-a', 'acc-a', 2000), message('m-unshared', 'acc-a-off', 3000), message('m-b', 'acc-b', 4000), message('m-loose', 'acc-loose', 5000)],
    accounts: [
      { id: 'acc-a', name: 'Gmail Acme', spaceId: 'a', claudeAccess: 'read' },
      { id: 'acc-a-off', name: 'Slack Acme', spaceId: 'a', claudeAccess: 'off' },
      { id: 'acc-b', name: 'Gmail B', spaceId: 'b', claudeAccess: 'read' },
      { id: 'acc-loose', name: 'Pessoal', claudeAccess: 'read' },
    ],
    dateLabel: (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7),
    ...over,
  };
}

test('every kind becomes items with its open ref', () => {
  const items = buildSources(input());
  expect(items.map((i) => i.kind)).toEqual(['memory', 'meeting', 'meeting', 'meeting', 'todo', 'waiting', 'message']);
  expect(items.find((i) => i.kind === 'meeting')?.open).toEqual({ kind: 'meeting', scope: 'space:a', id: 'past' });
  expect(items.find((i) => i.kind === 'message')?.open).toEqual({ kind: 'message', key: 'm-a' });
  expect(items.find((i) => i.kind === 'memory')?.open).toEqual({ kind: 'memory', scope: 'space:a' });
  expect(items.find((i) => i.kind === 'todo')?.open).toEqual({ kind: 'home' });
  expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
});

test("only the meeting's scope", () => {
  const text = buildSources(input()).map((i) => i.text).join(' | ');
  expect(text).not.toContain('segredo do B');
  expect(text).not.toContain('do B');
  expect(text).not.toContain('t-b');
  expect(text).not.toContain('t-m-b');
});

test("never the live meeting, earlier meetings' insights, done to-dos, or messages from unshared accounts", () => {
  const withInsights = input();
  (withInsights.meetings[0] as Meeting).insights = [{ id: 'i1', at: 0, kind: 'past', text: 'um insight antigo', said: 'x', sources: [] }];
  const text = buildSources(withInsights).map((i) => i.text).join(' | ');
  expect(text).not.toContain('ao vivo');
  expect(text).not.toContain('um insight antigo');
  expect(text).not.toContain('t-done');
  expect(text).not.toContain('t-m-unshared');
});

test('nospace scope', () => {
  const items = buildSources(input({ scope: 'nospace' }));
  expect(items.map((i) => i.text)).toEqual(['nota solta', 't-loose', 'Pessoal · t-m-loose: corpo']);
});

test('at most 200 messages, newest first; text one line, at most 300 characters', () => {
  const feed = Array.from({ length: 250 }, (_, i) => message(`k${i}`, 'acc-a', i, `linha\n${'x'.repeat(400)}`));
  const msgs = buildSources(input({ feed })).filter((i) => i.kind === 'message');
  expect(msgs).toHaveLength(200);
  expect(msgs[0].open).toEqual({ kind: 'message', key: 'k249' });
  expect(msgs.every((m) => !m.text.includes('\n') && m.text.length <= 300)).toBe(true);
});

test('a bad date never throws: the item keeps no date', () => {
  const bad = input();
  bad.notes['space:a'][0].createdAt = 'not a date';
  bad.feed = [message('m-a', 'acc-a', Number.NaN)];
  const items = buildSources({ ...bad, dateLabel: (iso) => new Intl.DateTimeFormat('pt-PT').format(new Date(iso)) });
  expect(items.find((i) => i.kind === 'memory')?.date).toBeUndefined();
  expect(items.find((i) => i.kind === 'message')?.date).toBeUndefined();
});
