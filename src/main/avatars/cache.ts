import fs from 'node:fs';
import path from 'node:path';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Bump when the icon rules change, so cached icons are fetched again. */
export const AVATAR_VERSION = 2;

export interface AvatarEntry {
  /** The image as a PNG data URL, or null when no candidate produced an image. */
  dataUrl: string | null;
  /** The candidate URLs this entry was made from, joined with "|". */
  sourceUrl: string;
  fetchedAt: number;
  version?: number;
}

export interface AvatarCache {
  get(accountId: string): AvatarEntry | undefined;
  set(accountId: string, entry: AvatarEntry): void;
  remove(accountId: string): void;
}

export function isFresh(entry: AvatarEntry | undefined, candidates: string[], now: number): boolean {
  return (
    !!entry &&
    entry.version === AVATAR_VERSION &&
    entry.sourceUrl === candidates.join('|') &&
    now - entry.fetchedAt < DAY_MS
  );
}

/** Account icons, kept in `<dir>/avatars.json` so they show instantly at startup. */
export function createAvatarCache(dir: string): AvatarCache {
  const file = path.join(dir, 'avatars.json');
  let entries: Record<string, AvatarEntry> = {};
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (parsed && typeof parsed === 'object') entries = parsed as Record<string, AvatarEntry>;
  } catch {
    // missing or unreadable: start empty, icons are fetched again
  }
  const save = (): void => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(entries));
    fs.renameSync(`${file}.tmp`, file);
  };
  return {
    get: (id) => entries[id],
    set(id, entry) {
      entries[id] = entry;
      save();
    },
    remove(id) {
      if (!(id in entries)) return;
      delete entries[id];
      save();
    },
  };
}
