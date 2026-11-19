import { isGoogleCookieDomain, type SsoGroup } from '../../shared/sso';

/** The cookie fields the sync needs (a subset of Electron's Cookie). */
export interface SyncCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  hostOnly: boolean;
  session: boolean;
  expirationDate?: number;
  sameSite: string;
}

/** One account's cookie jar. */
export interface CookieStore {
  get(): Promise<SyncCookie[]>;
  set(c: SyncCookie): Promise<void>;
  remove(c: Pick<SyncCookie, 'name' | 'domain' | 'path' | 'secure'>): Promise<void>;
  /** Fires for every change, including the ones `set`/`remove` make. Returns an unsubscribe. */
  onChanged(cb: (c: SyncCookie, cause: string, removed: boolean) => void): () => void;
}

const MAX_PENDING = 2000;
const cookieId = (c: { domain: string; path: string; name: string }): string => `${c.domain}|${c.path}|${c.name}`;
const google = (list: SyncCookie[]): SyncCookie[] => list.filter((c) => isGoogleCookieDomain(c.domain));

/**
 * Keeps Google's sign-in cookies identical between the members of each group,
 * so signing in to Google once in a space signs in every app in it.
 * Never throws; a cookie that can't be set is skipped.
 */
export function createGoogleSync(
  io: {
    store(accountId: string): CookieStore;
    /** False once an account is removed: its data wipe must not reach the rest of its space. */
    alive?(accountId: string): boolean;
  },
  opts: { tagTtlMs?: number } = {},
) {
  const tagTtlMs = opts.tagTtlMs ?? 5000;
  let signature = '';
  let groupOf = new Map<string, SsoGroup>(); // accountId → its group
  const unsubscribe = new Map<string, () => void>();
  // Changes the sync made itself, so their change events aren't mirrored back.
  const pending = new Map<string, number>();
  let queue: Promise<void> = Promise.resolve();
  let disposed = false;

  const tag = (target: string, c: SyncCookie, removed: boolean): string => `${target}|${cookieId(c)}|${removed ? '\u0000removed' : c.value}`;

  /** Expects one change event for `t`; forgotten after a while if it never comes (so it can't swallow a real one later). */
  function expect(t: string): void {
    if (pending.size > MAX_PENDING) pending.clear();
    pending.set(t, (pending.get(t) ?? 0) + 1);
    const timer = setTimeout(() => consume(t), tagTtlMs);
    (timer as { unref?: () => void }).unref?.();
  }
  function consume(t: string): boolean {
    const n = pending.get(t);
    if (!n) return false;
    if (n === 1) pending.delete(t);
    else pending.set(t, n - 1);
    return true;
  }

  async function apply(target: string, c: SyncCookie, removed: boolean): Promise<void> {
    const store = io.store(target);
    const t = tag(target, c, removed);
    if (!removed) {
      expect(t);
      await store.set(c).catch(() => consume(t)); // refused: no event will come
      return;
    }
    // Removing by URL and name also takes same-name cookies on parent paths/domains:
    // expect those removals too, and put back whatever went with it.
    const siblings = (await store.get().catch(() => [] as SyncCookie[])).filter(
      (x) => x.name === c.name && cookieId(x) !== cookieId(c) && isGoogleCookieDomain(x.domain),
    );
    for (const s of siblings) expect(tag(target, s, true));
    expect(t);
    try {
      await store.remove(c);
    } catch {
      consume(t);
      return;
    }
    if (siblings.length === 0) return;
    const left = new Set((await store.get().catch(() => [] as SyncCookie[])).map(cookieId));
    for (const s of siblings) if (!left.has(cookieId(s))) await apply(target, s, false);
  }

  function onChange(source: string, c: SyncCookie, cause: string, removed: boolean): void {
    if (disposed || !isGoogleCookieDomain(c.domain)) return;
    if (io.alive && !io.alive(source)) return; // a removed account's data being wiped
    if (removed && cause === 'overwrite') return; // the first half of a set; the set itself follows
    if (consume(tag(source, c, removed))) return; // our own change arriving
    const group = groupOf.get(source);
    if (!group) return;
    for (const other of group.members) if (other !== source) void apply(other, c, removed);
  }

  /** Makes every member's Google cookies equal to the source's. */
  async function align(group: SsoGroup, members: string[]): Promise<void> {
    let source = group.identityId;
    const jars = new Map<string, SyncCookie[] | null>(); // null: couldn't be read
    for (const id of group.members) jars.set(id, await io.store(id).get().then(google, () => null));
    if (!source) source = [...jars.entries()].filter((e) => e[1]).sort((a, b) => b[1]!.length - a[1]!.length)[0]?.[0] ?? null;
    if (!source) return;
    const from = jars.get(source);
    if (!from) return; // never clear everyone because the source couldn't be read
    const keep = new Set(from.map(cookieId));
    for (const id of members) {
      if (id === source) continue;
      for (const c of jars.get(id) ?? []) if (!keep.has(cookieId(c))) await apply(id, c, true);
      for (const c of from) await apply(id, c, false);
    }
  }

  async function clear(accountId: string): Promise<void> {
    for (const c of google(await io.store(accountId).get().catch(() => []))) await apply(accountId, c, true);
  }

  async function run(groups: SsoGroup[]): Promise<void> {
    const next = new Map<string, SsoGroup>();
    for (const g of groups) for (const m of g.members) next.set(m, g);
    const before = groupOf;
    groupOf = next;

    // Leavers: stop listening; clear their Google cookies unless they were their group's identity.
    for (const [id, g] of before) {
      const now = next.get(id);
      if (now && now.spaceId === g.spaceId) continue;
      unsubscribe.get(id)?.();
      unsubscribe.delete(id);
      if (g.identityId !== id && !(now && now.identityId === id)) await clear(id);
    }
    // Joiners: listen.
    for (const id of next.keys()) {
      if (unsubscribe.has(id)) continue;
      unsubscribe.set(id, io.store(id).onChanged((c, cause, removed) => onChange(id, c, cause, removed)));
    }
    // Groups that are new or changed: align their members with the source.
    for (const g of groups) {
      const old = [...before.values()].find((o) => o.spaceId === g.spaceId);
      if (old && JSON.stringify(old) === JSON.stringify(g)) continue;
      await align(g, g.members);
    }
  }

  return {
    /** Applies new groups; cheap when they haven't changed. Calls run one after another. */
    update(groups: SsoGroup[]): Promise<void> {
      const sig = JSON.stringify(groups);
      if (sig === signature || disposed) return queue;
      signature = sig;
      queue = queue.then(() => run(groups)).catch(() => undefined);
      return queue;
    },
    dispose(): void {
      disposed = true;
      for (const off of unsubscribe.values()) off();
      unsubscribe.clear();
      groupOf = new Map();
    },
  };
}
export type GoogleSync = ReturnType<typeof createGoogleSync>;
