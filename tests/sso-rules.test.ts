import { isGoogleCookieDomain, ssoGroups } from '../src/shared/sso';
import type { ServiceId, Space } from '../src/shared/types';

describe('isGoogleCookieDomain', () => {
  test.each(['google.com', '.google.com', 'accounts.google.com', '.google.pt', 'google.co.uk', '.youtube.com', 'accounts.youtube.com'])('accepts %s', (d) => {
    expect(isGoogleCookieDomain(d)).toBe(true);
  });
  test.each(['googleusercontent.com', '.googleusercontent.com', 'notgoogle.com', 'google.com.evil.io', 'slack.com', '.slack.com', '', 'google'])('rejects %s', (d) => {
    expect(isGoogleCookieDomain(d)).toBe(false);
  });
});

const acc = (id: string, service: ServiceId, spaceId?: string) => ({ id, service, ...(spaceId ? { spaceId } : {}) });
const space = (id: string, extra: Partial<Space> = {}): Space => ({ id, name: id, ...extra });

describe('ssoGroups', () => {
  test('Microsoft 365 accounts keep their own sign-in (no Google cookies copied in)', () => {
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('m1', 'microsoft', 'S'), acc('s1', 'slack', 'S')], [space('S')])).toEqual([
      { spaceId: 'S', identityId: 'g1', members: ['g1', 's1'] },
    ]);
  });

  test('the first Google member is the identity; Slack members join it', () => {
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('s1', 'slack', 'S'), acc('x', 'slack')], [space('S')])).toEqual([
      { spaceId: 'S', identityId: 'g1', members: ['g1', 's1'] },
    ]);
  });

  test('an explicit identity wins; the other Google account is left alone', () => {
    const groups = ssoGroups([acc('g1', 'google', 'S'), acc('g2', 'google', 'S'), acc('s1', 'slack', 'S')], [space('S', { googleAccountId: 'g2' })]);
    expect(groups).toEqual([{ spaceId: 'S', identityId: 'g2', members: ['g2', 's1'] }]);
  });

  test('a stale identity falls back to the first Google member', () => {
    const groups = ssoGroups([acc('g1', 'google', 'S'), acc('s1', 'slack', 'S'), acc('g9', 'google')], [space('S', { googleAccountId: 'g9' })]);
    expect(groups[0].identityId).toBe('g1');
  });

  test('sharing off means no group', () => {
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('s1', 'slack', 'S')], [space('S', { shareGoogle: false })])).toEqual([]);
  });

  test('WhatsApp never joins', () => {
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('w', 'whatsapp', 'S')], [space('S')])).toEqual([]);
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('w', 'whatsapp', 'S'), acc('s', 'slack', 'S')], [space('S')])[0].members).toEqual(['g1', 's']);
  });

  test('without a Google account, the Slack members share among themselves', () => {
    expect(ssoGroups([acc('s1', 'slack', 'S'), acc('s2', 'slack', 'S')], [space('S')])).toEqual([
      { spaceId: 'S', identityId: null, members: ['s1', 's2'] },
    ]);
  });

  test('a single participant makes no group; loose accounts never group', () => {
    expect(ssoGroups([acc('g1', 'google', 'S'), acc('g2', 'google', 'S')], [space('S')])).toEqual([]);
    expect(ssoGroups([acc('g1', 'google'), acc('s1', 'slack')], [])).toEqual([]);
  });
});
