import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isScopeKey } from '../../shared/assistant-scope';
import { COMMANDS } from '../../shared/assistant';
import { cleanDraft, cleanLine, cleanText, commandFor, isSkillMode, MAX_DESCRIPTION, MAX_INSTRUCTIONS, MAX_NAME, MAX_SKILLS, type Skill, type SkillDraft, type SkillSource } from '../../shared/skills';

/**
 * The skills library and where each one is on: `active[scope]` lists the skill ids a scope's
 * assistant uses. A scope never sees a skill that isn't on for it. Stored only on this Mac.
 */
interface SkillsFile {
  skills: Skill[];
  active: Record<string, string[]>;
}

const BUILT_IN = new Set(COMMANDS.map((c) => c.name));

const isSource = (v: unknown): v is SkillSource => {
  const s = v as SkillSource;
  if (typeof v !== 'object' || v === null) return false;
  if (s.kind === 'custom') return true;
  if (s.kind === 'catalog') return typeof s.id === 'string' && /^[\w-]{1,40}$/.test(s.id);
  return s.kind === 'import' && typeof s.url === 'string' && /^https:\/\//.test(s.url) && s.url.length <= 2048;
};

function validSkill(v: unknown): Skill | null {
  const s = v as Partial<Skill>;
  if (typeof v !== 'object' || v === null || typeof s.id !== 'string' || !/^[\w-]{1,64}$/.test(s.id)) return null;
  const name = cleanLine(s.name, MAX_NAME);
  const description = cleanLine(s.description, MAX_DESCRIPTION);
  const instructions = cleanText(s.instructions, MAX_INSTRUCTIONS);
  if (!name || !description || !instructions || !isSkillMode(s.mode) || !isSource(s.source)) return null;
  if (typeof s.command !== 'string' || !/^[a-z0-9-]{1,48}$/.test(s.command) || BUILT_IN.has(s.command)) return null;
  return { id: s.id, name, command: s.command, description, instructions, mode: s.mode, source: s.source, createdAt: String(s.createdAt ?? ''), updatedAt: String(s.updatedAt ?? '') };
}

export function createSkillsStore(file: string, now: () => Date = () => new Date()) {
  let data: SkillsFile = load();

  function load(): SkillsFile {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      return { skills: [], active: {} };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<SkillsFile>;
      const skills: Skill[] = [];
      const commands = new Set<string>();
      for (const s of Array.isArray(parsed.skills) ? parsed.skills : []) {
        const ok = validSkill(s);
        if (ok && !commands.has(ok.command) && !skills.some((x) => x.id === ok.id)) {
          skills.push(ok);
          commands.add(ok.command);
        }
      }
      const ids = new Set(skills.map((s) => s.id));
      const active: Record<string, string[]> = {};
      for (const [scope, list] of Object.entries(parsed.active ?? {})) {
        if (isScopeKey(scope) && Array.isArray(list)) active[scope] = [...new Set(list.filter((id): id is string => typeof id === 'string' && ids.has(id)))];
      }
      return { skills: skills.slice(0, MAX_SKILLS), active };
    } catch {
      try {
        fs.copyFileSync(file, `${file}.bak`);
      } catch {
        // nothing to keep
      }
      return { skills: [], active: {} };
    }
  }

  function save(): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  const taken = (except?: string): Set<string> => new Set([...BUILT_IN, ...data.skills.filter((s) => s.id !== except).map((s) => s.command)]);

  const store = {
    all: (): Skill[] => data.skills,
    activeMap: (): Record<string, string[]> => data.active,
    /** The skills on for this scope only. */
    activeFor: (scope: string): Skill[] => {
      const on = new Set(data.active[scope] ?? []);
      return data.skills.filter((s) => on.has(s.id));
    },
    /** Adds a skill and turns it on for `scopes` (where it was made or chosen). */
    add(draft: unknown, source: SkillSource, scopes: string[]): Skill | 'full' | null {
      const d = cleanDraft(draft);
      if (!d || !isSource(source)) return null;
      if (data.skills.length >= MAX_SKILLS) return 'full';
      if (source.kind === 'catalog') {
        const existing = data.skills.find((s) => s.source.kind === 'catalog' && s.source.id === source.id);
        if (existing) {
          for (const sc of scopes) store.setActive(existing.id, sc, true);
          return existing;
        }
      }
      const stamp = now().toISOString();
      const skill: Skill = { id: randomUUID().slice(0, 8), command: commandFor(d.name, taken()), ...d, source, createdAt: stamp, updatedAt: stamp };
      data = { ...data, skills: [...data.skills, skill] };
      for (const sc of scopes.filter(isScopeKey)) data.active[sc] = [...new Set([...(data.active[sc] ?? []), skill.id])];
      save();
      return skill;
    },
    /** Changes a skill's text or mode; a new name gets a new /command. */
    update(id: string, patch: Partial<SkillDraft>): Skill | null {
      const cur = data.skills.find((s) => s.id === id);
      if (!cur) return null;
      const d = cleanDraft({ ...cur, ...patch });
      if (!d) return null;
      const next: Skill = { ...cur, ...d, command: d.name === cur.name ? cur.command : commandFor(d.name, taken(id)), updatedAt: now().toISOString() };
      data = { ...data, skills: data.skills.map((s) => (s.id === id ? next : s)) };
      save();
      return next;
    },
    remove(id: string): boolean {
      if (!data.skills.some((s) => s.id === id)) return false;
      data = {
        skills: data.skills.filter((s) => s.id !== id),
        active: Object.fromEntries(Object.entries(data.active).map(([sc, list]) => [sc, list.filter((x) => x !== id)])),
      };
      save();
      return true;
    },
    setActive(id: string, scope: string, on: boolean): boolean {
      if (!isScopeKey(scope) || !data.skills.some((s) => s.id === id)) return false;
      const list = data.active[scope] ?? [];
      if (on === list.includes(id)) return false;
      data = { ...data, active: { ...data.active, [scope]: on ? [...list, id] : list.filter((x) => x !== id) } };
      save();
      return true;
    },
    /** A deleted space's switches go with it (the skills stay in the library). */
    prune(keep: (scope: string) => boolean): boolean {
      const gone = Object.keys(data.active).filter((s) => !keep(s));
      if (!gone.length) return false;
      data = { ...data, active: Object.fromEntries(Object.entries(data.active).filter(([s]) => keep(s))) };
      save();
      return true;
    },
  };
  return store;
}
export type SkillsStore = ReturnType<typeof createSkillsStore>;
