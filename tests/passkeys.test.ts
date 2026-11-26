import { describe, expect, test } from 'vitest';
import { onlyPasskey, passkeyAccountLabel, passkeyKeychainGroup, passkeysAvailable } from '../src/main/passkeys/policy';
import { readFileSync } from 'node:fs';
import { setLocale, t } from '../src/shared/i18n';
import { loadCatalogs } from '../src/shared/i18n/catalogs';
import { LOCALES } from '../src/shared/i18n';

describe('passkeys', () => {
  test('live in the keychain group the app is entitled to', () => {
    expect(passkeyKeychainGroup()).toBe('WY943M5DF7.pt.rumilabs.missiondesk.webauthn');
    const main = readFileSync('build/entitlements.mac.plist', 'utf8');
    expect(main).toContain(`<string>${passkeyKeychainGroup()}</string>`);
    expect(main).toContain('<string>WY943M5DF7.pt.rumilabs.missiondesk</string>');
  });

  test("the helper processes don't get the keychain entitlement (only the app carries the profile)", () => {
    const inherit = readFileSync('build/entitlements.mac.inherit.plist', 'utf8');
    expect(inherit).not.toContain('keychain-access-groups');
    expect(inherit).not.toContain('application-identifier');
  });

  test('are on only in the installed Mac app signed with the provisioning profile', () => {
    expect(passkeysAvailable({ platform: 'darwin', packaged: true, hasProvisioningProfile: true })).toBe(true);
    expect(passkeysAvailable({ platform: 'darwin', packaged: true, hasProvisioningProfile: false })).toBe(false);
    expect(passkeysAvailable({ platform: 'darwin', packaged: false, hasProvisioningProfile: true })).toBe(false);
    expect(passkeysAvailable({ platform: 'win32', packaged: true, hasProvisioningProfile: true })).toBe(false);
  });

  test('a single passkey is used without asking', () => {
    expect(onlyPasskey([{ credentialId: 'a' }])).toBe('a');
    expect(onlyPasskey([{ credentialId: 'a' }, { credentialId: 'b' }])).toBeUndefined();
    expect(onlyPasskey([])).toBeUndefined();
  });

  test('accounts are shown by the name people know them by', () => {
    expect(passkeyAccountLabel({ credentialId: 'a', name: 'ana@rumi.pt', displayName: 'Ana Silva' }, 'Account')).toBe('Ana Silva (ana@rumi.pt)');
    expect(passkeyAccountLabel({ credentialId: 'a', name: 'ana@rumi.pt', displayName: 'ana@rumi.pt' }, 'Account')).toBe('ana@rumi.pt');
    expect(passkeyAccountLabel({ credentialId: 'a', displayName: ' Ana ' }, 'Account')).toBe('Ana');
    expect(passkeyAccountLabel({ credentialId: 'a', name: '  ' }, 'Account')).toBe('Account');
  });

  test("the Touch ID prompt keeps macOS's $1 for the site in every language", () => {
    loadCatalogs();
    for (const l of LOCALES) {
      setLocale(l);
      expect(t('main.passkey.promptReason'), l).toContain('$1');
    }
    setLocale('en');
  });
});
