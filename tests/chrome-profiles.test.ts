import { chromeOpenArgs, parseChromeProfiles, pickChromeProfile } from '../src/main/links/chrome-profiles';

describe("Chrome's profiles", () => {
  test("read from Chrome's Local State, sorted by name", () => {
    const localState = JSON.stringify({
      profile: {
        info_cache: {
          Default: { name: 'Personal', user_name: 'me@gmail.com' },
          'Profile 2': { name: 'Client X', user_name: '' },
          'Profile 3': { gaia_name: 'no name field' },
        },
      },
    });
    expect(parseChromeProfiles(localState)).toEqual([
      { dir: 'Profile 2', name: 'Client X' },
      { dir: 'Default', name: 'Personal', email: 'me@gmail.com' },
      { dir: 'Profile 3', name: 'Profile 3' },
    ]);
  });

  test('a missing or broken file means no profiles', () => {
    expect(parseChromeProfiles('')).toEqual([]);
    expect(parseChromeProfiles('{"profile":{}}')).toEqual([]);
    expect(parseChromeProfiles('not json')).toEqual([]);
  });

  test('a profile folder with odd characters is not offered', () => {
    const localState = JSON.stringify({ profile: { info_cache: { '../x': { name: 'Bad' }, '--incognito': { name: 'Bad' }, 'Profile 1': { name: 'Ok' } } } });
    expect(parseChromeProfiles(localState)).toEqual([{ dir: 'Profile 1', name: 'Ok' }]);
  });

  test("the link opens through macOS's open, in the chosen profile", () => {
    expect(chromeOpenArgs('https://example.com/x', 'Profile 2')).toEqual([
      '-na', 'Google Chrome', '--args', '--profile-directory=Profile 2', 'https://example.com/x',
    ]);
  });
});

describe('which Chrome profile a link goes to', () => {
  const profiles = [
    { dir: 'Default', name: 'Armando', email: 'armando@gmail.com' },
    { dir: 'Profile 1', name: 'rumi.coach', email: 'armando@rumi.coach' },
    { dir: 'Profile 2', name: 'klchra.com', email: 'a.rodrigues@klchra.com' },
    { dir: 'Profile 4', name: 'Work, signed out' },
  ];
  const none = { profiles, spaceEmails: [] as string[] };

  test("a Gmail account's links go to the profile signed in to the same address", () => {
    expect(pickChromeProfile({ ...none, email: 'Armando@Gmail.com' })).toEqual({ dir: 'Default', auto: true });
    expect(pickChromeProfile({ ...none, email: 'armando@rumi.coach' })).toEqual({ dir: 'Profile 1', auto: true });
  });

  test('another address at the same company goes to that company’s profile', () => {
    expect(pickChromeProfile({ ...none, email: 'team@klchra.com' })).toEqual({ dir: 'Profile 2', auto: true });
  });

  test('a different personal address never matches by domain (gmail.com is everyone’s)', () => {
    expect(pickChromeProfile({ ...none, email: 'someone.else@gmail.com' })).toBeNull();
  });

  test('Slack, WhatsApp… follow a Gmail account in their space', () => {
    expect(pickChromeProfile({ ...none, spaceEmails: ['armando@rumi.coach'] })).toEqual({ dir: 'Profile 1', auto: true });
    expect(pickChromeProfile({ ...none, spaceEmails: ['nobody@elsewhere.com', 'team@klchra.com'] })).toEqual({ dir: 'Profile 2', auto: true });
  });

  test("the app's own address wins over its space's", () => {
    expect(pickChromeProfile({ ...none, email: 'armando@gmail.com', spaceEmails: ['armando@rumi.coach'] })).toEqual({ dir: 'Default', auto: true });
     // …even when it only matches by company
    expect(pickChromeProfile({ ...none, email: 'team@klchra.com', spaceEmails: ['armando@rumi.coach'] })).toEqual({ dir: 'Profile 2', auto: true });
  });

  test('a website app on a company’s domain goes to that company’s profile', () => {
    expect(pickChromeProfile({ ...none, hosts: ['app.klchra.com'] })).toEqual({ dir: 'Profile 2', auto: true });
    expect(pickChromeProfile({ ...none, hosts: ['notklchra.com'] })).toBeNull();
  });

  test('a profile chosen by hand for the space wins', () => {
    expect(pickChromeProfile({ ...none, manual: 'Profile 2', email: 'armando@gmail.com' })).toEqual({ dir: 'Profile 2', auto: false });
  });

  test('a chosen profile that Chrome no longer has falls back to matching', () => {
    expect(pickChromeProfile({ ...none, manual: 'Profile 9', email: 'armando@gmail.com' })).toEqual({ dir: 'Default', auto: true });
  });

  test('nothing to go on: the default browser', () => {
    expect(pickChromeProfile(none)).toBeNull();
  });
});
