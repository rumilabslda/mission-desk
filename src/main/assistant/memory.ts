import { MAX_MEMORY_NOTES } from '../../shared/assistant';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isScopeKey } from '../../shared/assistant-scope';

/**
 * What the assistant remembers, kept apart per scope: each space has its own notes, "No space"
 * its own, and "All spaces" its own. One scope's notes are never shown to another scope's
 * assistant (clients' details under NDA must not cross). Stored only on this Mac.
 */
import type { MemoryNote } from '../../shared/assistant';
export type { MemoryNote };

export const MAX_NOTES = MAX_MEMORY_NOTES;
export const MAX_NOTE = 300;

const isNote = (v: unknown): v is MemoryNote => {
  const n = v as Partial<MemoryNote>;
  return typeof v === 'object' && v !== null && typeof n.id === 'string' && /^[\w-]{1,64}$/.test(n.id) && typeof n.text === 'string' && typeof n.createdAt === 'string';
};

/** One line, no control or text-direction characters (a note must not fake lines in the prompt). */
export function cleanNote(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const t = text
    .slice(0, MAX_NOTE * 2)
    .replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069\u2028\u2029]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t && t.length <= MAX_NOTE ? t : null;
}

export function createMemoryStore(file: string, now: () => Date = () => new Date()) {
  let notes: Record<string, MemoryNote[]> = load();

  function load(): Record<string, MemoryNote[]> {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object');
      const out: Record<string, MemoryNote[]> = {};
      for (const [scope, list] of Object.entries(parsed)) {
        if (isScopeKey(scope) && Array.isArray(list)) out[scope] = list.filter(isNote).slice(0, MAX_NOTES);
      }
      return out;
    } catch {
      try {
        fs.copyFileSync(file, `${file}.bak`);
      } catch {
        // nothing to keep
      }
      return {};
    }
  }

  function save(): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(notes, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  return {
    /** This scope's notes only. */
    list: (scope: string): MemoryNote[] => notes[scope] ?? [],
    /** Every scope's notes (for Settings, which shows each under its own space). */
    all: (): Record<string, MemoryNote[]> => notes,
    add(scope: string, text: unknown): MemoryNote | 'full' | null {
      const t = cleanNote(text);
      if (!isScopeKey(scope) || !t) return null;
      const list = notes[scope] ?? [];
      if (list.some((n) => n.text.toLowerCase() === t.toLowerCase())) return list.find((n) => n.text.toLowerCase() === t.toLowerCase())!;
      if (list.length >= MAX_NOTES) return 'full';
      const note: MemoryNote = { id: randomUUID().slice(0, 8), text: t, createdAt: now().toISOString() };
      notes = { ...notes, [scope]: [...list, note] };
      save();
      return note;
    },
    update(scope: string, id: string, text: unknown): boolean {
      const t = cleanNote(text);
      const list = notes[scope];
      if (!t || !list?.some((n) => n.id === id)) return false;
      notes = { ...notes, [scope]: list.map((n) => (n.id === id ? { ...n, text: t } : n)) };
      save();
      return true;
    },
    remove(scope: string, id: string): boolean {
      const list = notes[scope];
      if (!list?.some((n) => n.id === id)) return false;
      notes = { ...notes, [scope]: list.filter((n) => n.id !== id) };
      save();
      return true;
    },
    /** Forgets the scopes that no longer exist (a deleted space takes its notes with it). */
    prune(keep: (scope: string) => boolean): boolean {
      const gone = Object.keys(notes).filter((s) => !keep(s));
      if (!gone.length) return false;
      notes = Object.fromEntries(Object.entries(notes).filter(([s]) => keep(s)));
      save();
      return true;
    },
  };
}
export type MemoryStore = ReturnType<typeof createMemoryStore>;
