import type { AboutPanelOptionsOptions } from 'electron';
import { COPYRIGHT, LICENSE_NAME, SITE } from '../shared/about';
import { t } from '../shared/i18n';

/** The app's About window (Mission Desk → About Mission Desk). */
export function aboutPanelOptions(version: string): AboutPanelOptionsOptions {
  return {
    applicationName: 'Mission Desk',
    applicationVersion: version,
    copyright: COPYRIGHT,
    // macOS shows only this text (no website field), so the website goes here too.
    credits: t('main.about.credits', { site: SITE.replace(/^https:\/\//, ''), license: LICENSE_NAME }),
    website: SITE,
  };
}
