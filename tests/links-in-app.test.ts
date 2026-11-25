import { routeLink, routeRedirect } from '../src/main/links/router';

// "Open links inside Mission Desk": a plain click on a link to another site opens it as a tab
// beside the app it came from; Cmd-click (Ctrl-click) sends it to the browser.
describe('links open inside Mission Desk', () => {
  test('a plain click on another site opens a tab beside the app', () => {
    expect(routeLink({ service: 'slack', url: 'https://github.com/x', disposition: 'new-window', inApp: true })).toEqual({
      kind: 'extra-tab', url: 'https://github.com/x',
    });
    expect(routeLink({ service: 'whatsapp', url: 'https://example.com/', disposition: 'new-window', inApp: true })).toEqual({
      kind: 'extra-tab', url: 'https://example.com/',
    });
  });

  test("Gmail's wrapped links open the real address in a tab", () => {
    expect(
      routeLink({ service: 'google', url: 'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fx&sa=D', disposition: 'new-window', inApp: true }),
    ).toEqual({ kind: 'extra-tab', url: 'https://example.com/x' });
  });

  test('a same-window link to another site opens a tab too (the app stays where it was)', () => {
    expect(
      routeLink({ service: 'slack', url: 'https://github.com/x', disposition: 'navigate', currentUrl: 'https://app.slack.com/client', inApp: true }),
    ).toEqual({ kind: 'extra-tab', url: 'https://github.com/x' });
  });

  test('Cmd-click sends the link to the browser', () => {
    expect(routeLink({ service: 'slack', url: 'https://github.com/x', disposition: 'new-window', inApp: true, toBrowser: true })).toEqual({
      kind: 'external', url: 'https://github.com/x',
    });
    // …even a link that would open as one of the account's own tabs
    expect(routeLink({ service: 'google', url: 'https://docs.google.com/document/d/abc', disposition: 'new-window', inApp: true, toBrowser: true })).toEqual({
      kind: 'external', url: 'https://docs.google.com/document/d/abc',
    });
  });

  test('Cmd-click never breaks a sign-in popup', () => {
    expect(routeLink({ service: 'google', url: 'https://accounts.google.com/AccountChooser', disposition: 'new-window', inApp: true, toBrowser: true })).toEqual({
      kind: 'auth-popup',
    });
  });

  test('the service\'s own pages keep their tabs', () => {
    expect(routeLink({ service: 'google', url: 'https://calendar.google.com/calendar/r', disposition: 'new-window', inApp: true })).toEqual({
      kind: 'subapp', subApp: 'calendar', url: 'https://calendar.google.com/calendar/r',
    });
    expect(routeLink({ service: 'slack', url: 'https://app.slack.com/client/T1/C1', disposition: 'navigate', inApp: true })).toEqual({ kind: 'stay' });
  });

  test('mail, phone and app links still go to the system', () => {
    expect(routeLink({ service: 'slack', url: 'mailto:a@example.com', disposition: 'new-window', inApp: true })).toEqual({
      kind: 'external', url: 'mailto:a@example.com',
    });
    expect(routeLink({ service: 'slack', url: 'zoommtg://zoom.us/join?confno=1', disposition: 'new-window', inApp: true })).toEqual({
      kind: 'external', url: 'zoommtg://zoom.us/join?confno=1',
    });
  });

  test('a sign-in for another app still goes to the browser', () => {
    expect(
      routeLink({
        service: 'slack',
        url: 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example%2Fcb',
        disposition: 'new-window',
        inApp: true,
      }),
    ).toEqual({ kind: 'external', url: 'https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fevil.example%2Fcb' });
  });

  test('switched off, links go to the browser as before', () => {
    expect(routeLink({ service: 'slack', url: 'https://github.com/x', disposition: 'new-window' })).toEqual({
      kind: 'external', url: 'https://github.com/x',
    });
  });
});

describe('inside a link tab', () => {
  test('clicking around the opened site stays in the tab', () => {
    expect(
      routeLink({ service: 'slack', url: 'https://github.com/y', disposition: 'navigate', currentUrl: 'https://github.com/x', inApp: true, browsing: true }),
    ).toEqual({ kind: 'stay' });
    expect(
      routeLink({ service: 'slack', url: 'https://other.example/', disposition: 'navigate', currentUrl: 'https://github.com/x', inApp: true, browsing: true }),
    ).toEqual({ kind: 'stay' });
  });

  test('a link that opens a new window becomes another tab', () => {
    expect(
      routeLink({ service: 'slack', url: 'https://other.example/', disposition: 'new-window', currentUrl: 'https://github.com/x', inApp: true, browsing: true }),
    ).toEqual({ kind: 'extra-tab', url: 'https://other.example/' });
  });

  test('a redirect (a short link) is followed in the tab', () => {
    expect(routeRedirect({ service: 'slack', url: 'https://target.example/page', chain: { signIn: false, trusted: false }, browsing: true })).toBe('allow');
  });

  test('redirects in the app itself are checked as before', () => {
    expect(routeRedirect({ service: 'slack', url: 'https://target.example/page', chain: { signIn: false, trusted: false } })).toBe('external');
  });

  test('a redirect to a non-web address still goes to the system', () => {
    expect(routeRedirect({ service: 'slack', url: 'zoommtg://zoom.us/join', chain: { signIn: false, trusted: false }, browsing: true })).toBe('external');
  });
});
