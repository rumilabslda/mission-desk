import { app, type BrowserWindow, Menu, type MenuItemConstructorOptions, shell } from 'electron';
import { APP_NAME, SITE, WEBSITE } from '../../shared/about';
import { IPC } from '../../shared/ipc';
import { appMenuItems } from './app-menu-items';
import type { AppController } from '../app-controller';

export function buildAppMenu(controller: AppController, win: BrowserWindow): Menu {
  const active = (): Electron.WebContents | null => controller.activeWebContents();
  const accountItems: MenuItemConstructorOptions[] = Array.from({ length: 9 }, (_, i) => ({
    label: `Account ${i + 1}`,
    accelerator: `CmdOrCtrl+${i + 1}`,
    click: () => controller.selectByShortcut(i + 1),
  }));

  const template: MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: appMenuItems(process.platform, [
        { label: 'Check for Updates…', click: () => (controller.checkForUpdates(), controller.showUpdates()) },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: () => controller.openSettings() },
        { label: 'Assistant', accelerator: 'CmdOrCtrl+J', click: () => controller.toggleAssistant() },
        { label: 'Connect Claude…', click: () => win.webContents.send(IPC.openConnectClaude) },
      ], () => controller.openSettings('about')),
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => (controller.isCalendarOpen() ? win.webContents.send(IPC.calendarReload) : active()?.reload()),
        },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => {
            const h = active()?.navigationHistory;
            if (h?.canGoBack()) h.goBack();
          },
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => {
            const h = active()?.navigationHistory;
            if (h?.canGoForward()) h.goForward();
          },
        },
        { type: 'separator' },
        {
          label: 'Sidebar style',
          submenu: (
            [
              ['folders', 'Folders'],
              ['panel', 'Folders with panel'],
              ['sections', 'Sections'],
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
        { label: 'Developer Tools for This Account', accelerator: 'Alt+CmdOrCtrl+I', click: () => active()?.toggleDevTools() },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Accounts',
      submenu: [
        { label: 'Home', accelerator: 'CmdOrCtrl+T', click: () => controller.openToday() },
        { label: 'All Calendars', accelerator: 'CmdOrCtrl+0', click: () => controller.openCalendar() },
        // Quick actions (also on the sidebar's ⚡ button). ⌃⌘ keeps clear of the apps' own shortcuts
        // (⌘⇧M is Slack's Mentions); Ctrl+Alt+T would open a terminal on Linux, hence D.
        { label: 'Copy Meet Link', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+M' : 'Ctrl+Alt+M', click: () => void controller.copyMeetingLink() },
        { label: 'New Event', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+E' : 'Ctrl+Alt+E', click: () => controller.newEvent() },
        { label: 'New To-do', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+T' : 'Ctrl+Alt+D', click: () => controller.newTodo() },
        { type: 'separator' },
        ...accountItems,
        { type: 'separator' },
        { label: 'Stop Claude', accelerator: 'CmdOrCtrl+.', click: () => controller.stopClaude() },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'Mission Desk Website', click: () => void shell.openExternal(SITE) },
        { label: 'Rumi Labs Website', click: () => void shell.openExternal(WEBSITE) },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}
