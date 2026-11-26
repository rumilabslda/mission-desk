import { signInPopupOptions } from '../src/main/links/popup';

// "Sign in with Google" (or Apple, Microsoft…) opens a small popup in the app's own session.
describe('sign-in popup window', () => {
  const parent = { id: 'main' };
  const session = { id: 'persist:acc-1' };

  test("never gets a full-screen space of its own (with Mission Desk full screen, closing it left the screen black)", () => {
    expect(signInPopupOptions(parent, session).fullscreenable).toBe(false);
  });

  test("is a small window over Mission Desk, in the app's own session, sandboxed", () => {
    const o = signInPopupOptions(parent, session);
    expect(o.parent).toBe(parent);
    expect(o.width).toBe(520);
    expect(o.height).toBe(680);
    expect(o.webPreferences).toEqual({ session, contextIsolation: true, sandbox: true });
  });
});
