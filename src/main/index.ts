import path from 'node:path';
import { BACKGROUND_SWITCHES } from './views/throttling';
import { app, autoUpdater as nativeUpdater, BrowserWindow, dialog, Menu } from 'electron';
import { createStore } from './accounts/store';
import { createAppController } from './app-controller';
import { registerIpc } from './ipc';
import { buildAppMenu } from './menu/menu';
import { aboutPanelOptions } from './about-panel';
import { enablePasskeys, watchPasskeySessions } from './passkeys';
import { setElectronUserAgent } from './views/session';
import { chromeUserAgent } from './views/user-agent';
import { APP_ID, APP_NAME } from '../shared/about';
import { loadCatalogs } from '../shared/i18n/catalogs';

loadCatalogs();

// Electron names the data folder and the keychain entry that encrypts cookies ("Mission Desk Safe Storage")
// after app.name. Changing the name later would sign everyone out of every app. Never change it.
app.setName(APP_NAME);
app.setPath('userData', path.join(app.getPath('appData'), APP_NAME));
// Windows shows notifications only for an app with an id (the same as the installer's).
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);
setElectronUserAgent(app.userAgentFallback);
app.userAgentFallback = chromeUserAgent(app.userAgentFallback);

for (const s of BACKGROUND_SWITCHES) app.commandLine.appendSwitch(s);

// Development-only switches, ignored in the packaged app.
if (!app.isPackaged) {
  if (process.env.MISSIONDESK_USER_DATA) app.setPath('userData', process.env.MISSIONDESK_USER_DATA);
  if (process.env.MISSIONDESK_DEBUG_PORT) app.commandLine.appendSwitch('remote-debugging-port', process.env.MISSIONDESK_DEBUG_PORT);
}

const isPrimaryInstance = app.requestSingleInstanceLock();
let controllerRef: { shutdown(): Promise<void> } | null = null;
let quitting = false;

function createWindow(): void {
  const store = createStore(path.join(app.getPath('userData'), 'accounts.json'));
  const bounds = store.state().window;
  const win = new BrowserWindow({
    ...bounds,
    minWidth: 640,
    minHeight: 420,
    title: 'Mission Desk',
    backgroundColor: '#1c1d22',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/ui.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  const controller = createAppController({
    win,
    store,
    preloadPath: path.join(__dirname, '../preload/service.js'),
    uiPreloadPath: path.join(__dirname, '../preload/ui.js'),
  });
  registerIpc(win, controller);
  controllerRef = controller;
  // The menus and the About panel are written in the interface language (set by the controller), again on a change.
  const applyLanguage = (): void => {
    app.setAboutPanelOptions(aboutPanelOptions(app.getVersion()));
    Menu.setApplicationMenu(buildAppMenu(controller, win));
  };
  controller.setMenuBuilder(applyLanguage);
  applyLanguage();
  enablePasskeys(() => win); // after the controller: the Touch ID prompt is written in the interface language
  if (!app.isPackaged) (globalThis as Record<string, unknown>).__missiondeskDev = { controller }; // dev-only inspection

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const saveBounds = (): void => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!win.isDestroyed() && !win.isFullScreen()) store.setWindow(win.getBounds());
    }, 500);
  };
  win.on('resize', () => {
    controller.layout();
    saveBounds();
  });
  win.on('move', saveBounds);

  win.once('ready-to-show', () => {
    win.show();
    controller.start();
    const warning = store.loadWarning();
    if (warning) void dialog.showMessageBox(win, { type: 'warning', message: warning });
  });

  // ⌘W / the red button hide the window like other Mac apps: accounts keep
  // running, notifications keep arriving. ⌘Q quits.
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    if (win.isFullScreen()) {
      win.once('leave-full-screen', () => win.hide());
      win.setFullScreen(false);
    } else {
      win.hide();
    }
  });
  app.on('activate', () => win.show());

  // The UI window only ever shows our own page (e.g. a file dropped on it must not replace it).
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void win.loadFile(path.join(__dirname, '../renderer/index.html'));

  app.on('second-instance', () => {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}

if (!isPrimaryInstance) {
  app.quit(); // Mission Desk is already running; that instance comes to the front.
} else {
  app.on('before-quit', () => {
    quitting = true;
  });
  // Installing an update on macOS closes the windows first and only then quits: the close handler
  // must let them close (instead of hiding the window), or "Restart to update" does nothing.
  nativeUpdater.on('before-quit-for-update', () => {
    quitting = true;
  });
  app.on('will-quit', () => {
    // Remove the Claude socket file; the process is exiting either way.
    void controllerRef?.shutdown();
  });
  watchPasskeySessions(); // before any app's session exists
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
