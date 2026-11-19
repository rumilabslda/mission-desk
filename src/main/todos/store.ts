import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { localDay } from '../../shared/today';
import type { Todo } from '../../shared/types';

const MAX_TEXT = 500;
const KEEP_DONE_DAYS = 30;

const isTodo = (v: unknown): v is Todo => {
  const t = v as Partial<Todo>;
  return typeof v === 'object' && v !== null && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean' && typeof t.createdAt === 'string' && typeof t.day === 'string';
};

/** The Today page's to-dos, in a small local file (written atomically). */
export function createTodoStore(file: string, now: () => Date = () => new Date()) {
  let todos: Todo[] = load();

  function load(): Todo[] {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('not a list');
      const cutoff = now().getTime() - KEEP_DONE_DAYS * 86_400_000;
      return parsed.filter(isTodo).filter((t) => !(t.done && t.doneAt && Date.parse(t.doneAt) < cutoff));
    } catch {
      fs.copyFileSync(file, `${file}.bak`);
      return [];
    }
  }

  function save(): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(todos, null, 1));
    fs.renameSync(tmp, file);
  }

  const clean = (text: string): string | null => {
    const t = text.replace(/\s+/g, ' ').trim();
    return t && t.length <= MAX_TEXT ? t : null;
  };

  return {
    list: (): Todo[] => todos,
    add(text: string, tag?: Todo['tag']): Todo | null {
      const t = clean(text);
      if (!t) return null;
      const d = now();
      const todo: Todo = { id: randomUUID(), text: t, done: false, createdAt: d.toISOString(), day: localDay(d), ...(tag ? { tag } : {}) };
      todos = [...todos, todo];
      save();
      return todo;
    },
    update(id: string, patch: { text?: string; done?: boolean; tag?: Todo['tag'] | null }): void {
      const cur = todos.find((t) => t.id === id);
      if (!cur) return;
      const next: Todo = { ...cur };
      if (patch.text !== undefined) {
        const t = clean(patch.text);
        if (!t) return;
        next.text = t;
      }
      if (patch.done !== undefined && patch.done !== cur.done) {
        next.done = patch.done;
        if (patch.done) next.doneAt = now().toISOString();
        else delete next.doneAt;
      }
      if (patch.tag === null) delete next.tag;
      else if (patch.tag) next.tag = patch.tag;
      todos = todos.map((t) => (t.id === id ? next : t));
      save();
    },
    remove(id: string): void {
      if (!todos.some((t) => t.id === id)) return;
      todos = todos.filter((t) => t.id !== id);
      save();
    },
    clearDone(): void {
      todos = todos.filter((t) => !t.done);
      save();
    },
  };
}
export type TodoStore = ReturnType<typeof createTodoStore>;
