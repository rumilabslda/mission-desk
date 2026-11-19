import { chainStep, routeLink, routeRedirect, signInFor } from '../src/main/links/router';
import { customHomeHosts } from '../src/shared/custom-site';

const site = customHomeHosts('https://www.notion.so/');
const fresh = { signIn: false, trusted: false };

describe('server redirects (checked like links)', () => {
  test('a redirect to the service, or to its own sign-in, is followed', () => {
    expect(routeRedirect({ service: 'google', url: 'https://accounts.google.com/ServiceLogin', chain: fresh })).toBe('allow');
    expect(routeRedirect({ service: 'custom', url: 'https://www.notion.so/x', chain: fresh, homeHosts: site })).toBe('allow');
  });

  test('an OAuth error redirect to another site goes to the browser (not into the app)', () => {
    const start = chainStep('microsoft', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fevil.example%2Fcb&prompt=none', fresh);
    expect(start.signIn).toBe(false);
    expect(routeRedirect({ service: 'microsoft', url: 'https://evil.example/cb#error=login_required', chain: start })).toBe('external');
  });

  test("this account's sign-in may hand over to the company identity provider (and go on there)", () => {
    const gmail = chainStep('google', 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F', fresh);
    expect(gmail.signIn).toBe(true);
    expect(routeRedirect({ service: 'google', url: 'https://acme.okta.example/app/saml', chain: gmail })).toBe('allow');
    const slack = chainStep('slack', 'https://acme.slack.com/sso/saml/start', fresh);
    expect(routeRedirect({ service: 'slack', url: 'https://acme.okta.example/sso/saml', chain: slack })).toBe('allow');
  });

  test('a redirect to a sign-in page that returns to the site (session expired) is followed', () => {
    const jira = customHomeHosts('https://acme.atlassian.net/');
    expect(routeRedirect({ service: 'custom', url: 'https://id.atlassian.com/login?continue=https%3A%2F%2Facme.atlassian.net%2Fjira', chain: fresh, homeHosts: jira })).toBe('allow');
    expect(routeRedirect({ service: 'custom', url: 'https://id.atlassian.com/login?continue=https%3A%2F%2Fevil.atlassian.net%2F', chain: fresh, homeHosts: jira })).toBe('external');
  });

  test("the app's own first load may be redirected anywhere (a sign-in, or the site's new domain)", () => {
    expect(routeRedirect({ service: 'custom', url: 'https://www.notion.com/', chain: { signIn: false, trusted: true }, homeHosts: site })).toBe('allow');
  });

  test('an open redirect on the site sends a link elsewhere: the browser', () => {
    expect(routeRedirect({ service: 'custom', url: 'https://evil.example/', chain: fresh, homeHosts: site })).toBe('external');
    expect(routeRedirect({ service: 'linkedin', url: 'https://evil.example/', chain: fresh })).toBe('external');
  });

  test('a redirect to an http page of the site is a downgrade: the browser', () => {
    expect(routeRedirect({ service: 'custom', url: 'http://www.notion.so/x', chain: fresh, homeHosts: site })).toBe('external');
  });
});

describe('leaving the site in the same view', () => {
  test('stays only while this account is signing in', () => {
    const r = (signingIn: boolean) =>
      routeLink({ service: 'custom', url: 'https://evil.example/', disposition: 'navigate', currentUrl: 'https://sso.acme.example/', signingIn, homeHosts: site });
    expect(r(false)).toEqual({ kind: 'external', url: 'https://evil.example/' });
    expect(r(true)).toEqual({ kind: 'stay' });
  });

  test("a custom app's sign-in on another domain works: its return address is the site", () => {
    const login = 'https://auth.openai.example/authorize?redirect_uri=https%3A%2F%2Fwww.notion.so%2Fcallback';
    expect(signInFor('custom', login, site)).toBe(true);
    expect(routeLink({ service: 'custom', url: login, disposition: 'navigate', currentUrl: 'https://www.notion.so/', homeHosts: site })).toEqual({ kind: 'stay' });
    expect(routeLink({ service: 'custom', url: login, disposition: 'new-window', homeHosts: site })).toEqual({ kind: 'auth-popup' });
    expect(signInFor('custom', 'https://idp.example/login?next=https%3A%2F%2Fevil.example%2F', site)).toBe(false);
  });

  test("a Google or Microsoft sign-in link for another app, in a custom app's view, goes to the browser", () => {
    const other = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fevil.example%2Fcb';
    expect(routeLink({ service: 'custom', url: other, disposition: 'navigate', currentUrl: 'https://www.notion.so/', homeHosts: site })).toEqual({ kind: 'external', url: other });
    const logout = 'https://accounts.google.com/Logout';
    expect(routeLink({ service: 'custom', url: logout, disposition: 'navigate', currentUrl: 'https://www.notion.so/', homeHosts: site })).toEqual({ kind: 'external', url: logout });
    // Gmail's own sign-out stays
    expect(routeLink({ service: 'google', url: logout, disposition: 'navigate', currentUrl: 'https://mail.google.com/' })).toEqual({ kind: 'stay' });
  });

  test("a custom app's blank or sized popup on its own site is a child window (opener kept), a plain new tab is a tab", () => {
    expect(routeLink({ service: 'custom', url: 'about:blank', disposition: 'new-window', homeHosts: site })).toEqual({ kind: 'auth-popup' });
    expect(routeLink({ service: 'custom', url: 'https://www.notion.so/connect', disposition: 'new-window', popup: true, homeHosts: site })).toEqual({ kind: 'auth-popup' });
    expect(routeLink({ service: 'custom', url: 'https://www.notion.so/page', disposition: 'new-window', homeHosts: site })).toEqual({ kind: 'extra-tab', url: 'https://www.notion.so/page' });
  });
});
