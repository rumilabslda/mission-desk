import type { MenuItemConstructorOptions } from 'electron';
import { APP_NAME } from '../../shared/about';
import { t } from '../../shared/i18n';

/**
 * The app menu's items; Services, Hide and Show All exist only on macOS.
 * Hide and Quit get their labels here: Windows and Linux use the system's own words.
 */
export function appMenuItems(platform: NodeJS.Platform, own: MenuItemConstructorOptions[] = [], onAbout: () => void = () => {}): MenuItemConstructorOptions[] {
  const mac = platform === 'darwin';
  const app = APP_NAME;
  return [
    // Mission Desk's own About (Settings → About): the system's About panel can't show a clickable website.
    { label: t('main.menu.about', { app }), click: () => onAbout() },
    { type: 'separator' },
    ...own,
    { type: 'separator' },
    ...(mac
      ? ([
          { role: 'services', label: t('main.menu.services') },
          { type: 'separator' },
          { role: 'hide', label: t('main.menu.hide', { app }) },
          { role: 'hideOthers', label: t('main.menu.hideOthers') },
          { role: 'unhide', label: t('main.menu.showAll') },
          { type: 'separator' },
        ] as MenuItemConstructorOptions[])
      : []),
    mac ? { role: 'quit', label: t('main.menu.quit', { app }) } : { role: 'quit' },
  ];
}
