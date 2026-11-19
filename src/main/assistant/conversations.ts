import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AssistantEvent } from '../../shared/assistant';
import { applyEvent, type ChatMessage, type ConversationMeta } from '../../shared/assistant-history';

export interface Conversation {
  id: string;
  scope: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** The engine's session (Claude Code's or Codex's), resumed on the next message (it keeps the context). */
  sessionId?: string;
  /** The assistant the session belongs to ('claude' when absent: older conversations). */
  engine?: string;
  messages: ChatMessage[];
}

const MAX_MESSAGES = 400;
const TITLE = 60;
const SAVE_DELAY_MS = 1500;

const isMessage = (m: unknown): boolean =>
  typeof m === 'object' && m !== null && ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') && typeof (m as ChatMessage).text === 'string' && Array.isArray((m as ChatMessage).tools);
const isConversation = (v: unknown): v is Conversation => {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Conversation;
  return (
    typeof c.id === 'string' &&
    /^[\w-]{1,80}$/.test(c.id) &&
    typeof c.scope === 'string' &&
    typeof c.title === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string' &&
    (c.sessionId === undefined || typeof c.sessionId === 'string') &&
    (c.engine === undefined || typeof c.engine === 'string') &&
    Array.isArray(c.messages) &&
    c.messages.every(isMessage)
  );
};

/** Saved assistant conversations (one file each, on this Mac only). */
export function createConversationStore(dir: string, now: () => number = Date.now, opts: { perScope?: number } = {}) {
  const perScope = opts.perScope ?? 40;
  const all = new Map<string, Conversation>();
  const dirty = new Set<string>();
  let timer: NodeJS.Timeout | null = null;
  const fileOf = (id: string): string => path.join(dir, `${id}.json`);
  const stamp = (): string => new Date(now()).toISOString();

  try {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as unknown;
        if (isConversation(c) && `${c.id}.json` === f) all.set(c.id, c); // the file's name is its id (delete finds it)
      } catch {
        // a broken file is skipped
      }
    }
  } catch {
    // no history yet
  }

  /** Writes one conversation; false when the disk refused (it stays in memory and is tried again). */
  function write(id: string): boolean {
    try {
      const c = all.get(id);
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      if (!c) {
        fs.rmSync(fileOf(id), { force: true });
        return true;
      }
      if (c.messages.length === 0) return true; // an unused conversation isn't saved
      const tmp = `${fileOf(id)}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(c), { mode: 0o600 });
      fs.renameSync(tmp, fileOf(id));
      return true;
    } catch (e) {
      console.error('Mission Desk: could not save an assistant conversation', (e as Error).message);
      return false;
    }
  }

  function flush(): void {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const id of [...dirty]) if (write(id)) dirty.delete(id);
  }

  function touch(id: string, soon = false): void {
    dirty.add(id);
    if (soon) return flush();
    timer ??= setTimeout(flush, SAVE_DELAY_MS);
  }

  /** Keeps the newest `perScope` used conversations of a scope. */
  function prune(scope: string): void {
    const used = [...all.values()].filter((c) => c.scope === scope && c.messages.length > 0).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    for (const old of used.slice(perScope)) {
      all.delete(old.id);
      touch(old.id);
    }
  }

  function update(id: string, fn: (c: Conversation) => void, soon = false): void {
    const c = all.get(id);
    if (!c) return;
    fn(c);
    if (c.messages.length > MAX_MESSAGES) c.messages = c.messages.slice(-MAX_MESSAGES);
    c.updatedAt = stamp();
    touch(id, soon);
  }

  return {
    create(scope: string): Conversation {
      const at = stamp();
      const c: Conversation = { id: randomUUID(), scope, title: 'New chat', createdAt: at, updatedAt: at, messages: [] };
      all.set(c.id, c);
      return c;
    },
    get: (id: string): Conversation | null => all.get(id) ?? null,
    /** The scope's used conversations, newest first. */
    list(scope: string): ConversationMeta[] {
      return [...all.values()]
        .filter((c) => c.scope === scope && c.messages.length > 0)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ id, scope: s, title, updatedAt }) => ({ id, scope: s, title, updatedAt }));
    },
    addUser(id: string, text: string): void {
      update(
        id,
        (c) => {
          if (c.messages.length === 0) c.title = text.replace(/\s+/g, ' ').trim().slice(0, TITLE) || 'New chat';
          c.messages = [...c.messages, { role: 'user', text, tools: [] }];
        },
        true,
      );
      const c = all.get(id);
      if (c) prune(c.scope);
    },
    applyEvent(id: string, e: AssistantEvent): void {
      if ((e.type === 'init' || e.type === 'done') && e.sessionId) update(id, (c) => (c.sessionId = e.sessionId), e.type === 'done');
      else if (e.type === 'done' || e.type === 'error') update(id, () => undefined, true);
      else update(id, (c) => (c.messages = applyEvent(c.messages, e)));
    },
    /** The scopes that have saved conversations. */
    scopes: (): string[] => [...new Set([...all.values()].filter((c) => c.messages.length > 0).map((c) => c.scope))],
    /** Moves a scope's conversations (a removed space's) to another scope. */
    reassign(from: string, to: string): void {
      for (const c of all.values()) {
        if (c.scope !== from) continue;
        c.scope = to;
        touch(c.id);
      }
      flush();
      prune(to);
    },
    /** The assistant now answering here; another one than before can't resume the old session. */
    setEngine(id: string, engine: string): void {
      const c = all.get(id);
      if (!c || (c.engine ?? (c.sessionId ? 'claude' : undefined)) === engine) {
        if (c && c.engine !== engine) update(id, (x) => (x.engine = engine));
        return;
      }
      update(id, (x) => {
        x.engine = engine;
        delete x.sessionId;
      });
    },
    remove(id: string): void {
      all.delete(id);
      touch(id, true);
    },
    flush,
  };
}

export type ConversationStore = ReturnType<typeof createConversationStore>;
