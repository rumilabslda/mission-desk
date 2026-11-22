import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isScopeKey } from '../../shared/assistant-scope';
import type { Meeting, MeetingListItem, Segment } from '../../shared/meeting';

/**
 * Transcribed meetings, one JSON file each, in one folder per scope ('space:<id>' → space-<id>,
 * 'nospace'). Every read names its scope: a meeting is only ever found in its own scope's folder.
 * Stored only on this Mac, readable only by the user.
 */
const ID = /^[\w-]{1,40}$/;
type Patch = Partial<Pick<Meeting, 'endedAt' | 'language' | 'result' | 'applied' | 'actions' | 'title' | 'event'>>;

export function createMeetingStore(dir: string, now: () => Date = () => new Date()) {
  const scopeDir = (scope: string): string | null => (isScopeKey(scope) && scope !== 'all' ? path.join(dir, scope.replace(':', '-')) : null);
  const fileOf = (scope: string, id: string): string | null => {
    const d = scopeDir(scope);
    return d && ID.test(id) ? path.join(d, `${id}.json`) : null;
  };

  function read(file: string): Meeting | null {
    try {
      const m = JSON.parse(fs.readFileSync(file, 'utf8')) as Meeting;
      return typeof m === 'object' && m && typeof m.id === 'string' && Array.isArray(m.segments) ? m : null;
    } catch {
      return null;
    }
  }

  function write(m: Meeting): void {
    const file = fileOf(m.scope, m.id);
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(m), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  function all(scope: string): Meeting[] {
    const d = scopeDir(scope);
    if (!d) return [];
    let names: string[];
    try {
      names = fs.readdirSync(d);
    } catch {
      return [];
    }
    return names
      .filter((n) => n.endsWith('.json'))
      .map((n) => read(path.join(d, n)))
      .filter((m): m is Meeting => m !== null && m.scope === scope);
  }

  const minutes = (m: Meeting): number => Math.max(0, Math.round(((m.endedAt ? Date.parse(m.endedAt) : now().getTime()) - Date.parse(m.startedAt)) / 60_000));

  const item = (m: Meeting, liveId?: string): MeetingListItem => ({
    id: m.id,
    scope: m.scope,
    title: m.title,
    startedAt: m.startedAt,
    minutes: minutes(m),
    state: m.id === liveId ? 'transcribing' : m.result ? 'ready' : 'notRun',
    ...(m.event ? { event: m.event } : {}),
  });

  const store = {
    create(base: Omit<Meeting, 'id' | 'segments' | 'gaps'>): Meeting {
      const m: Meeting = { ...base, id: randomUUID().replace(/-/g, '').slice(0, 12), segments: [], gaps: [] };
      write(m);
      return m;
    },
    get(scope: string, id: string): Meeting | null {
      const file = fileOf(scope, id);
      const m = file ? read(file) : null;
      return m && m.scope === scope && m.id === id ? m : null;
    },
    append(scope: string, id: string, segs: Segment[]): void {
      const m = store.get(scope, id);
      if (m && segs.length) write({ ...m, segments: [...m.segments, ...segs] });
    },
    gap(scope: string, id: string, g: { start: number; end: number }): void {
      const m = store.get(scope, id);
      if (m) write({ ...m, gaps: [...m.gaps, g] });
    },
    update(scope: string, id: string, patch: Patch): Meeting | null {
      const m = store.get(scope, id);
      if (!m) return null;
      const next = { ...m, ...patch };
      write(next);
      return next;
    },
    /** Newest first. `liveId`: the meeting being transcribed right now. */
    list(scope: string, liveId?: string): MeetingListItem[] {
      return all(scope)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((m) => item(m, liveId));
    },
    listAll(scopes: string[], liveId?: string): MeetingListItem[] {
      return scopes.flatMap((s) => store.list(s, liveId)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    count: (scope: string): number => all(scope).length,
    remove(scope: string, id: string): boolean {
      const file = fileOf(scope, id);
      if (!file || !store.get(scope, id)) return false;
      fs.rmSync(file, { force: true });
      return true;
    },
    removeScope(scope: string): number {
      const d = scopeDir(scope);
      const n = store.count(scope);
      if (d) fs.rmSync(d, { recursive: true, force: true });
      return n;
    },
    /** Removes the folders of scopes that no longer exist (a deleted or ungrouped space). */
    pruneScopes(keep: (scope: string) => boolean): number {
      let names: string[];
      try {
        names = fs.readdirSync(dir);
      } catch {
        return 0;
      }
      let removed = 0;
      for (const n of names) {
        const scope = n === 'nospace' ? n : n.startsWith('space-') ? `space:${n.slice(6)}` : null;
        if (scope && !keep(scope)) removed += store.removeScope(scope);
      }
      return removed;
    },
    /** Empties the transcripts of meetings that ended more than `days` ago (summaries and results stay). */
    pruneTranscripts(days: number): number {
      const cutoff = now().getTime() - days * 86_400_000;
      let pruned = 0;
      let names: string[];
      try {
        names = fs.readdirSync(dir);
      } catch {
        return 0;
      }
      for (const n of names) {
        const scope = n === 'nospace' ? n : n.startsWith('space-') ? `space:${n.slice(6)}` : null;
        if (!scope) continue;
        for (const m of all(scope)) {
          if (!m.endedAt || Date.parse(m.endedAt) >= cutoff || m.transcriptPruned) continue;
          write({ ...m, segments: [], gaps: [], transcriptPruned: true });
          pruned += 1;
        }
      }
      return pruned;
    },
  };
  return store;
}
export type MeetingStore = ReturnType<typeof createMeetingStore>;
