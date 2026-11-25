import { parseLinkClick, wantsBrowser } from '../src/main/links/click';

const at = 1_000_000;
const plain = { meta: false, ctrl: false, middle: false, at };

describe('Cmd-click opens the browser', () => {
  test('Cmd on a Mac, Ctrl elsewhere', () => {
    expect(wantsBrowser({ ...plain, meta: true }, 'foreground-tab', 'darwin', at + 50)).toBe(true);
    expect(wantsBrowser({ ...plain, ctrl: true }, 'foreground-tab', 'darwin', at + 50)).toBe(false); // Ctrl-click is a right-click on a Mac
    expect(wantsBrowser({ ...plain, ctrl: true }, 'foreground-tab', 'win32', at + 50)).toBe(true);
    expect(wantsBrowser({ ...plain, meta: true }, 'foreground-tab', 'linux', at + 50)).toBe(false);
  });

  test('a middle click opens the browser too', () => {
    expect(wantsBrowser({ ...plain, middle: true }, 'foreground-tab', 'darwin', at + 50)).toBe(true);
  });

  test('a plain click stays inside', () => {
    expect(wantsBrowser(plain, 'foreground-tab', 'darwin', at + 50)).toBe(false);
    expect(wantsBrowser(undefined, 'foreground-tab', 'darwin', at)).toBe(false);
  });

  test("Chromium's own background-tab signal counts even without the page's report", () => {
    expect(wantsBrowser(undefined, 'background-tab', 'darwin', at)).toBe(true);
  });

  test('an old click does not count (a link the page opens later on its own)', () => {
    expect(wantsBrowser({ ...plain, meta: true }, 'foreground-tab', 'darwin', at + 5000)).toBe(false);
  });

  test("the page's report is checked (untrusted)", () => {
    expect(parseLinkClick({ meta: true, ctrl: false, middle: false }, at)).toEqual({ meta: true, ctrl: false, middle: false, at });
    expect(parseLinkClick({ meta: 'yes' }, at)).toEqual({ meta: false, ctrl: false, middle: false, at });
    expect(parseLinkClick(null, at)).toBeNull();
  });
});
