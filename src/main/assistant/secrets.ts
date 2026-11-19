import fs from 'node:fs';
import path from 'node:path';

/** Electron's safeStorage (on macOS, encrypted with a key kept in the Keychain). */
export interface SecretCrypto {
  isEncryptionAvailable(): boolean;
  encryptString(plain: string): Buffer;
  decryptString(enc: Buffer): string;
}

/** API keys the user gives Mission Desk (e.g. OpenRouter), encrypted on disk, never sent to the UI. */
export function createSecrets(dir: string, crypto: SecretCrypto) {
  const fileOf = (name: string): string => path.join(dir, `${name.replace(/[^\w-]/g, '')}.bin`);
  return {
    get(name: string): string | null {
      try {
        return crypto.decryptString(fs.readFileSync(fileOf(name)));
      } catch {
        return null;
      }
    },
    set(name: string, value: string): void {
      if (!crypto.isEncryptionAvailable()) throw new Error('The macOS Keychain is not available, so the key was not saved.');
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      const tmp = `${fileOf(name)}.tmp`;
      fs.writeFileSync(tmp, crypto.encryptString(value), { mode: 0o600 });
      fs.renameSync(tmp, fileOf(name));
    },
    remove(name: string): void {
      fs.rmSync(fileOf(name), { force: true });
    },
  };
}
