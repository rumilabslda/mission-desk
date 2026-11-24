import type { OpenRef } from '../../../shared/meeting';

/** A piece of the space's knowledge, as a live insight can cite it (see sources.ts). */
export type SourceKind = 'memory' | 'meeting' | 'todo' | 'waiting' | 'message';
export interface SourceItem {
  /** Short and per meeting ("n3", "d12"): never a real id or path. */
  id: string;
  kind: SourceKind;
  /** One line, at most 300 characters. */
  text: string;
  /** ISO date, when the source has one. */
  date?: string;
  /** How the card names it ("Meeting of 12/11 · Decision"). */
  label: string;
  open: OpenRef;
}

/** Picks the items relevant to the last minutes of conversation. Semantic search can replace it later. */
export interface Retriever {
  top(window: string, items: SourceItem[], k: number): SourceItem[];
}

// The commonest Portuguese and English function words: they say nothing about what is relevant.
const STOP = new Set(
  (
    'a o as os um uma uns umas de do da dos das no na nos nas ao aos em por para com sem sobre entre ' +
    'e ou mas que se nao sim como quando onde porque pois ja ainda tambem muito pouco mais menos ' +
    'eu tu ele ela nos vos eles elas me te lhe isso isto aquilo esse essa este esta aquele aquela ' +
    'meu minha teu tua seu sua nosso nossa ser estar ter haver foi era sao estao tem ha vai vou ' +
    'todos todas tudo nada algo bom boa dia ok pronto entao tipo bem ' +
    'the an and or but of to in on at for with from by as is are was were be been it its this that ' +
    'these those we you he she they i me my our your their not no yes so if then than there here ' +
    'all any some what which who how when where why do does did have has had will would can could'
  ).split(/\s+/),
);

/** Lower case, without accents. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** The words that can say what a text is about: folded, without stop words or one-letter words. */
export function words(s: string): string[] {
  return fold(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Words that weigh double: numbers, and names (capitalised in the conversation). */
function strongWords(window: string): Set<string> {
  const out = new Set<string>();
  for (const raw of window.split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    if (/^\p{N}+$/u.test(raw) || /^\p{Lu}/u.test(raw)) out.add(fold(raw));
  }
  return out;
}

/**
 * Below this an item isn't worth a request. One shared word that every item has scores ln 2 (~0.69);
 * nothing shared scores 0. So any real overlap passes and small talk never does.
 */
export const MIN_SCORE = 0.5;

const K1 = 1.2;
const B = 0.75;

/** BM25 over the items' words, with numbers and names weighing double. */
export function createKeywordRetriever(opts: { minScore?: number } = {}): Retriever {
  const minScore = opts.minScore ?? MIN_SCORE;
  return {
    top(window, items, k) {
      const query = [...new Set(words(window))];
      if (query.length === 0 || items.length === 0) return [];
      const strong = strongWords(window);
      const docs = items.map((it) => words(it.text));
      const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length || 1;
      const df = new Map<string, number>();
      for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
      const n = items.length;
      const scored = items.map((it, i) => {
        const d = docs[i];
        let score = 0;
        for (const q of query) {
          const tf = d.filter((w) => w === q).length;
          if (!tf) continue;
          const idf = Math.log(1 + n / (df.get(q) ?? 1));
          const norm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * d.length) / avg));
          score += idf * norm * (strong.has(q) ? 2 : 1);
        }
        return { it, score };
      });
      return scored
        .filter((s) => s.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((s) => s.it);
    },
  };
}
