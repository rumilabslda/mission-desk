import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from '../src/main/accounts/store';

let dir: string;
let file: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-store-'));
  file = path.join(dir, 'accounts.json');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('starts with default state when file is missing', () => {
  const store = createStore(file);
  expect(store.state().accounts).toEqual([]);
  expect(store.state().activeAccountId).toBeNull();
  expect(store.loadWarning()).toBeNull();
});

test('add persists across a new store instance', () => {
  const a = createStore(file).add({ service: 'google', name: 'Client X', color: '#ff0000' });
  expect(a).toMatchObject({ service: 'google', name: 'Client X', color: '#ff0000', muted: false, hibernateWhenIdle: false });
  expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(createStore(file).state().accounts).toEqual([a]);
});

test("a custom app keeps its address", () => {
  const a = createStore(file).add({ service: 'custom', name: 'Notion', color: '#111111', url: 'https://www.notion.so/' });
  expect(createStore(file).state().accounts[0]).toMatchObject({ id: a.id, service: 'custom', url: 'https://www.notion.so/' });
});

test('update changes only the given fields', () => {
  const store = createStore(file);
  const a = store.add({ service: 'slack', name: 'Acme', color: '#00ff00' });
  const updated = store.update(a.id, { muted: true });
  expect(updated).toEqual({ ...a, muted: true });
  expect(createStore(file).state().accounts[0]).toEqual({ ...a, muted: true });
});

test('remove clears active id and google sub-app entry', () => {
  const store = createStore(file);
  const a = store.add({ service: 'google', name: 'A', color: '#000000' });
  const b = store.add({ service: 'whatsapp', name: 'B', color: '#111111' });
  store.setActive(a.id);
  store.setGoogleSubApp(a.id, 'calendar');
  store.remove(a.id);
  const s = createStore(file).state();
  expect(s.accounts.map((x) => x.id)).toEqual([b.id]);
  expect(s.activeAccountId).toBeNull();
  expect(s.activeGoogleSubApp).toEqual({});
});

test('reorder rejects a non-permutation', () => {
  const store = createStore(file);
  const a = store.add({ service: 'google', name: 'A', color: '#000000' });
  const b = store.add({ service: 'slack', name: 'B', color: '#000000' });
  expect(() => store.reorder([a.id])).toThrow();
  expect(() => store.reorder([a.id, 'nope'])).toThrow();
  store.reorder([b.id, a.id]);
  expect(createStore(file).state().accounts.map((x) => x.id)).toEqual([b.id, a.id]);
});

test('corrupt file → default state, file kept as accounts.json.bak, loadWarning non-null', () => {
  fs.writeFileSync(file, '{not json');
  const store = createStore(file);
  expect(store.state().accounts).toEqual([]);
  expect(fs.readFileSync(`${file}.bak`, 'utf8')).toBe('{not json');
  expect(store.loadWarning()).not.toBeNull();
});

test('wrong shape counts as corrupt', () => {
  fs.writeFileSync(file, JSON.stringify({ version: 2, accounts: 'x' }));
  expect(createStore(file).loadWarning()).not.toBeNull();
});

test('no .tmp file left after save', () => {
  createStore(file).add({ service: 'google', name: 'A', color: '#000000' });
  expect(fs.readdirSync(dir).sort()).toEqual(['accounts.json']);
});

test('window bounds persist', () => {
  createStore(file).setWindow({ x: 1, y: 2, width: 800, height: 600 });
  expect(createStore(file).state().window).toEqual({ x: 1, y: 2, width: 800, height: 600 });
});

test('setCalendarHidden adds and removes ids and persists', () => {
  const store = createStore(file);
  const a = store.add({ service: 'google', name: 'A', color: '#111111' });
  const b = store.add({ service: 'google', name: 'B', color: '#222222' });
  store.setCalendarHidden(a.id, true);
  store.setCalendarHidden(b.id, true);
  store.setCalendarHidden(a.id, true); // no duplicates
  expect(createStore(file).state().calendarHidden).toEqual([a.id, b.id]);
  store.setCalendarHidden(a.id, false);
  expect(createStore(file).state().calendarHidden).toEqual([b.id]);
});

test('setCalendarHidden ignores unknown accounts', () => {
  const store = createStore(file);
  store.setCalendarHidden('nope', true);
  expect(store.state().calendarHidden ?? []).toEqual([]);
});

test('remove drops the account from calendarHidden', () => {
  const store = createStore(file);
  const a = store.add({ service: 'google', name: 'A', color: '#111111' });
  store.setCalendarHidden(a.id, true);
  store.remove(a.id);
  expect(store.state().calendarHidden).toEqual([]);
});

describe('spaces', () => {
  function three() {
    const store = createStore(file);
    const a = store.add({ service: 'google', name: 'A', color: '#111111' });
    const b = store.add({ service: 'slack', name: 'B', color: '#222222' });
    const c = store.add({ service: 'whatsapp', name: 'C', color: '#333333' });
    return { store, a, b, c };
  }
  const order = (s: ReturnType<typeof createStore>) => s.state().accounts.map((x) => `${x.name}${x.spaceId ? '*' : ''}`).join(' ');

  test('createSpace persists and groups the accounts', () => {
    const { store, a, c } = three();
    const sp = store.createSpace('  Client ', [c.id, a.id]);
    expect(sp.name).toBe('Client');
    const again = createStore(file);
    expect(again.state().spaces).toEqual([sp]);
    expect(order(again)).toBe('B C* A*');
  });

  test('createSpace refuses a bad name or no known account', () => {
    const { store, a } = three();
    expect(() => store.createSpace(' ', [a.id])).toThrow();
    expect(() => store.createSpace('X', ['nope'])).toThrow();
  });

  test('renameSpace and setSpaceAlwaysOpen persist', () => {
    const { store, a } = three();
    const sp = store.createSpace('X', [a.id]);
    store.renameSpace(sp.id, 'Y');
    store.setSpaceAlwaysOpen(sp.id, true);
    expect(createStore(file).state().spaces).toEqual([{ id: sp.id, name: 'Y', alwaysOpen: true }]);
  });

  test('ungroup keeps the accounts', () => {
    const { store, a, b } = three();
    const sp = store.createSpace('X', [a.id, b.id]);
    store.ungroup(sp.id);
    expect(order(createStore(file))).toBe('A B C');
    expect(createStore(file).state().spaces).toEqual([]);
  });

  test('moveToSpace null leaves the space; the last member leaving drops the space', () => {
    const { store, a, b, c } = three();
    const sp = store.createSpace('X', [a.id, b.id]);
    store.moveToSpace(c.id, sp.id);
    expect(order(store)).toBe('A* B* C*');
    store.moveToSpace(a.id, null);
    expect(order(store)).toBe('B* C* A');
    store.moveToSpace(b.id, null);
    store.moveToSpace(c.id, null);
    expect(createStore(file).state().spaces).toEqual([]);
  });

  test('remove of the last member drops the space', () => {
    const { store, a } = three();
    store.createSpace('X', [a.id]);
    store.remove(a.id);
    expect(createStore(file).state().spaces).toEqual([]);
  });

  test('dropInSidebar applies moves and returns the create intent without changing state', () => {
    const { store, a, b, c } = three();
    const before = order(store);
    expect(store.dropInSidebar({ kind: 'account', id: c.id }, { kind: 'account', id: a.id }, 'into')).toEqual({ create: [a.id, c.id] });
    expect(order(store)).toBe(before);
    const sp = store.createSpace('X', [a.id, b.id]);
    expect(store.dropInSidebar({ kind: 'account', id: c.id }, { kind: 'space', id: sp.id }, 'into')).toBeNull();
    expect(order(createStore(file))).toBe('A* B* C*');
  });

  test('moveWithin swaps inside a space', () => {
    const { store, a, b } = three();
    store.createSpace('X', [a.id, b.id]);
    store.moveWithin(b.id, -1);
    expect(order(createStore(file))).toBe('B* A* C');
  });

  test('setSidebarStyle persists', () => {
    const { store } = three();
    store.setSidebarStyle('sections');
    expect(createStore(file).state().sidebarStyle).toBe('sections');
  });

  test('an old file without spaces loads unchanged', () => {
    const { store } = three();
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    delete raw.spaces;
    fs.writeFileSync(file, JSON.stringify(raw));
    const again = createStore(file);
    expect(again.loadWarning()).toBeNull();
    expect(order(again)).toBe(order(store));
  });

  test('a file whose spaceIds point nowhere loads normalised', () => {
    const { a, b, c } = three();
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    raw.accounts = [
      { ...raw.accounts[0], spaceId: 'S' },
      { ...raw.accounts[1], spaceId: 'ghost' },
      { ...raw.accounts[2], spaceId: 'S' },
    ];
    raw.spaces = [{ id: 'S', name: 'S' }, { id: 'E', name: 'Empty' }];
    fs.writeFileSync(file, JSON.stringify(raw));
    const again = createStore(file);
    expect(again.state().accounts.map((x) => [x.id, x.spaceId])).toEqual([
      [a.id, 'S'],
      [c.id, 'S'],
      [b.id, undefined],
    ]);
    expect(again.state().spaces).toEqual([{ id: 'S', name: 'S' }]);
  });
});

test('add can put the new account straight into an existing space', () => {
  const store = createStore(file);
  const a = store.add({ service: 'google', name: 'Initech', color: '#111111' });
  const space = store.createSpace('Initech', [a.id]);
  const b = store.add({ service: 'slack', name: 'Initech Slack', color: '#222222' }, { spaceId: space.id });
  const saved = createStore(file).state();
  expect(saved.accounts.find((x) => x.id === b.id)?.spaceId).toBe(space.id);
  expect(saved.spaces).toHaveLength(1);
});

test('add with a new space name creates that space holding the account', () => {
  const store = createStore(file);
  const b = store.add({ service: 'slack', name: 'Acme Slack', color: '#222222' }, { newSpace: '  Acme ' });
  const saved = createStore(file).state();
  expect(saved.spaces?.map((s) => s.name)).toEqual(['Acme']);
  expect(saved.accounts.find((x) => x.id === b.id)?.spaceId).toBe(saved.spaces![0].id);
});

test('add with an unknown space leaves the account loose', () => {
  const store = createStore(file);
  const b = store.add({ service: 'slack', name: 'Acme', color: '#222222' }, { spaceId: 'nope' });
  expect(store.state().accounts.find((x) => x.id === b.id)?.spaceId).toBeUndefined();
});

test('space Google sharing settings persist and validate', () => {
  const store = createStore(file);
  const g1 = store.add({ service: 'google', name: 'G1', color: '#111111' });
  const g2 = store.add({ service: 'google', name: 'G2', color: '#111111' });
  const s1 = store.add({ service: 'slack', name: 'S1', color: '#111111' });
  const sp = store.createSpace('Client', [g1.id, g2.id, s1.id]);
  store.setSpaceShareGoogle(sp.id, false);
  store.setSpaceGoogleAccount(sp.id, g2.id);
  store.setSpaceGoogleAccount(sp.id, s1.id); // not a Google account: ignored
  store.setSpaceShareGoogle('nope', false); // unknown space: ignored
  let saved = createStore(file).state().spaces![0];
  expect(saved.shareGoogle).toBe(false);
  expect(saved.googleAccountId).toBe(g2.id);
  store.setSpaceShareGoogle(sp.id, true);
  saved = createStore(file).state().spaces![0];
  expect(saved.shareGoogle).toBeUndefined();
});

test('an opened space stays open after a restart', () => {
  const store = createStore(file);
  const a = store.add({ service: 'slack', name: 'A', color: '#111111' });
  const sp = store.createSpace('Client', [a.id]);
  store.setSpaceOpen(sp.id, true);
  expect(createStore(file).state().spaces![0].open).toBe(true);
  store.setSpaceOpen(sp.id, false);
  expect(createStore(file).state().spaces![0].open).toBeUndefined();
  store.setSpaceOpen('nope', true); // unknown: ignored
});

test('the week start choice persists; auto clears it', () => {
  const store = createStore(file);
  store.setWeekStart(0);
  expect(createStore(file).state().weekStart).toBe(0);
  store.setWeekStart('auto');
  expect(createStore(file).state().weekStart).toBeUndefined();
});

test('the calendar remembers the account last used to create (Google only)', () => {
  const store = createStore(file);
  const g = store.add({ service: 'google', name: 'G', color: '#111111' });
  const s = store.add({ service: 'slack', name: 'S', color: '#111111' });
  store.setCalendarDefaultAccount(g.id);
  store.setCalendarDefaultAccount(s.id); // not Google: ignored
  expect(createStore(file).state().calendarDefaultAccount).toBe(g.id);
});

test('open on Today is on by default and can be turned off', () => {
  const store = createStore(file);
  expect(store.state().openOnToday).toBeUndefined();
  store.setOpenOnToday(false);
  expect(createStore(file).state().openOnToday).toBe(false);
  store.setOpenOnToday(true);
  expect(createStore(file).state().openOnToday).toBeUndefined();
});

test("the user's name is kept, and '' clears it", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-name-')), 'accounts.json');
  const s = createStore(file);
  s.setUserName('Armando');
  expect(createStore(file).state().userName).toBe('Armando');
  s.setUserName('');
  expect(createStore(file).state().userName).toBeUndefined();
});
