import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSecrets } from '../src/main/assistant/secrets';

const fakeCrypto = {
  isEncryptionAvailable: () => true,
  encryptString: (s: string) => Buffer.from(`enc:${Buffer.from(s).toString('base64')}`),
  decryptString: (b: Buffer) => Buffer.from(b.toString().slice(4), 'base64').toString(),
};

test('a key is stored encrypted, read back, and removed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-sec-'));
  const s = createSecrets(dir, fakeCrypto);
  expect(s.get('openrouter')).toBeNull();
  s.set('openrouter', 'sk-or-v1-abc');
  const raw = fs.readFileSync(path.join(dir, 'openrouter.bin'));
  expect(raw.toString()).not.toContain('sk-or-v1-abc');
  expect((fs.statSync(path.join(dir, 'openrouter.bin')).mode & 0o777).toString(8)).toBe('600');
  expect(createSecrets(dir, fakeCrypto).get('openrouter')).toBe('sk-or-v1-abc');
  s.remove('openrouter');
  expect(s.get('openrouter')).toBeNull();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('without the macOS Keychain nothing is stored in clear', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-sec-'));
  const s = createSecrets(dir, { ...fakeCrypto, isEncryptionAvailable: () => false });
  expect(() => s.set('openrouter', 'k')).toThrow(/Keychain/);
  expect(fs.existsSync(path.join(dir, 'openrouter.bin'))).toBe(false);
  fs.rmSync(dir, { recursive: true, force: true });
});
