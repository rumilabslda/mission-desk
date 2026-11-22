import { type MessageKey, t } from './i18n';

/** Updates come from Mission Desk's GitHub releases (electron-updater); no server of our own. */

/** auto: download and install; notify: only say a new version exists (a .deb); off: a dev build. */
export type UpdateMode = 'auto' | 'notify' | 'off';

export type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking'; manual: boolean }
  | { kind: 'none' } // up to date
  | { kind: 'available'; version: string } // notify mode
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'ready'; version: string }
  | { kind: 'error'; message: string };

export type UpdateEvent =
  | { type: 'checking'; manual: boolean }
  | { type: 'available'; version: string }
  | { type: 'none' }
  | { type: 'progress'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };

export function updateMode(platform: string, env: { APPIMAGE?: string }, packaged: boolean): UpdateMode {
  if (!packaged) return 'off';
  // On Linux only the AppImage can replace itself; a .deb is updated by hand (or the system's tools).
  if (platform === 'linux' && !env.APPIMAGE) return 'notify';
  return 'auto';
}

// The message is written in the interface language when the error happens.
const CHECK_FAILED: MessageKey = 'main.updates.checkFailed';
const CHECK_FAILED_OTHER: MessageKey = 'main.updates.checkFailedOther';
const DOWNLOAD_FAILED: MessageKey = 'main.updates.downloadFailed';
const INSTALL_FAILED: MessageKey = 'main.updates.installFailed';
const NETWORK = /net::|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENETUNREACH|offline|network|socket hang up/i;

export function nextUpdateState(s: UpdateState, e: UpdateEvent, mode: UpdateMode): UpdateState {
  // A downloaded update waits for the restart, whatever happens next, unless installing it fails
  // (macOS checks the new copy after the download, e.g. its signature).
  if (s.kind === 'ready') return e.type === 'error' ? { kind: 'error', message: t(INSTALL_FAILED) } : s;
  switch (e.type) {
    case 'checking':
      if (s.kind === 'downloading') return s;
      if (s.kind === 'available' && !e.manual) return s; // keep saying a new version exists
      return { kind: 'checking', manual: e.manual };
    case 'available':
      return mode === 'auto' ? { kind: 'downloading', version: e.version, percent: 0 } : { kind: 'available', version: e.version };
    case 'none':
      return { kind: 'none' };
    case 'progress':
      return s.kind === 'downloading' ? { ...s, percent: Math.round(Math.max(0, Math.min(100, e.percent))) } : s;
    case 'downloaded':
      return { kind: 'ready', version: e.version };
    case 'error':
      if (s.kind === 'error' || s.kind === 'available') return s; // reported twice, or a .deb that already knows
      if (s.kind === 'downloading') return { kind: 'error', message: t(DOWNLOAD_FAILED) };
      // A check in the background that fails (offline, say) stays quiet; one the user asked for says so.
      if (!(s.kind === 'checking' && s.manual)) return { kind: 'idle' };
      return { kind: 'error', message: t(NETWORK.test(e.message) ? CHECK_FAILED : CHECK_FAILED_OTHER) };
  }
}
