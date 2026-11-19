import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyEvent, type ChatMessage } from '../src/shared/assistant-history';
import { accountsInScope, scopeOfAccount, scopeList } from '../src/shared/assistant-scope';
import { createConversationStore } from '../src/main/assistant/conversations';

describe('chat messages from the engine’s events', () => {
  test('text, tool steps and a new turn after the user writes', () => {
    let m: ChatMessage[] = [{ role: 'user', text: 'hi', tools: [] }];
    m = applyEvent(m, { type: 'tool', id: 't1', name: 'unread_counts' });
    m = applyEvent(m, { type: 'text', delta: 'You have ' });
    m = applyEvent(m, { type: 'toolDone', id: 't1', isError: false });
    m = applyEvent(m, { type: 'text', delta: '3 unread.' });
    m = applyEvent(m, { type: 'done', isError: false });
    expect(m).toEqual([
      { role: 'user', text: 'hi', tools: [] },
      { role: 'assistant', text: 'You have 3 unread.', tools: [{ id: 't1', name: 'unread_counts', at: 0, done: true, isError: false }] },
    ]);
  });
  test('a tool step remembers where in the text it ran; text after it starts a new paragraph', () => {
    let m: ChatMessage[] = [{ role: 'user', text: '/brief', tools: [] }];
    m = applyEvent(m, { type: 'text', delta: "I'll check your calendars." });
    m = applyEvent(m, { type: 'tool', id: 't1', name: 'calendar' });
    m = applyEvent(m, { type: 'tool', id: 't2', name: 'unread_counts' });
    m = applyEvent(m, { type: 'toolDone', id: 't1', isError: false });
    m = applyEvent(m, { type: 'text', delta: '## Today' });
    expect(m[1].text).toBe("I'll check your calendars.\n\n## Today");
    expect(m[1].tools.map((t) => t.at)).toEqual([26, 26]);
  });
});

describe('scopes', () => {
  const accounts = [
    { id: 'g', name: 'Acme mail', spaceId: 'S1', claudeAccess: 'read' as const },
    { id: 's', name: 'Acme Slack', spaceId: 'S1', claudeAccess: 'off' as const },
    { id: 'p', name: 'Personal', claudeAccess: 'read' as const },
    { id: 'i', name: 'Initech', spaceId: 'S2', claudeAccess: 'act' as const },
  ];
  const spaces = [{ id: 'S1', name: 'Acme' }, { id: 'S2', name: 'Initech' }];

  test("an account's scope: its space, or 'No space'; one for everything in that mode", () => {
    expect(scopeOfAccount(accounts[0], 'space')).toBe('space:S1');
    expect(scopeOfAccount(accounts[2], 'space')).toBe('nospace');
    expect(scopeOfAccount(accounts[0], 'all')).toBe('all');
  });

  test('a space’s assistant sees only that space’s shared accounts', () => {
    expect(accountsInScope(accounts, 'space:S1').map((a) => a.id)).toEqual(['g']);
    expect(accountsInScope(accounts, 'nospace').map((a) => a.id)).toEqual(['p']);
    expect(accountsInScope(accounts, 'all').map((a) => a.id)).toEqual(['g', 'p', 'i']);
    expect(accountsInScope(accounts, 'space:gone')).toEqual([]);
  });

  test('the picker: each space, "No space" when some account has none, and "All spaces"', () => {
    expect(scopeList(accounts, spaces, 'space')).toEqual([
      { key: 'space:S1', name: 'Acme' },
      { key: 'space:S2', name: 'Initech' },
      { key: 'nospace', name: 'No space' },
      { key: 'all', name: 'All spaces' },
    ]);
    expect(scopeList(accounts, spaces, 'all')).toEqual([{ key: 'all', name: 'Everything' }]);
  });
});

describe('saved conversations', () => {
  let dir: string;
  let t = 1000;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-conv-'));
    t = 1000;
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = () => createConversationStore(dir, () => (t += 1000));

  test('a conversation keeps its messages and its Claude session across restarts', () => {
    const s = store();
    const c = s.create('space:S1');
    s.addUser(c.id, 'Who is waiting on me in Acme?');
    s.applyEvent(c.id, { type: 'init', model: 'opus', sessionId: 'sess-1' });
    s.applyEvent(c.id, { type: 'text', delta: 'Nobody.' });
    s.applyEvent(c.id, { type: 'done', isError: false, sessionId: 'sess-1' });
    s.flush();
    const again = store().get(c.id)!;
    expect(again.sessionId).toBe('sess-1');
    expect(again.title).toBe('Who is waiting on me in Acme?');
    expect(again.messages.map((m) => m.text)).toEqual(['Who is waiting on me in Acme?', 'Nobody.']);
  });

  test("a space's history lists only its conversations, newest first; delete removes one", () => {
    const s = store();
    const a = s.create('space:S1');
    s.addUser(a.id, 'first');
    const b = s.create('space:S2');
    s.addUser(b.id, 'other space');
    const c = s.create('space:S1');
    s.addUser(c.id, 'second');
    expect(s.list('space:S1').map((x) => x.title)).toEqual(['second', 'first']);
    s.remove(a.id);
    s.flush();
    expect(store().list('space:S1').map((x) => x.title)).toEqual(['second']);
  });

  test('empty conversations are not listed; old ones beyond the limit are dropped', () => {
    const s = createConversationStore(dir, () => (t += 1000), { perScope: 3 });
    s.create('all'); // never used
    for (let i = 0; i < 5; i++) s.addUser(s.create('all').id, `q${i}`);
    expect(s.list('all').map((x) => x.title)).toEqual(['q4', 'q3', 'q2']);
  });

  test('a disk that refuses the write never crashes the app; the conversation stays in memory', () => {
    const blocked = path.join(dir, 'file-not-folder');
    fs.writeFileSync(blocked, 'x'); // the history folder can't be created here
    const s = createConversationStore(path.join(blocked, 'conversations'), () => (t += 1000));
    const c = s.create('all');
    expect(() => s.addUser(c.id, 'hi')).not.toThrow();
    expect(() => s.flush()).not.toThrow();
    expect(s.get(c.id)?.messages).toHaveLength(1);
  });

  test('files that are not well-formed conversations are skipped', () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify({ id: 'a', scope: 'all', messages: [] })); // no title/updatedAt
    fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({ id: 'b', scope: 'all', title: 't', createdAt: 'x', updatedAt: 'x', messages: [42] }));
    fs.writeFileSync(path.join(dir, 'c.json'), JSON.stringify({ id: 'other', scope: 'all', title: 't', createdAt: 'x', updatedAt: 'x', messages: [{ role: 'user', text: 'q', tools: [] }] }));
    expect(store().list('all')).toEqual([]); // c's name doesn't match its id
  });

  test("a removed space's conversations move to All spaces (still visible, still deletable)", () => {
    const s = store();
    const c = s.create('space:gone');
    s.addUser(c.id, 'about the old client');
    expect(s.scopes()).toContain('space:gone');
    s.reassign('space:gone', 'all');
    s.flush();
    expect(store().list('all').map((x) => x.title)).toEqual(['about the old client']);
    expect(store().scopes()).not.toContain('space:gone');
  });

  test('a corrupt file is skipped, not fatal', () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'broken.json'), '{nope');
    expect(store().list('all')).toEqual([]);
  });
});

test('a conversation remembers which assistant it was with (another one starts its own session)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-conv-'));
  const s = createConversationStore(dir);
  const c = s.create('all');
  s.addUser(c.id, 'hi');
  s.applyEvent(c.id, { type: 'init', model: 'm', sessionId: 'claude-sess' });
  s.setEngine(c.id, 'claude');
  s.flush();
  const again = createConversationStore(dir).get(c.id)!;
  expect(again.engine).toBe('claude');
  s.setEngine(c.id, 'codex'); // switched: the other engine's session is not resumed
  expect(s.get(c.id)?.sessionId).toBeUndefined();
  fs.rmSync(dir, { recursive: true, force: true });
});
