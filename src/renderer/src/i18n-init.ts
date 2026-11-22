import { loadCatalogs } from '../../shared/i18n/catalogs';
import { setLocale } from '../../shared/i18n';

// Imported first by main.tsx: the language is set before any component module runs, so
// module-level text and date formats are already in it. Changing the language reloads the page.
loadCatalogs();
const l = window.missiondesk.locale;
if (l) setLocale(l.locale, l.format);
document.documentElement.lang = l?.locale ?? 'en';
