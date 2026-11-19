import { routeLink, routePopup, signInFor } from '../src/main/links/router';
import { isHomeHost } from '../src/main/accounts/services';

const open = (url: string, busySubApps: ('teams' | 'calendar')[] = []) =>
  routeLink({ service: 'microsoft', url, disposition: 'new-window', busySubApps });
const go = (url: string, currentUrl = 'https://outlook.office.com/mail/', signingIn = false) =>
  routeLink({ service: 'microsoft', url, disposition: 'navigate', currentUrl, signingIn });

describe('Microsoft 365 links', () => {
  test('Outlook, Teams and Microsoft sign-in pages are inside the account', () => {
    for (const h of ['outlook.office.com', 'outlook.live.com', 'outlook.office365.com', 'outlook.cloud.microsoft', 'teams.microsoft.com', 'teams.live.com', 'teams.cloud.microsoft', 'login.microsoftonline.com', 'login.live.com', 'onedrive.live.com'])
      expect(isHomeHost('microsoft', h)).toBe(true);
    // Anyone can own a SharePoint tenant or an Office viewer link: those open in the browser.
    for (const h of ['learn.microsoft.com', 'www.microsoft.com', 'example.com', 'attacker.sharepoint.com', 'view.officeapps.live.com']) expect(isHomeHost('microsoft', h)).toBe(false);
  });

  test("Outlook's calendar opens in the Calendar tab", () => {
    expect(open('https://outlook.office.com/calendar/view/week')).toEqual({ kind: 'subapp', subApp: 'calendar', url: 'https://outlook.office.com/calendar/view/week' });
    expect(open('https://outlook.live.com/calendar/0/view/day')).toEqual({ kind: 'subapp', subApp: 'calendar', url: 'https://outlook.live.com/calendar/0/view/day' });
  });

  test('a Teams link (a meeting Join) opens in the Teams tab, or an extra tab during a call', () => {
    const join = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0';
    expect(open(join)).toEqual({ kind: 'subapp', subApp: 'teams', url: join });
    expect(open(join, ['teams'])).toEqual({ kind: 'extra-tab', url: join });
  });

  test('a mail pop-out opens as an extra tab (the inbox stays); a SharePoint file opens in the browser', () => {
    const popout = 'https://outlook.office.com/mail/deeplink/compose';
    expect(open(popout)).toEqual({ kind: 'extra-tab', url: popout });
    const file = 'https://acme-my.sharepoint.com/:w:/r/personal/x/Doc.docx';
    expect(open(file)).toEqual({ kind: 'external', url: file });
  });

  test('other links open in the browser', () => {
    expect(open('https://learn.microsoft.com/en-us/')).toEqual({ kind: 'external', url: 'https://learn.microsoft.com/en-us/' });
    expect(go('https://example.com/')).toEqual({ kind: 'external', url: 'https://example.com/' });
  });

  test('sign-in stays in the account, including a company identity provider reached from it', () => {
    expect(go('https://login.microsoftonline.com/common/oauth2/authorize')).toEqual({ kind: 'stay' });
    expect(open('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?prompt=consent')).toEqual({ kind: 'auth-popup' });
    expect(go('https://sso.acme.example/adfs/ls/?wa=wsignin1.0', 'https://login.microsoftonline.com/common/login', true)).toEqual({ kind: 'stay' });
    expect(go('https://outlook.office.com/mail/', 'https://sso.acme.example/adfs/ls/')).toEqual({ kind: 'stay' });
  });
});

test('leaving a sign-in page goes to the browser unless this account is signing in (an OAuth grant for another app)', () => {
  expect(routeLink({ service: 'microsoft', url: 'https://evil.example/', disposition: 'navigate', currentUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' })).toEqual({ kind: 'external', url: 'https://evil.example/' });
  expect(routeLink({ service: 'google', url: 'https://app.example/callback', disposition: 'navigate', currentUrl: 'https://accounts.google.com/o/oauth2/v2/auth' })).toEqual({ kind: 'external', url: 'https://app.example/callback' });
  expect(routeLink({ service: 'google', url: 'https://acme.okta.example/sso/saml', disposition: 'navigate', currentUrl: 'https://accounts.google.com/v3/signin', signingIn: true })).toEqual({ kind: 'stay' });
});

test("one service's sign-in hosts are not another's: a Microsoft sign-in link in Gmail or WhatsApp opens in the browser", () => {
  const ms = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=x';
  expect(routeLink({ service: 'google', url: ms, disposition: 'new-window' })).toEqual({ kind: 'external', url: ms });
  expect(routeLink({ service: 'whatsapp', url: 'https://login.live.com/', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://login.live.com/' });
  expect(routeLink({ service: 'microsoft', url: 'https://accounts.google.com/', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'https://accounts.google.com/' });
});

test('a sign-in page says whether it is signing in to this account (its return address is a page of the service)', () => {
  expect(signInFor('microsoft', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Foutlook.cloud.microsoft%2Fmail%2F')).toBe(true);
  expect(signInFor('microsoft', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fevil.example%2Fcb')).toBe(false);
  expect(signInFor('microsoft', 'https://login.microsoftonline.com/common/login')).toBeNull(); // the next step of the same sign-in
  expect(signInFor('google', 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F')).toBe(true);
  expect(signInFor('google', 'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fapp.example%2Fcb')).toBe(false);
  expect(signInFor('google', 'https://mail.google.com/mail/')).toBeNull(); // not a sign-in page
});

describe('sign-in popups', () => {
  test('a blank popup (MSAL opens about:blank, then the sign-in page) is allowed for Microsoft 365 only', () => {
    expect(routeLink({ service: 'microsoft', url: 'about:blank', disposition: 'new-window' })).toEqual({ kind: 'auth-popup' });
    expect(routeLink({ service: 'google', url: 'about:blank', disposition: 'new-window' })).toEqual({ kind: 'external', url: 'about:blank' });
  });

  test("inside a popup: the service and its sign-in stay; anything else goes to the browser", () => {
    expect(routePopup('microsoft', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'about:blank', false)).toBe('stay');
    expect(routePopup('microsoft', 'https://outlook.office.com/mail/oauthRedirect', 'https://login.microsoftonline.com/x', false)).toBe('stay');
    expect(routePopup('microsoft', 'https://evil.example/', 'about:blank', false)).toBe('external');
    expect(routePopup('microsoft', 'https://evil.example/', 'https://login.microsoftonline.com/x', false)).toBe('external');
    // this account's sign-in handing over to the company identity provider, and its steps there
    expect(routePopup('microsoft', 'https://sso.acme.example/adfs/ls/', 'https://login.microsoftonline.com/x', true)).toBe('stay');
    expect(routePopup('microsoft', 'https://sso.acme.example/adfs/mfa', 'https://sso.acme.example/adfs/ls/', true)).toBe('stay');
    expect(routePopup('microsoft', 'https://sso.acme.example/adfs/mfa', 'https://sso.acme.example/adfs/ls/', false)).toBe('external');
  });
});
