import { app, type BrowserWindow, Menu, type MenuItemConstructorOptions, shell } from 'electron';
import { APP_NAME, SITE, WEBSITE } from '../../shared/about';
import { IPC } from '../../shared/ipc';
import { t } from '../../shared/i18n';
import { appMenuItems } from './app-menu-items';
import type { AppController } from '../app-controller';

export function buildAppMenu(controller: AppController, win: BrowserWindow): Menu {
  const active = (): Electron.WebContents | null => controller.activeWebContents();
  const mac = process.platform === 'darwin';
  const accountItems: MenuItemConstructorOptions[] = Array.from({ length: 9 }, (_, i) => ({
    label: t('main.menu.account', { n: String(i + 1) }),
    accelerator: `CmdOrCtrl+${i + 1}`,
    click: () => controller.selectByShortcut(i + 1),
  }));

  const template: MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: appMenuItems(process.platform, [
        { label: t('main.menu.checkForUpdates'), click: () => (controller.checkForUpdates(), controller.showUpdates()) },
        { type: 'separator' },
        { label: t('main.menu.settings'), accelerator: 'CmdOrCtrl+,', click: () => controller.openSettings() },
        { label: t('main.menu.assistant'), accelerator: 'CmdOrCtrl+J', click: () => controller.toggleAssistant() },
        { label: t('main.menu.connectClaude'), click: () => win.webContents.send(IPC.openConnectClaude) },
      ], () => controller.openSettings('about')),
    },
    // The Edit and Window menus are Electron's (editMenu, windowMenu), written out so their labels follow the language.
    {
      role: 'editMenu',
      label: t('main.menu.edit'),
      submenu: [
        { role: 'undo', label: t('main.menu.undo') },
        { role: 'redo', label: t('main.menu.redo') },
        { type: 'separator' },
        { role: 'cut', label: t('main.menu.cut') },
        { role: 'copy', label: t('main.menu.copy') },
        { role: 'paste', label: t('main.menu.paste') },
        ...(mac
          ? ([
              { role: 'pasteAndMatchStyle', label: t('main.menu.pasteAndMatchStyle') },
              { role: 'delete', label: t('common.delete') },
              { role: 'selectAll', label: t('main.menu.selectAll') },
              { type: 'separator' },
              {
                label: t('main.menu.speech'),
                submenu: [
                  { role: 'startSpeaking', label: t('main.menu.startSpeaking') },
                  { role: 'stopSpeaking', label: t('main.menu.stopSpeaking') },
                ],
              },
            ] as MenuItemConstructorOptions[])
          : ([
              { role: 'delete', label: t('common.delete') },
              { type: 'separator' },
              { role: 'selectAll', label: t('main.menu.selectAll') },
            ] as MenuItemConstructorOptions[])),
      ],
    },
    {
      label: t('main.menu.view'),
      submenu: [
        {
          label: t('main.menu.reload'),
          accelerator: 'CmdOrCtrl+R',
          click: () => (controller.isCalendarOpen() ? win.webContents.send(IPC.calendarReload) : active()?.reload()),
        },
        {
          label: t('common.back'),
          accelerator: 'CmdOrCtrl+[',
          click: () => {
            const h = active()?.navigationHistory;
            if (h?.canGoBack()) h.goBack();
          },
        },
        {
          label: t('main.menu.forward'),
          accelerator: 'CmdOrCtrl+]',
          click: () => {
            const h = active()?.navigationHistory;
            if (h?.canGoForward()) h.goForward();
          },
        },
        { type: 'separator' },
        {
          label: t('main.menu.sidebarStyle'),
          submenu: (
            [
              ['folders', t('main.menu.sidebarFolders')],
              ['panel', t('main.menu.sidebarPanel')],
              ['sections', t('main.menu.sidebarSections')],
            ] as const
          ).map(([style, label]) => ({
            id: `sidebar-style-${style}`,
            label,
            type: 'radio' as const,
            checked: controller.sidebarStyle() === style,
            click: () => controller.setSidebarStyle(style),
          })),
        },
        { type: 'separator' },
        { label: t('main.menu.devTools'), accelerator: 'Alt+CmdOrCtrl+I', click: () => active()?.toggleDevTools() },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t('main.menu.toggleFullScreen') },
      ],
    },
    {
      label: t('main.menu.accounts'),
      submenu: [
        { label: t('main.menu.home'), accelerator: 'CmdOrCtrl+T', click: () => controller.openToday() },
        { label: t('main.menu.allCalendars'), accelerator: 'CmdOrCtrl+0', click: () => controller.openCalendar() },
        // Quick actions (also on the sidebar's ⚡ button). ⌃⌘ keeps clear of the apps' own shortcuts
        // (⌘⇧M is Slack's Mentions); Ctrl+Alt+T would open a terminal on Linux, hence D.
        { label: t('main.menu.copyMeetLink'), accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+M' : 'Ctrl+Alt+M', click: () => void controller.copyMeetingLink() },
        { label: t('main.menu.newEvent'), accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+E' : 'Ctrl+Alt+E', click: () => controller.newEvent() },
        { label: t('main.menu.newTodo'), accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+T' : 'Ctrl+Alt+D', click: () => controller.newTodo() },
        { type: 'separator' },
        ...accountItems,
        { type: 'separator' },
        { label: t('main.menu.stopClaude'), accelerator: 'CmdOrCtrl+.', click: () => controller.stopClaude() },
      ],
    },
    {
      role: 'windowMenu',
      label: t('main.menu.window'),
      submenu: [
        { role: 'minimize', label: t('main.menu.minimize') },
        { role: 'zoom', label: t('main.menu.zoom') },
        ...(mac
          ? ([{ type: 'separator' }, { role: 'front', label: t('main.menu.front') }] as MenuItemConstructorOptions[])
          : ([{ role: 'close', label: t('common.close') }] as MenuItemConstructorOptions[])),
      ],
    },
    {
      role: 'help',
      label: t('main.menu.help'),
      submenu: [
        { label: t('main.menu.siteMissionDesk'), click: () => void shell.openExternal(SITE) },
        { label: t('main.menu.siteRumiLabs'), click: () => void shell.openExternal(WEBSITE) },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}
