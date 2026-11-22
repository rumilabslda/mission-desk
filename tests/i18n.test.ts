import { afterEach, describe, expect, it } from 'vitest';
import { addCatalog, LOCALES, type Locale, matchLocale, type MessageKey, resolveLocale, setLocale, t } from '../src/shared/i18n';
import { CATALOGS, loadCatalogs } from '../src/shared/i18n/catalogs';
import { en } from '../src/shared/i18n/en';
import type { Msg } from '../src/shared/i18n/types';

afterEach(() => setLocale('en'));

describe('choosing the language', () => {
  it('matches the Mac’s languages to ours', () => {
    expect(matchLocale('pt-PT')).toBe('pt-PT');
    expect(matchLocale('pt')).toBe('pt-PT');
    expect(matchLocale('pt-AO')).toBe('pt-PT');
    expect(matchLocale('pt-BR')).toBe('pt-BR');
    expect(matchLocale('pt_BR')).toBe('pt-BR');
    expect(matchLocale('de-AT')).toBe('de');
    expect(matchLocale('en-PT')).toBe('en');
    expect(matchLocale('nl-BE')).toBe('nl');
    expect(matchLocale('pl-PL')).toBeNull();
    expect(matchLocale('not a tag')).toBeNull();
  });

  it('follows the Mac, keeping its region for dates', () => {
    expect(resolveLocale('system', ['en-PT', 'pt-PT'])).toEqual({ locale: 'en', format: 'en-PT' });
    expect(resolveLocale(undefined, ['pl-PL', 'fr-BE'])).toEqual({ locale: 'fr', format: 'fr-BE' });
    expect(resolveLocale('system', ['pl-PL'])).toEqual({ locale: 'en', format: 'en-PL' });
    expect(resolveLocale('system', [])).toEqual({ locale: 'en', format: 'en' });
  });

  it('uses the language picked in Settings', () => {
    expect(resolveLocale('de', ['en-PT', 'pt-PT'])).toEqual({ locale: 'de', format: 'de-PT' });
    expect(resolveLocale('pt-PT', ['en-PT', 'pt-PT'])).toEqual({ locale: 'pt-PT', format: 'pt-PT' });
    expect(resolveLocale('pt-BR', ['en-US'])).toEqual({ locale: 'pt-BR', format: 'pt-BR' });
    expect(resolveLocale('en', ['en-GB'])).toEqual({ locale: 'en', format: 'en-GB' });
  });
});

describe('t', () => {
  it('fills placeholders and writes numbers the local way', () => {
    addCatalog('de', { 'settings.language.system': 'Wie der Mac ({name})' } as Partial<Record<MessageKey, Msg>>);
    expect(t('settings.language.system', { name: 'English' })).toBe('Same as the Mac (English)');
    setLocale('de');
    expect(t('settings.language.system', { name: 'Deutsch' })).toBe('Wie der Mac (Deutsch)');
    expect(t('settings.language.system', { name: 1234 as unknown as string })).toBe('Wie der Mac (1.234)');
    loadCatalogs();
  });

  it('falls back from Brazilian to Portugal’s Portuguese, then English', () => {
    const key = 'common.cancel' as MessageKey;
    addCatalog('pt-PT', { [key]: 'Cancelar (PT)' } as Partial<Record<MessageKey, Msg>>);
    addCatalog('pt-BR', {});
    setLocale('pt-BR');
    expect(t(key)).toBe('Cancelar (PT)');
    setLocale('it');
    addCatalog('it', {});
    expect(t(key)).toBe('Cancel');
    loadCatalogs();
  });

  it('picks plural forms by count', () => {
    const key = 'common.cancel' as MessageKey;
    addCatalog('fr', { [key]: { one: '{count} compte', other: '{count} comptes' } } as Partial<Record<MessageKey, Msg>>);
    setLocale('fr');
    expect(t(key, { count: 1 })).toBe('1 compte');
    expect(t(key, { count: 0 })).toBe('0 compte'); // French: 0 is singular
    expect(t(key, { count: 3 })).toBe('3 comptes');
    loadCatalogs();
  });
});

/** Placeholders and markup tags a message uses, sorted (the same set in every language). */
function tokens(m: Msg): string[] {
  const texts = typeof m === 'string' ? [m] : Object.values(m).filter((v): v is string => typeof v === 'string');
  const found = new Set<string>();
  for (const text of texts) for (const x of text.matchAll(/\{(\w+)\}|<\/?(\w+)\/?>/g)) found.add(x[1] ? `{${x[1]}}` : `<${x[2]}>`);
  return [...found].sort();
}

describe.each(LOCALES.filter((l): l is Exclude<Locale, 'en'> => l !== 'en'))('the %s translation', (l) => {
  const catalog = CATALOGS[l];

  it('has every English message, and nothing else', () => {
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps every placeholder and tag', () => {
    const wrong = (Object.keys(en) as MessageKey[]).filter((k) => catalog[k] !== undefined && tokens(catalog[k]).join() !== tokens(en[k]).join());
    expect(wrong).toEqual([]);
  });

  it('is plain text where English is, plural forms where English is', () => {
    const wrong = (Object.keys(en) as MessageKey[]).filter((k) => catalog[k] !== undefined && typeof catalog[k] !== typeof en[k]);
    expect(wrong).toEqual([]);
  });

  it('is never empty', () => {
    const empty = (Object.entries(catalog) as [string, Msg][]).filter(([, m]) => (typeof m === 'string' ? !m.trim() : !m.other.trim()));
    expect(empty).toEqual([]);
  });
});
