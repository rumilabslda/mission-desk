import { ACT_TOOLS, READ_TOOLS, allows, findAccount } from '../src/main/claude/access';
import { CONSENT_MS, createConsent } from '../src/main/claude/consent';
import { logLine } from '../src/main/claude/log';
import { resolveOpenUrl } from '../src/main/claude/open-url';
import type { Account } from '../src/shared/types';

const acct = (id: string, name: string, extra: Partial<Account> = {}): Account => ({
  id, service: 'google', name, color: '#000000', muted: false, hibernateWhenIdle: false, claudeAccess: 'read', ...extra,
});

describe('allows', () => {
  test('off allows nothing', () => {
    for (const t of [...READ_TOOLS, ...ACT_TOOLS]) {
      expect(allows('off', t)).toBe(false);
      expect(allows(undefined, t)).toBe(false);
    }
  });
  test('read allows only read tools', () => {
    for (const t of READ_TOOLS) expect(allows('read', t)).toBe(true);
    for (const t of ACT_TOOLS) expect(allows('read', t)).toBe(false);
  });
  test('act allows everything', () => {
    for (const t of [...READ_TOOLS, ...ACT_TOOLS]) expect(allows('act', t)).toBe(true);
  });
});

describe('findAccount', () => {
  const accounts = [acct('id-1', 'Acme'), acct('id-2', 'WhatsApp'), acct('id-3', 'WhatsApp'), acct('id-4', 'Personal', { claudeAccess: 'off' })];
  test('by id', () => expect(findAccount(accounts, 'id-1')).toEqual({ account: accounts[0] }));
  test('by name, any case, trimmed', () => expect(findAccount(accounts, '  acme ')).toEqual({ account: accounts[0] }));
  test('two accounts with the same name: ambiguous', () => {
    expect(findAccount(accounts, 'whatsapp')).toEqual({ error: "More than one account is called 'whatsapp'; use its id." });
  });
  test('access off looks like not found', () => {
    expect(findAccount(accounts, 'Personal')).toEqual({ error: "Account 'Personal' not found or Claude access is Off." });
    expect(findAccount(accounts, 'id-4')).toEqual({ error: "Account 'id-4' not found or Claude access is Off." });
  });
  test('unknown', () => expect(findAccount(accounts, 'Nope')).toEqual({ error: "Account 'Nope' not found or Claude access is Off." }));
});

describe('consent', () => {
  test('grants last exactly CONSENT_MS', () => {
    let now = 1000;
    const c = createConsent(() => now);
    expect(c.has('a')).toBe(false);
    c.grant('a');
    now += CONSENT_MS - 1;
    expect(c.has('a')).toBe(true);
    now += 1;
    expect(c.has('a')).toBe(false);
  });
  test('revoke, revokeAll and active', () => {
    let now = 0;
    const c = createConsent(() => now);
    c.grant('a');
    c.grant('b');
    c.revoke('a');
    expect(c.active()).toEqual(['b']);
    now = CONSENT_MS;
    expect(c.active()).toEqual([]);
    c.grant('c');
    c.revokeAll();
    expect(c.active()).toEqual([]);
  });
  test('30 minutes', () => expect(CONSENT_MS).toBe(30 * 60 * 1000));
});

describe('logLine', () => {
  test('only the allowed keys, ISO time', () => {
    const line = JSON.parse(logLine({ tool: 'click', account: 'Acme', ok: false, error: 'declined' }, 0));
    expect(Object.keys(line).sort()).toEqual(['account', 'error', 'ok', 't', 'tool']);
    expect(line.t).toBe('1970-01-01T00:00:00.000Z');
  });
  test('extra fields are dropped', () => {
    const line = JSON.parse(logLine({ tool: 'type', ok: true, text: 'secret' } as never, 0));
    expect(line).not.toHaveProperty('text');
  });
});

describe('resolveOpenUrl', () => {
  test.each([
    ['google', 'https://docs.google.com/d/x', { kind: 'extra', url: 'https://docs.google.com/d/x' }],
    ['google', 'https://calendar.google.com/r', { kind: 'calendar', url: 'https://calendar.google.com/r' }],
    ['google', 'https://mail.google.com/mail/u/0/#search/x', { kind: 'main', url: 'https://mail.google.com/mail/u/0/#search/x' }],
    ['slack', 'https://app.slack.com/client/T/C', { kind: 'main', url: 'https://app.slack.com/client/T/C' }],
    ['whatsapp', 'https://web.whatsapp.com/', { kind: 'main', url: 'https://web.whatsapp.com/' }],
    ['microsoft', 'https://outlook.office.com/mail/inbox', { kind: 'main', url: 'https://outlook.office.com/mail/inbox' }],
    ['microsoft', 'https://outlook.office.com/calendar/view/week', { kind: 'calendar', url: 'https://outlook.office.com/calendar/view/week' }],
    ['microsoft', 'https://teams.microsoft.com/v2/', { kind: 'teams', url: 'https://teams.microsoft.com/v2/' }],
  ] as const)('%s %s', (service, url, expected) => {
    expect(resolveOpenUrl(service, url)).toEqual(expected);
  });
  const refused = { error: "Only pages of this account's service can be opened." };
  test.each([
    ['microsoft', 'https://login.microsoftonline.com/common/oauth2/authorize'],
    ['microsoft', 'https://account.live.com/password/change'],
    ['microsoft', 'https://mysignins.microsoft.com/security-info'],
    ['microsoft', 'https://acme.sharepoint.com/sites/x'],
    ['microsoft', 'https://outlook.office.com/mail/options/mail/forwarding'],
    ['microsoft', 'https://outlook.live.com/calendar/options/calendar/SharedCalendars'],
    ['microsoft', 'https://outlook.office.com/owa/logoff.owa'],
    ['google', 'https://evil.example'],
    ['google', 'https://accounts.google.com/x'],
    ['google', 'http://mail.google.com'],
    ['google', 'https://www.google.com/search?q=x'],
    ['slack', 'https://mail.google.com/'],
    ['whatsapp', 'javascript:alert(1)'],
    // account security, admin, data export, scripts and OAuth: never for Claude
    ['google', 'https://myaccount.google.com/security'],
    ['google', 'https://admin.google.com/ac/users'],
    ['google', 'https://takeout.google.com/'],
    ['google', 'https://script.google.com/home'],
    ['google', 'https://pay.google.com/'],
    ['google', 'https://payments.google.com/'],
    ['google', 'https://passwords.google.com/'],
    ['google', 'https://mail.google.com/mail/u/0/?ui=2&view=oauth'],
    ['slack', 'https://slack.com/oauth/v2/authorize?client_id=1'],
    ['slack', 'https://acme.slack.com/openid/connect/authorize'],
    ['slack', 'https://acme.slack.com/admin'],
    ['slack', 'https://acme.slack.com/apps/manage'],
  ] as const)('refuses %s %s', (service, url) => {
    expect(resolveOpenUrl(service, url)).toEqual(refused);
  });
});
