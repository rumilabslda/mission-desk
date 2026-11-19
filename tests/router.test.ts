import { isSafeExternal, routeLink, type LinkDecision } from '../src/main/links/router';
import type { ServiceId } from '../src/shared/types';

type Row = [ServiceId, string, 'navigate' | 'new-window', LinkDecision];

const rows: Row[] = [
  ['google', 'https://mail.google.com/mail/u/0/#inbox', 'navigate', { kind: 'stay' }],
  ['google', 'https://docs.google.com/document/d/abc', 'new-window', { kind: 'extra-tab', url: 'https://docs.google.com/document/d/abc' }],
  ['google', 'https://calendar.google.com/calendar/r', 'new-window', { kind: 'subapp', subApp: 'calendar', url: 'https://calendar.google.com/calendar/r' }],
  ['google', 'https://meet.google.com/abc-defg-hij', 'new-window', { kind: 'subapp', subApp: 'meet', url: 'https://meet.google.com/abc-defg-hij' }],
  ['google', 'https://accounts.google.com/AccountChooser', 'new-window', { kind: 'auth-popup' }],
  ['google', 'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fx&sa=D', 'new-window', { kind: 'external', url: 'https://example.com/x' }],
  ['google', 'https://www.google.com/url?q=https%3A%2F%2Fdocs.google.com%2Fdocument%2Fd%2Fabc', 'new-window', { kind: 'extra-tab', url: 'https://docs.google.com/document/d/abc' }],
  ['google', 'https://example.com', 'new-window', { kind: 'external', url: 'https://example.com' }],
  ['slack', 'https://app.slack.com/client/T1/C1', 'navigate', { kind: 'stay' }],
  ['slack', 'https://acme.slack.com/sso/saml/start', 'new-window', { kind: 'auth-popup' }],
  ['slack', 'https://accounts.google.com/o/oauth2/auth?x=1', 'new-window', { kind: 'auth-popup' }],
  ['slack', 'https://github.com/x', 'new-window', { kind: 'external', url: 'https://github.com/x' }],
  ['whatsapp', 'https://web.whatsapp.com/', 'navigate', { kind: 'stay' }],
  ['whatsapp', 'https://example.com', 'new-window', { kind: 'external', url: 'https://example.com' }],
  ['google', 'mailto:a@example.com', 'new-window', { kind: 'external', url: 'mailto:a@example.com' }],
  ['slack', 'mailto:a@example.com', 'navigate', { kind: 'external', url: 'mailto:a@example.com' }],
  // In-page sign-in flows must stay inside the account's view.
  ['slack', 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x', 'navigate', { kind: 'stay' }],
  ['slack', 'https://acme.slack.com/sso/saml/start', 'navigate', { kind: 'stay' }],
  // A Gmail popup (attachment, print) must not replace the inbox.
  ['google', 'https://mail.google.com/mail/u/0/?ui=2&view=att&th=1', 'new-window', { kind: 'extra-tab', url: 'https://mail.google.com/mail/u/0/?ui=2&view=att&th=1' }],
];

test.each([
  ['https://example.com/a', true],
  ['http://example.com', true],
  ['mailto:a@example.com', true],
  ['tel:+351000000000', true],
  ['file:///etc/passwd', false],
  ['slack://open', false],
  ['javascript:alert(1)', false],
  ['not a url', false],
])('isSafeExternal(%s) → %s', (url, expected) => {
  expect(isSafeExternal(url)).toBe(expected);
});

test.each(rows)('%s %s (%s)', (service, url, disposition, expected) => {
  expect(routeLink({ service, url, disposition })).toEqual(expected);
});

describe('final review fixes', () => {
  test('every *.google.com host belongs to the Google account (Chat, Keep, Admin…)', () => {
    expect(routeLink({ service: 'google', url: 'https://chat.google.com/room/x', disposition: 'new-window' })).toEqual({
      kind: 'extra-tab', url: 'https://chat.google.com/room/x',
    });
    expect(routeLink({ service: 'google', url: 'https://myaccount.google.com/security', disposition: 'navigate' })).toEqual({ kind: 'stay' });
  });

  test('www.google.com search pages are not part of the account', () => {
    expect(routeLink({ service: 'google', url: 'https://www.google.com/search?q=x', disposition: 'new-window' })).toEqual({
      kind: 'external', url: 'https://www.google.com/search?q=x',
    });
  });

  test('navigation stays in the view while an off-site sign-in (SSO) is in progress', () => {
    expect(
      routeLink({
        service: 'google',
        url: 'https://idp.example.com/saml/callback',
        disposition: 'navigate',
        currentUrl: 'https://acme.okta.com/login',
        signingIn: true,
      }),
    ).toEqual({ kind: 'stay' });
    // not signing in: an off-site page can't keep the view off-site
    expect(
      routeLink({ service: 'google', url: 'https://evil.example/', disposition: 'navigate', currentUrl: 'https://acme.okta.com/login' }),
    ).toEqual({ kind: 'external', url: 'https://evil.example/' });
  });

  test('a normal in-page link from the service itself still goes to the browser', () => {
    expect(
      routeLink({ service: 'slack', url: 'https://github.com/x', disposition: 'navigate', currentUrl: 'https://app.slack.com/client' }),
    ).toEqual({ kind: 'external', url: 'https://github.com/x' });
  });

  test('a Meet link during a call opens as an extra tab instead of replacing the call', () => {
    expect(
      routeLink({ service: 'google', url: 'https://meet.google.com/next-call', disposition: 'new-window', busySubApps: ['meet'] }),
    ).toEqual({ kind: 'extra-tab', url: 'https://meet.google.com/next-call' });
  });
});
