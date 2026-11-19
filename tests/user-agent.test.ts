import { chromeUserAgent, googleSignInUserAgent, userAgentFor } from '../src/main/views/user-agent';

const ua =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Mission Desk/0.1.0 Chrome/140.0.7339.41 Electron/45.3.4 Safari/537.36';

test('strips Electron and app tokens', () => {
  expect(chromeUserAgent(ua)).toBe(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.41 Safari/537.36',
  );
});

test('leaves a plain Chrome UA unchanged', () => {
  const chrome =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
  expect(chromeUserAgent(chrome)).toBe(chrome);
});

describe('userAgentFor', () => {
  // Google rejects a Chrome-shaped UA whose client hints say Chromium; it accepts Electron's own UA.
  test('google accounts keep the unmodified Electron user agent', () => {
    expect(userAgentFor('google', ua)).toBe(ua);
  });
  test('slack and whatsapp get the Chrome-shaped user agent', () => {
    expect(userAgentFor('slack', ua)).toBe(chromeUserAgent(ua));
    expect(userAgentFor('whatsapp', ua)).toBe(chromeUserAgent(ua));
  });
});

test("Google's sign-in, inside another app (Slack, LinkedIn, a website), gets the Electron user agent Google accepts", () => {
  expect(googleSignInUserAgent('custom', 'https://accounts.google.com/o/oauth2/auth?x', ua)).toBe(ua);
  expect(googleSignInUserAgent('linkedin', 'https://accounts.google.com/gsi/select', ua)).toBe(ua);
  expect(googleSignInUserAgent('google', 'https://accounts.google.com/', ua)).toBeNull(); // already its own
  expect(googleSignInUserAgent('custom', 'https://www.notion.so/', ua)).toBeNull();
});
