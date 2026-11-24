import { createKeywordRetriever, fold, words, type SourceItem } from '../src/main/meetings/insights/retrieve';

const item = (id: string, text: string): SourceItem => ({ id, kind: 'memory', text, label: 'Memory', open: { kind: 'memory', scope: 'space:a' } });
const ids = (l: SourceItem[]): string[] => l.map((i) => i.id);

test('fold: lower case, no accents', () => {
  expect(fold('Faturação ÁGIL')).toBe('faturacao agil');
});

test('words: folded, without stop words or one-letter words', () => {
  expect(words('O atraso da faturação e the invoice')).toEqual(['atraso', 'faturacao', 'invoice']);
});

test('ranks the item that shares rare words first', () => {
  const items = [item('a', 'faturação atrasada em outubro'), item('b', 'almoço de equipa'), item('c', 'atraso na faturação da Acme')];
  const top = ids(createKeywordRetriever().top('o atraso na faturação da Acme', items, 30));
  expect(top.slice(0, 2)).toEqual(['c', 'a']);
  expect(top).not.toContain('b');
});

test('numbers and capitalised names weigh more', () => {
  const items = [item('plain', 'falou com alguém'), item('named', 'João pediu 4500')];
  expect(ids(createKeywordRetriever().top('o João falou dos 4500 euros', items, 30))[0]).toBe('named');
});

test('nothing above the minimum: empty', () => {
  expect(createKeywordRetriever().top('bom dia a todos', [item('a', 'faturação atrasada'), item('b', 'proposta da Acme')], 30)).toEqual([]);
});

test('at most k', () => {
  const items = Array.from({ length: 50 }, (_, i) => item(`i${i}`, `faturação número ${i}`));
  expect(createKeywordRetriever().top('faturação', items, 30)).toHaveLength(30);
});
