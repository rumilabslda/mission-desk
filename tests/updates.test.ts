import { nextUpdateState, updateMode, type UpdateState } from '../src/shared/updates';

describe('how Mission Desk updates itself', () => {
  test('installed apps update themselves; a .deb only says a new version exists; a dev build never checks', () => {
    expect(updateMode('darwin', {}, true)).toBe('auto');
    expect(updateMode('win32', {}, true)).toBe('auto');
    expect(updateMode('linux', { APPIMAGE: '/home/x/Mission-Desk-linux-x86_64.AppImage' }, true)).toBe('auto');
    expect(updateMode('linux', {}, true)).toBe('notify'); // installed from the .deb: updated by hand
    expect(updateMode('darwin', {}, false)).toBe('off');
  });

  const idle: UpdateState = { kind: 'idle' };

  test('auto: a new version downloads, then waits for a restart', () => {
    let s = nextUpdateState(idle, { type: 'checking', manual: false }, 'auto');
    s = nextUpdateState(s, { type: 'available', version: '1.0.1' }, 'auto');
    expect(s).toEqual({ kind: 'downloading', version: '1.0.1', percent: 0 });
    s = nextUpdateState(s, { type: 'progress', percent: 41.7 }, 'auto');
    expect(s).toEqual({ kind: 'downloading', version: '1.0.1', percent: 42 });
    s = nextUpdateState(s, { type: 'downloaded', version: '1.0.1' }, 'auto');
    expect(s).toEqual({ kind: 'ready', version: '1.0.1' });
    // A later check doesn't hide a downloaded update.
    expect(nextUpdateState(s, { type: 'checking', manual: false }, 'auto')).toEqual(s);
  });

  test('notify: it only says a new version exists', () => {
    expect(nextUpdateState(idle, { type: 'available', version: '1.1.0' }, 'notify')).toEqual({ kind: 'available', version: '1.1.0' });
  });

  test('up to date, and errors: shown only after a check the user asked for', () => {
    const asked = nextUpdateState(idle, { type: 'checking', manual: true }, 'auto');
    expect(nextUpdateState(asked, { type: 'none' }, 'auto')).toEqual({ kind: 'none' });
    expect(nextUpdateState(asked, { type: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' }, 'auto')).toEqual({ kind: 'error', message: 'Couldn’t reach GitHub to check. Check your connection and try again.' });
    const background = nextUpdateState(idle, { type: 'checking', manual: false }, 'auto');
    expect(nextUpdateState(background, { type: 'error', message: 'offline' }, 'auto')).toEqual({ kind: 'idle' }); // silent
  });

  test('a failed download after it started is shown, so the user can try again', () => {
    const s: UpdateState = { kind: 'downloading', version: '1.0.1', percent: 30 };
    expect(nextUpdateState(s, { type: 'error', message: 'socket hang up' }, 'auto').kind).toBe('error');
  });
});

test('the same error reported twice keeps its message', () => {
  const err: UpdateState = { kind: 'error', message: 'Couldn’t reach GitHub to check. Check your connection and try again.' };
  expect(nextUpdateState(err, { type: 'error', message: 'again' }, 'auto')).toBe(err);
});

describe('after the review', () => {
  test('an install that fails after "ready" (e.g. macOS refusing the new copy) is shown, not stuck on ready', () => {
    const ready: UpdateState = { kind: 'ready', version: '1.0.1' };
    expect(nextUpdateState(ready, { type: 'error', message: 'Code signature did not pass validation' }, 'auto')).toEqual({
      kind: 'error',
      message: 'The update couldn’t be installed. Download the new version from the website instead.',
    });
    expect(nextUpdateState(ready, { type: 'checking', manual: false }, 'auto')).toBe(ready);
  });

  test('a manual check that fails for another reason than the network says so neutrally', () => {
    const asked: UpdateState = { kind: 'checking', manual: true };
    expect(nextUpdateState(asked, { type: 'error', message: 'Cannot find latest-mac.yml (ERR_UPDATER_LATEST_VERSION_NOT_FOUND)' }, 'auto')).toEqual({
      kind: 'error',
      message: 'Couldn’t check for a new version right now. Try again later.',
    });
    expect(nextUpdateState(asked, { type: 'error', message: 'net::ERR_NAME_NOT_RESOLVED' }, 'auto')).toEqual({
      kind: 'error',
      message: 'Couldn’t reach GitHub to check. Check your connection and try again.',
    });
  });

  test('notify: "version X is available" survives a background check that fails', () => {
    const available: UpdateState = { kind: 'available', version: '1.1.0' };
    const s = nextUpdateState(available, { type: 'checking', manual: false }, 'notify');
    expect(nextUpdateState(s, { type: 'error', message: 'offline' }, 'notify')).toEqual(available);
  });
});
