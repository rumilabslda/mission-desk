import { existsSync } from 'node:fs';
import path from 'node:path';
import { app, type BrowserWindow, dialog, type Session, session } from 'electron';
import { t } from '../../shared/i18n';
import { onlyPasskey, passkeyAccountLabel, passkeyKeychainGroup, passkeysAvailable } from './policy';

/**
 * Lets sites sign in with a passkey saved in Mission Desk, confirmed with Touch ID.
 * Each app's own session keeps its own passkeys (Electron separates them by partition).
 */

let window: (() => BrowserWindow | null) | null = null;

/** Every session, the apps' partitions included, asks the person which passkey to use when there are several. */
export function watchPasskeySessions(): void {
  app.on('session-created', wireSession);
  app.whenReady().then(() => wireSession(session.defaultSession));
}

const wired = new WeakSet<Session>();
function wireSession(s: Session): void {
  if (process.platform !== 'darwin' || wired.has(s)) return;
  wired.add(s);
  // Electron cancels a passkey sign-in when nothing answers this, even with a single passkey.
  s.on('select-webauthn-account', (_event, details, callback) => {
    void choose(details.relyingPartyId, details.accounts).then(callback, () => callback());
  });
}

async function choose(site: string, accounts: Parameters<typeof onlyPasskey>[0]): Promise<string | undefined> {
  const only = onlyPasskey(accounts);
  if (only || accounts.length === 0) return only;
  const fallback = t('main.passkey.account');
  const buttons = [...accounts.map((a) => passkeyAccountLabel(a, fallback)), t('common.cancel')];
  const options = { type: 'question' as const, message: t('main.passkey.chooseTitle', { site }), detail: t('main.passkey.chooseDetail'), buttons, cancelId: accounts.length, defaultId: 0 };
  const win = window?.() ?? null;
  const { response } = win && !win.isDestroyed() ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options);
  return accounts[response]?.credentialId;
}

/**
 * Turns passkeys on, once the interface language is known (the Touch ID prompt is written in it).
 * Returns false in a build that can't keep them: `npm run dev`, an unsigned build, or one without
 * the provisioning profile (docs/RELEASING.md).
 */
export function enablePasskeys(getWindow: () => BrowserWindow | null): boolean {
  window = getWindow;
  const profile = path.join(process.resourcesPath, '..', 'embedded.provisionprofile');
  if (!passkeysAvailable({ platform: process.platform, packaged: app.isPackaged, hasProvisioningProfile: existsSync(profile) })) return false;
  try {
    app.configureWebAuthn({ touchID: { keychainAccessGroup: passkeyKeychainGroup(), promptReason: t('main.passkey.promptReason') } });
    return true;
  } catch (e) {
    console.warn('Passkeys are off:', e);
    return false;
  }
}
