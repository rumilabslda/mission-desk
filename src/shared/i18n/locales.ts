/** The languages Mission Desk's interface comes in. English is the source and the last fallback. */
export const LOCALES = ['en', 'pt-PT', 'pt-BR', 'es', 'fr', 'de', 'it', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];

/** Settings → General → Language: follow the Mac, or one of the languages. */
export type LanguageSetting = 'system' | Locale;

/** Each language in its own words, for the picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  nl: 'Nederlands',
};

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
export const isLanguageSetting = (v: unknown): v is LanguageSetting => v === 'system' || isLocale(v);

/** "pt-BR" → pt-BR; any other Portuguese → pt-PT; "de-AT" → de; a language we don't have → null. */
export function matchLocale(tag: string): Locale | null {
  let parts: Intl.Locale;
  try {
    parts = new Intl.Locale(tag.replace(/_/g, '-'));
  } catch {
    return null;
  }
  const lang = parts.language.toLowerCase();
  if (lang === 'pt') return parts.region?.toUpperCase() === 'BR' ? 'pt-BR' : 'pt-PT';
  return isLocale(lang) ? lang : null;
}

function regionOf(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  try {
    return new Intl.Locale(tag.replace(/_/g, '-')).region;
  } catch {
    return undefined;
  }
}

/**
 * The interface language, and the locale dates and numbers are written in.
 * `preferred` is the Mac's language list (app.getPreferredSystemLanguages(): "en-PT", "pt-PT"…).
 * Dates keep the Mac's region where they can: English on a Mac set to Portugal shows 24-hour times.
 */
export function resolveLocale(setting: LanguageSetting | undefined, preferred: string[]): { locale: Locale; format: string } {
  const system = preferred.map((tag) => ({ tag: tag.replace(/_/g, '-'), locale: matchLocale(tag) }));
  const locale: Locale = setting && setting !== 'system' ? setting : (system.find((s) => s.locale)?.locale ?? 'en');
  // The Mac's own tag for this language, with its region ("en-PT").
  const same = system.find((s) => s.locale === locale);
  if (same) return { locale, format: same.tag };
  if (locale === 'pt-PT' || locale === 'pt-BR') return { locale, format: locale };
  const region = regionOf(preferred[0]);
  return { locale, format: region ? `${locale}-${region}` : locale };
}
