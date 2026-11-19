import fs from 'node:fs';
import { autoUpdater } from 'electron-updater';
import { nextUpdateState, type UpdateEvent, type UpdateMode, type UpdateState } from '../../shared/updates';

const FIRST_CHECK_MS = 60_000; // a minute after launch, so it never slows the start
const EVERY_MS = 6 * 60 * 60_000;

export interface Updater {
  state(): UpdateState;
  /** Looks for a new version now (`manual`: the user asked, so a failure is shown). */
  check(manual: boolean): void;
  /** Quits and installs a downloaded update. */
  install(): void;
  /** Starts the checks in the background (they happen only while `enabled()`). */
  start(): void;
}

/**
 * Updates from Mission Desk's GitHub releases (the latest-*.yml files the release workflow uploads).
 * Nothing is sent but the request for those files.
 */
export function createUpdater(deps: { mode: UpdateMode; logFile: string; enabled(): boolean; onChange(s: UpdateState): void }): Updater {
  let state: UpdateState = { kind: 'idle' };
  const apply = (e: UpdateEvent): void => {
    const next = nextUpdateState(state, e, deps.mode);
    if (next === state) return;
    state = next;
    deps.onChange(state);
  };

  if (deps.mode === 'off') {
    return { state: () => state, check: () => {}, install: () => {}, start: () => {} };
  }

  autoUpdater.autoDownload = deps.mode === 'auto';
  autoUpdater.autoInstallOnAppQuit = deps.mode === 'auto'; // a downloaded update also installs on a normal quit
  // Warnings and errors only, in updates.log (the data folder), to understand a report; kept small.
  const log = (level: string, msg: unknown): void => {
    try {
      if (fs.existsSync(deps.logFile) && fs.statSync(deps.logFile).size > 200_000) fs.rmSync(deps.logFile);
      fs.appendFileSync(deps.logFile, `${new Date().toISOString()} ${level} ${String(msg).slice(0, 2000)}\n`);
    } catch {
      // never let logging break updates
    }
  };
  autoUpdater.logger = { info: () => {}, debug: () => {}, warn: (m: unknown) => log('warn', m), error: (m: unknown) => log('error', m) };
  autoUpdater.on('update-available', (info) => apply({ type: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => apply({ type: 'none' }));
  autoUpdater.on('download-progress', (p) => apply({ type: 'progress', percent: p.percent }));
  autoUpdater.on('update-downloaded', (info) => apply({ type: 'downloaded', version: info.version }));
  autoUpdater.on('error', (err: Error) => apply({ type: 'error', message: err?.message ?? 'error' }));

  function check(manual: boolean): void {
    if (state.kind === 'downloading' || state.kind === 'ready' || state.kind === 'checking') return;
    apply({ type: 'checking', manual });
    autoUpdater.checkForUpdates().catch((err: Error) => apply({ type: 'error', message: err?.message ?? 'error' }));
  }

  return {
    state: () => state,
    check,
    install() {
      if (state.kind === 'ready') setImmediate(() => autoUpdater.quitAndInstall());
    },
    start() {
      setTimeout(() => deps.enabled() && check(false), FIRST_CHECK_MS);
      setInterval(() => deps.enabled() && check(false), EVERY_MS);
    },
  };
}
