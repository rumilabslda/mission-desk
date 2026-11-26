import { APP_ID, APPLE_TEAM_ID } from '../../shared/about';

/**
 * Passkeys on the Mac, the part that needs no Electron.
 *
 * Mission Desk stores its own passkeys in the Mac's keychain, unlocked with Touch ID (the way Chrome
 * did before it could use iCloud Keychain). They stay on this Mac and are not synced. iCloud Keychain
 * passkeys for Google, Microsoft or Slack need an entitlement Apple only gives to web browsers.
 */

/** The keychain access group the passkeys live in. It must match build/entitlements.mac.plist. */
export function passkeyKeychainGroup(): string {
  return `${APPLE_TEAM_ID}.${APP_ID}.webauthn`;
}

export interface PasskeyHost {
  platform: NodeJS.Platform;
  /** The installed app, not `npm run dev`. */
  packaged: boolean;
  /**
   * The bundle carries the provisioning profile (Contents/embedded.provisionprofile). Only a build
   * signed with it has the keychain entitlement; without it every passkey would fail with a bare error,
   * so the sites are better off not being offered one and asking for the password instead.
   */
  hasProvisioningProfile: boolean;
}

export function passkeysAvailable(h: PasskeyHost): boolean {
  return h.platform === 'darwin' && h.packaged && h.hasProvisioningProfile;
}

export interface PasskeyAccount {
  credentialId: string;
  name?: string;
  displayName?: string;
}

/** What a person recognises an account by: the email or username, else the name, else nothing better than "Account". */
export function passkeyAccountLabel(a: PasskeyAccount, fallback: string): string {
  const name = a.name?.trim();
  const display = a.displayName?.trim();
  if (name && display && display !== name) return `${display} (${name})`;
  return name || display || fallback;
}

/** With a single passkey for the site there is nothing to ask. Otherwise the person chooses. */
export function onlyPasskey(accounts: readonly PasskeyAccount[]): string | undefined {
  return accounts.length === 1 ? accounts[0].credentialId : undefined;
}
