import { addMessage, ago, closeMessage, forAccountRead, MAX_MESSAGES, MAX_PER_ACCOUNT, messageViews, removeMessage, trimToUnread, type Feed } from '../src/shared/messages';

const base = { accountId: 'a1', kind: 'main' as const, sender: 7 };
const msg = (over: Partial<Parameters<typeof addMessage>[1]> = {}) => ({ ...base, id: 1, title: 'Ana Silva', body: 'Olá', tag: '', ...over });

describe('the message list on Home', () => {
  test('newest first; one line per conversation, counting the messages', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ id: 1, title: 'Ana', body: 'one' }), 1000);
    f = addMessage(f, msg({ id: 2, title: 'Rui', body: 'hi' }), 2000);
    f = addMessage(f, msg({ id: 3, title: 'Ana', body: 'two' }), 3000); // same chat (same title, no tag)
    expect(f.map((m) => [m.title, m.body, m.count, m.at])).toEqual([
      ['Ana', 'two', 2, 3000],
      ['Rui', 'hi', 1, 2000],
    ]);
  });

  test('a tag identifies the conversation when the page gives one', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ id: 1, tag: 'chat-9', title: 'Ana' }), 1);
    f = addMessage(f, msg({ id: 2, tag: 'chat-9', title: 'Ana (2 new)' }), 2);
    f = addMessage(f, msg({ id: 3, tag: 'chat-4', title: 'Ana' }), 3); // another chat with the same title
    expect(f.map((m) => [m.title, m.count])).toEqual([
      ['Ana', 1],
      ['Ana (2 new)', 2],
    ]);
  });

  test('the same chat in two accounts stays apart', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ accountId: 'a1' }), 1);
    f = addMessage(f, msg({ accountId: 'a2' }), 2);
    expect(f).toHaveLength(2);
  });

  test('read in the app (the page closes its latest notification): the line goes', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ id: 1 }), 1);
    f = addMessage(f, msg({ id: 2 }), 2);
    expect(closeMessage(f, 7, 1)).toHaveLength(1); // an older one replaced by the page: still unread
    expect(closeMessage(f, 7, 2)).toHaveLength(0);
    expect(closeMessage(f, 8, 2)).toHaveLength(1); // another page's id
  });

  test('when an account has nothing unread any more, its lines go', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ accountId: 'a1' }), 1);
    f = addMessage(f, msg({ accountId: 'a2' }), 2);
    expect(forAccountRead(f, 'a1').map((m) => m.accountId)).toEqual(['a2']);
  });

  test('dismissed by hand; the list is bounded', () => {
    let f: Feed = [];
    for (let i = 0; i < MAX_MESSAGES + 5; i++) f = addMessage(f, msg({ accountId: `a${i}`, id: i, title: `p${i}` }), i);
    expect(f).toHaveLength(MAX_MESSAGES);
    expect(f[0].title).toBe(`p${MAX_MESSAGES + 4}`);
    expect(removeMessage(f, f[0].key)).toHaveLength(MAX_MESSAGES - 1);
  });

  test('a message with neither sender nor text is not listed', () => {
    expect(addMessage([], msg({ title: ' ', body: '' }), 1)).toEqual([]);
  });

  test('what the UI gets: no page internals; previews only when allowed', () => {
    const f = addMessage([], msg({ title: 'Ana', body: 'segredo' }), 5);
    const [v] = messageViews(f, true);
    expect(v).toEqual({ key: f[0].key, accountId: 'a1', title: 'Ana', body: 'segredo', at: 5, count: 1 });
    expect(messageViews(f, false)[0].body).toBe('');
  });
});

describe('how long ago, on a line', () => {
  const now = Date.UTC(2026, 10, 18, 12, 0);
  test('now, minutes, hours, then the weekday', () => {
    expect(ago(now - 20_000, now)).toBe('now');
    expect(ago(now - 5 * 60_000, now)).toBe('5 min');
    expect(ago(now - 3 * 3600_000, now)).toBe('3 h');
    expect(ago(now - 30 * 3600_000, now)).toMatch(/^\w+/);
  });
});

describe('after the review', () => {
  test('one app cannot push the others out: at most MAX_PER_ACCOUNT lines each', () => {
    let f: Feed = addMessage([], msg({ accountId: 'other', title: 'keep me' }), 0);
    for (let i = 0; i < 40; i++) f = addMessage(f, msg({ id: i, tag: `t${i}` }), i + 1);
    expect(f.filter((m) => m.accountId === 'a1')).toHaveLength(MAX_PER_ACCOUNT);
    expect(f.some((m) => m.title === 'keep me')).toBe(true);
  });

  test('text: spaces collapsed, direction and control characters removed, huge input cut', () => {
    const f = addMessage([], msg({ title: 'Ana‮ evil', body: 'a\n\n  b\u0007' + 'x'.repeat(5_000_000) }), 1);
    expect(f[0].title).toBe('Ana evil');
    expect(f[0].body.startsWith('a b')).toBe(true);
    expect(f[0].body.length).toBeLessThanOrEqual(300);
  });

  test('when an app has fewer unread than lines, only the newest stay', () => {
    let f: Feed = [];
    f = addMessage(f, msg({ title: 'old' }), 1);
    f = addMessage(f, msg({ title: 'mid' }), 2);
    f = addMessage(f, msg({ title: 'new' }), 3);
    f = addMessage(f, msg({ accountId: 'a2', title: 'other app' }), 4);
    expect(trimToUnread(f, 'a1', 5, 1).filter((m) => m.accountId === 'a1').map((m) => m.title)).toEqual(['new']);
    expect(trimToUnread(f, 'a1', 'dot', 0).filter((m) => m.accountId === 'a1')).toEqual([]);
    expect(trimToUnread(f, 'a1', 0, 0)).toBe(f); // no drop: an app that reports nothing keeps its lines
    expect(trimToUnread(f, 'a1', 1, 3)).toBe(f); // more unread: nothing goes
    expect(trimToUnread(f, 'a2', 3, 2).length).toBe(f.length); // still more unread than lines
  });

  test('older than a week shows the date', () => {
    const now = Date.UTC(2026, 10, 18, 12, 0);
    expect(ago(now - 9 * 24 * 3600_000, now)).not.toBe(ago(now - 2 * 24 * 3600_000, now));
    expect(ago(now - 9 * 24 * 3600_000, now)).toMatch(/\d/);
  });
});
