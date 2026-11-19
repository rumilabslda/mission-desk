import { type CookieStore, createGoogleSync, type SyncCookie } from '../src/main/sso/google-sync';
import type { SsoGroup } from '../src/shared/sso';

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
};

const ck = (name: string, value: string, domain = '.google.com', extra: Partial<SyncCookie> = {}): SyncCookie => ({
  name,
  value,
  domain,
  path: '/',
  secure: true,
  httpOnly: true,
  hostOnly: !domain.startsWith('.'),
  session: false,
  expirationDate: 2_000_000_000,
  sameSite: 'no_restriction',
  ...extra,
});

/** Behaves like Chromium's cookie store: a set over an existing cookie fires an overwrite removal, then the set. */
class FakeStore implements CookieStore {
  jar = new Map<string, SyncCookie>();
  sets = 0;
  removes = 0;
  gets = 0;
  private listeners = new Set<(c: SyncCookie, cause: string, removed: boolean) => void>();
  private static key = (c: { domain: string; path: string; name: string }) => `${c.domain}|${c.path}|${c.name}`;
  private emit(c: SyncCookie, cause: string, removed: boolean): void {
    queueMicrotask(() => this.listeners.forEach((l) => l(c, cause, removed)));
  }
  /** A change made by the page itself (not by the sync). */
  pageSet(c: SyncCookie): void {
    const old = this.jar.get(FakeStore.key(c));
    if (old) this.emit(old, 'overwrite', true);
    this.jar.set(FakeStore.key(c), c);
    this.emit(c, 'inserted', false);
  }
  pageRemove(c: SyncCookie, cause = 'explicit'): void {
    if (this.jar.delete(FakeStore.key(c))) this.emit(c, cause, true);
  }
  value(name: string, domain = '.google.com'): string | undefined {
    return this.jar.get(`${domain}|/|${name}`)?.value;
  }
  async get(): Promise<SyncCookie[]> {
    this.gets++;
    if (this.failGet) throw new Error('cannot read');
    return [...this.jar.values()];
  }
  async set(c: SyncCookie): Promise<void> {
    this.sets++;
    this.pageSet(c);
  }
  failGet = false;
  /** Like Electron's remove(url, name): every same-name cookie sent to that URL goes. */
  async remove(c: Pick<SyncCookie, 'name' | 'domain' | 'path' | 'secure'>): Promise<void> {
    this.removes++;
    const host = c.domain.replace(/^\./, '');
    for (const x of [...this.jar.values()]) {
      const xHost = x.domain.replace(/^\./, '');
      if (x.name === c.name && xHost === host && c.path.startsWith(x.path)) this.pageRemove(x);
    }
  }
  onChanged(cb: (c: SyncCookie, cause: string, removed: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  get listening(): number {
    return this.listeners.size;
  }
}

function setup(ids: string[], opts: { tagTtlMs?: number } = {}) {
  const stores = Object.fromEntries(ids.map((id) => [id, new FakeStore()])) as Record<string, FakeStore>;
  const dead = new Set<string>();
  const sync = createGoogleSync({ store: (id) => stores[id], alive: (id) => !dead.has(id) }, opts);
  return { stores, sync, dead };
}

const group = (members: string[], identityId: string | null = members[0]): SsoGroup => ({ spaceId: 'S', identityId, members });

describe('google sync', () => {
  test('joining copies the identity’s Google cookies and drops stale ones, leaving other cookies alone', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('SID', 'from-g'));
    stores.g.pageSet(ck('NID', 'n1', '.google.pt'));
    stores.s.pageSet(ck('SID', 'old-s'));
    stores.s.pageSet(ck('OLD', 'stale', 'accounts.google.com'));
    stores.s.pageSet(ck('d', 'slack-session', '.slack.com'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    expect(stores.s.value('SID')).toBe('from-g');
    expect(stores.s.value('NID', '.google.pt')).toBe('n1');
    expect(stores.s.value('OLD', 'accounts.google.com')).toBeUndefined();
    expect(stores.s.value('d', '.slack.com')).toBe('slack-session');
    expect(stores.g.value('SID')).toBe('from-g');
  });

  test('a later change in one app reaches the others', async () => {
    const { stores, sync } = setup(['g', 's1', 's2']);
    await sync.update([group(['g', 's1', 's2'])]);
    stores.s1.pageSet(ck('SIDTS', 'rotated'));
    await flush();
    expect(stores.g.value('SIDTS')).toBe('rotated');
    expect(stores.s2.value('SIDTS')).toBe('rotated');
  });

  test('a rotation (overwrite) is mirrored as the new value, not as a removal', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('SIDTS', 'v1'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    stores.g.pageSet(ck('SIDTS', 'v2'));
    await flush();
    expect(stores.s.value('SIDTS')).toBe('v2');
  });

  test('an explicit removal (sign out) reaches the others', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('SID', 'x'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    stores.g.pageRemove(ck('SID', 'x'));
    await flush();
    expect(stores.s.value('SID')).toBeUndefined();
  });

  test('non-Google cookies are never copied', async () => {
    const { stores, sync } = setup(['g', 's']);
    await sync.update([group(['g', 's'])]);
    stores.s.pageSet(ck('d', 'slack-session', '.slack.com'));
    stores.s.pageSet(ck('x', 'y', '.googleusercontent.com'));
    await flush();
    expect(stores.g.jar.size).toBe(0);
  });

  test('no echo: a mirrored change is not sent back', async () => {
    const { stores, sync } = setup(['g', 's']);
    await sync.update([group(['g', 's'])]);
    stores.g.pageSet(ck('SID', 'a'));
    await flush();
    expect(stores.s.sets).toBe(1);
    expect(stores.g.sets).toBe(0); // pageSet doesn't count; only the sync's own sets do
    await flush();
    expect(stores.s.sets).toBe(1);
  });

  test('leaving clears a Slack account’s Google cookies, but never the identity’s', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('SID', 'x'));
    stores.s.pageSet(ck('d', 'slack-session', '.slack.com'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    await sync.update([]);
    await flush();
    expect(stores.s.value('SID')).toBeUndefined();
    expect(stores.s.value('d', '.slack.com')).toBe('slack-session');
    expect(stores.g.value('SID')).toBe('x');
    expect(stores.s.listening + stores.g.listening).toBe(0);
    stores.g.pageSet(ck('SID', 'after'));
    await flush();
    expect(stores.s.value('SID')).toBeUndefined();
  });

  test('the same groups again do nothing', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('SID', 'x'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    const before = { gets: stores.g.gets + stores.s.gets, sets: stores.s.sets };
    await sync.update([group(['g', 's'])]);
    await flush();
    expect({ gets: stores.g.gets + stores.s.gets, sets: stores.s.sets }).toEqual(before);
  });

  test('without an identity, the member with the most Google cookies is the source', async () => {
    const { stores, sync } = setup(['s1', 's2']);
    stores.s2.pageSet(ck('SID', 'from-s2'));
    stores.s2.pageSet(ck('HSID', 'h'));
    await flush();
    await sync.update([group(['s1', 's2'], null)]);
    await flush();
    expect(stores.s1.value('SID')).toBe('from-s2');
    expect(stores.s2.value('SID')).toBe('from-s2');
  });

  test('dispose stops listening', async () => {
    const { stores, sync } = setup(['g', 's']);
    await sync.update([group(['g', 's'])]);
    sync.dispose();
    stores.g.pageSet(ck('SID', 'late'));
    await flush();
    expect(stores.s.value('SID')).toBeUndefined();
  });

  test('removing an account wipes its jar without signing the rest of the space out', async () => {
    const { stores, sync, dead } = setup(['g', 's1', 's2']);
    stores.g.pageSet(ck('SID', 'x'));
    stores.g.pageSet(ck('HSID', 'h'));
    await flush();
    await sync.update([group(['g', 's1', 's2'])]);
    await flush();
    dead.add('s2'); // the account was removed from the store; its data is being cleared
    for (const c of [...stores.s2.jar.values()]) stores.s2.pageRemove(c);
    await flush();
    expect(stores.g.value('SID')).toBe('x');
    expect(stores.s1.value('HSID')).toBe('h');
  });

  test('removing one cookie does not take same-name cookies on other paths with it', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.g.pageSet(ck('COMPASS', 'root'));
    stores.g.pageSet(ck('COMPASS', 'mail', '.google.com', { path: '/mail' }));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    stores.g.pageRemove(ck('COMPASS', 'mail', '.google.com', { path: '/mail' }));
    await flush();
    expect(stores.g.value('COMPASS')).toBe('root');
    expect(stores.s.value('COMPASS')).toBe('root');
    expect(stores.s.jar.get('.google.com|/mail|COMPASS')).toBeUndefined();
  });

  test('after leaving and rejoining, a real sign-out still reaches the others', async () => {
    const { stores, sync } = setup(['g', 's'], { tagTtlMs: 20 });
    stores.g.pageSet(ck('SID', 'x'));
    await flush();
    await sync.update([group(['g', 's'])]);
    await flush();
    await sync.update([]);
    await flush();
    await new Promise((r) => setTimeout(r, 60));
    await sync.update([group(['g', 's'])]);
    await flush();
    stores.s.pageRemove(ck('SID', 'x'));
    await flush();
    expect(stores.g.value('SID')).toBeUndefined();
  });

  test('if the source can’t be read, nobody is cleared', async () => {
    const { stores, sync } = setup(['g', 's']);
    stores.s.pageSet(ck('SID', 'mine'));
    await flush();
    stores.g.failGet = true;
    await sync.update([group(['g', 's'])]);
    await flush();
    expect(stores.s.value('SID')).toBe('mine');
  });
});
