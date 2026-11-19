import type { MenuItemConstructorOptions } from 'electron';
import { APP_NAME } from '../../shared/about';

/**
 * The app menu's items; Services, Hide and Show All exist only on macOS.
 * Hide and Quit get their labels here: Windows and Linux use the system's own words.
 */
export function appMenuItems(platform: NodeJS.Platform, own: MenuItemConstructorOptions[] = [], onAbout: () => void = () => {}): MenuItemConstructorOptions[] {
  const mac = platform === 'darwin';
  return [
    // Mission Desk's own About (Settings → About): the system's About panel can't show a clickable website.
    { label: `About ${APP_NAME}`, click: () => onAbout() },
    { type: 'separator' },
    ...own,
    { type: 'separator' },
    ...(mac
      ? ([
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide', label: `Hide ${APP_NAME}` },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
        ] as MenuItemConstructorOptions[])
      : []),
    mac ? { role: 'quit', label: `Quit ${APP_NAME}` } : { role: 'quit' },
  ];
}
