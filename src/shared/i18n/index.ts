import { en } from './en';
import { type Locale } from './locales';
import type { Msg, Plural } from './types';

export * from './locales';
export type { Msg, Plural, Translation } from './types';

export type Messages = typeof en;
export type MessageKey = keyof Messages;
export type Params = Record<string, string | number>;

const catalogs: Partial<Record<Locale, Partial<Record<MessageKey, Msg>>>> = { en };

/** Brazilian Portuguese falls back to Portugal's before English. */
const CHAIN: Record<Locale, Locale[]> = {
  en: ['en'],
  'pt-PT': ['pt-PT', 'en'],
  'pt-BR': ['pt-BR', 'pt-PT', 'en'],
  es: ['es', 'en'],
  fr: ['fr', 'en'],
  de: ['de', 'en'],
  it: ['it', 'en'],
  nl: ['nl', 'en'],
};

let current: Locale = 'en';
let format = 'en';

/** Registers a language's messages (done once by ./catalogs). */
export function addCatalog(locale: Locale, messages: Partial<Record<MessageKey, Msg>>): void {
  catalogs[locale] = messages;
}

export function setLocale(locale: Locale, formatLocale?: string): void {
  current = locale;
  format = formatLocale ?? locale;
}

/** The interface language. */
export const locale = (): Locale => current;
/** The locale dates and numbers are written in (the interface language with the Mac's region). */
export const intlLocale = (): string => format;

function lookup(key: MessageKey): Msg {
  for (const l of CHAIN[current]) {
    const m = catalogs[l]?.[key];
    if (m !== undefined) return m;
  }
  return key;
}

function pick(m: Plural, count: number): string {
  let rule: Intl.LDMLPluralRule = 'other';
  try {
    rule = new Intl.PluralRules(current).select(count);
  } catch {
    // keep "other"
  }
  return m[rule] ?? m.other;
}

/**
 * The text for `key` in the interface language, with {placeholders} filled in.
 * A plural message picks its form from `params.count`; numbers are written the local way.
 */
export function t(key: MessageKey, params?: Params): string {
  const m = lookup(key);
  const text = typeof m === 'string' ? m : pick(m, Number(params?.count ?? 0));
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => {
    const v = params[name];
    if (v === undefined) return all;
    return typeof v === 'number' ? new Intl.NumberFormat(format).format(v) : v;
  });
}
