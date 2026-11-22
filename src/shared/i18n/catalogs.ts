import { addCatalog, type Locale, type MessageKey } from './index';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { nl } from './nl';
import { ptBR } from './pt-BR';
import { ptPT } from './pt-PT';
import type { Msg } from './types';

/** Every translation (English is built in). */
export const CATALOGS: Record<Exclude<Locale, 'en'>, Partial<Record<MessageKey, Msg>>> = { 'pt-PT': ptPT, 'pt-BR': ptBR, es, fr, de, it, nl };

/** Loads every translation. Imported once at start by the main process and by the UI page; tests that don't call it see English. */
export function loadCatalogs(): void {
  for (const [l, messages] of Object.entries(CATALOGS)) addCatalog(l as Locale, messages);
}
