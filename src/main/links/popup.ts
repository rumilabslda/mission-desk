/**
 * The window for a sign-in popup ("Sign in with Google", Apple, Microsoft…): small, over
 * Mission Desk, in the app's own session.
 * Not full-screen capable: with Mission Desk full screen, macOS would give it a full-screen
 * space of its own (the whole screen for a sign-in page), and closing it left a black screen.
 * This way it floats over the full-screen window instead.
 */
export function signInPopupOptions<W, S>(parent: W, session: S) {
  return {
    width: 520,
    height: 680,
    parent,
    fullscreenable: false,
    webPreferences: { session, contextIsolation: true, sandbox: true },
  };
}
