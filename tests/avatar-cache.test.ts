import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAvatarCache, isFresh, DAY_MS, AVATAR_VERSION } from '../src/main/avatars/cache';

let dir: string;
beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-avatars-'))));
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const entry = { dataUrl: 'data:image/png;base64,AAA', sourceUrl: 'https://x/a.png', fetchedAt: 1000, version: AVATAR_VERSION };

test('entries persist across instances and can be removed', () => {
  createAvatarCache(dir).set('acct', entry);
  expect(createAvatarCache(dir).get('acct')).toEqual(entry);
  createAvatarCache(dir).remove('acct');
  expect(createAvatarCache(dir).get('acct')).toBeUndefined();
});

test('a corrupt cache file is ignored', () => {
  fs.writeFileSync(path.join(dir, 'avatars.json'), '{nope');
  expect(createAvatarCache(dir).get('acct')).toBeUndefined();
});

test('fresh means same sources and younger than a day', () => {
  expect(isFresh(entry, ['https://x/a.png'], 1000 + DAY_MS - 1)).toBe(true);
  expect(isFresh(entry, ['https://x/a.png'], 1000 + DAY_MS)).toBe(false);
  expect(isFresh(entry, ['https://x/other.png'], 1001)).toBe(false);
  expect(isFresh(undefined, ['https://x/a.png'], 1001)).toBe(false);
});

test('a cached failure (no image) is fresh for the same sources', () => {
  expect(isFresh({ dataUrl: null, sourceUrl: 'https://x/a.png|https://x/b.png', fetchedAt: 1000, version: AVATAR_VERSION }, ['https://x/a.png', 'https://x/b.png'], 2000)).toBe(true);
});

test('entries made by an older version of the icon logic are fetched again', () => {
  expect(isFresh({ ...entry, version: undefined }, ['https://x/a.png'], 1001)).toBe(false);
});
