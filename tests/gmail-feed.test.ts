import { addMessage, type Feed } from '../src/shared/messages';
import { gmailOpenCode, mailLines, mergeMail, parseGmailFeed } from '../src/main/mail/gmail-feed';
import { createGmailMail } from '../src/main/mail/gmail-mail';

const entry = (o: { subject?: string; summary?: string; name?: string; email?: string; id?: string; issued?: string } = {}): string => `
  <entry>
    <title>${o.subject ?? 'Proposta &amp; orçamento'}</title>
    <summary>${o.summary ?? 'Olá Armando, segue a proposta que falámos ontem…'}</summary>
    <link rel="alternate" href="https://mail.google.com/mail?account_id=me@x.com&amp;message_id=${o.id ?? '19a1b2c3d4e5f6a7'}&amp;view=conv&amp;extsrc=atom" type="text/html" />
    <modified>${o.issued ?? '2026-11-23T09:58:00Z'}</modified>
    <issued>${o.issued ?? '2026-11-23T09:58:00Z'}</issued>
    <id>tag:gmail.google.com,2004:1849${o.id ?? '0001'}</id>
    <author><name>${o.name ?? 'Ana Silva'}</name><email>${o.email ?? 'ana@x.com'}</email></author>
  </entry>`;
const feed = (...entries: string[]): string => `<?xml version="1.0" encoding="UTF-8"?>
<feed version="0.3" xmlns="http://purl.org/atom/ns#">
  <title>Gmail - Inbox for me@x.com</title>
  <tagline>New messages in your Gmail Inbox</tagline>
  <fullcount>${entries.length}</fullcount>
  <link rel="alternate" href="https://mail.google.com/mail" type="text/html" />
  <modified>2026-11-23T10:00:00Z</modified>
  ${entries.join('\n')}
</feed>`;

describe("Gmail's unread feed", () => {
  test('each unread email: who sent it, the subject, the start of the text, when, and its id', () => {
    expect(parseGmailFeed(feed(entry()))).toEqual([
      {
        id: '19a1b2c3d4e5f6a7',
        from: 'Ana Silva',
        email: 'ana@x.com',
        subject: 'Proposta & orçamento',
        summary: 'Olá Armando, segue a proposta que falámos ontem…',
        at: Date.parse('2026-11-23T09:58:00Z'),
      },
    ]);
  });

  test('an empty inbox is an empty list; anything that is not the feed (a sign-in page) is null', () => {
    expect(parseGmailFeed(feed())).toEqual([]);
    expect(parseGmailFeed('<!doctype html><html><title>Gmail</title></html>')).toBeNull();
    expect(parseGmailFeed('')).toBeNull();
  });

  test('entities decode once (a literal "&amp;lt;" stays "&lt;"); a sender without a name shows the address', () => {
    const [e] = parseGmailFeed(feed(entry({ subject: 'a &lt;b&gt; &#233; &#x41; &amp;lt;', name: '', email: 'x@y.com' })))!;
    expect(e.subject).toBe('a <b> é A &lt;');
    expect(e.from).toBe('x@y.com');
  });

  test('an entry without a usable message id is skipped (it could not be opened)', () => {
    expect(parseGmailFeed(feed(entry({ id: 'not-hex!' }), entry({ id: 'abc123' })))!.map((e) => e.id)).toEqual(['abc123']);
  });
});

describe('unread emails as lines on Home', () => {
  const entries = parseGmailFeed(feed(entry({ id: 'a1', name: 'Ana', issued: '2026-11-23T09:00:00Z' }), entry({ id: 'b2', name: 'Rui', subject: 'Reunião', summary: 'Podemos mudar?', issued: '2026-11-23T08:00:00Z' })))!;

  test('one line each: the sender, then the subject and the start of the text', () => {
    const lines = mailLines('g1', entries, 5, new Set());
    expect(lines.map((m) => [m.title, m.body, m.count, m.mailId])).toEqual([
      ['Ana', 'Proposta & orçamento — Olá Armando, segue a proposta que falámos ontem…', 1, 'a1'],
      ['Rui', 'Reunião — Podemos mudar?', 1, 'b2'],
    ]);
    expect(lines[0].accountId).toBe('g1');
    expect(lines[0].kind).toBe('main');
  });

  test('no more lines than Gmail says are unread (newest first); dismissed ones stay hidden', () => {
    expect(mailLines('g1', entries, 1, new Set()).map((m) => m.mailId)).toEqual(['a1']);
    expect(mailLines('g1', entries, 0, new Set())).toEqual([]);
    expect(mailLines('g1', entries, 'dot', new Set())).toHaveLength(2);
    const key = mailLines('g1', entries, 5, new Set())[0].key;
    expect(mailLines('g1', entries, 5, new Set([key])).map((m) => m.mailId)).toEqual(['b2']);
  });

  test('a long text is cut; an email with no text shows its subject alone', () => {
    const long = parseGmailFeed(feed(entry({ summary: 'x'.repeat(1000) })))!;
    expect(mailLines('g1', long, 5, new Set())[0].body.length).toBeLessThanOrEqual(300);
    const bare = parseGmailFeed(feed(entry({ summary: '' })))!;
    expect(mailLines('g1', bare, 5, new Set())[0].body).toBe('Proposta & orçamento');
  });

  test('merged with chat notifications by time; a Gmail notification for the same email is not listed twice', () => {
    let notes: Feed = [];
    const n = { accountId: 'g1', kind: 'main' as const, sender: 3, tag: '' };
    notes = addMessage(notes, { ...n, id: 1, title: 'Ana', body: 'Proposta & orçamento Olá Armando' }, Date.parse('2026-11-23T09:00:01Z')); // the same email
    notes = addMessage(notes, { ...n, id: 2, title: 'Equipa (Chat)', body: 'Bom dia' }, Date.parse('2026-11-23T08:30:00Z'));
    notes = addMessage(notes, { ...n, accountId: 's1', id: 3, title: 'Ana', body: 'Proposta & orçamento' }, Date.parse('2026-11-23T07:00:00Z')); // another app
    const merged = mergeMail(notes, mailLines('g1', entries, 5, new Set()));
    expect(merged.map((m) => [m.accountId, m.title, m.mailId ?? null])).toEqual([
      ['g1', 'Ana', 'a1'],
      ['g1', 'Equipa (Chat)', null],
      ['g1', 'Rui', 'b2'],
      ['s1', 'Ana', null],
    ]);
  });

  test('opening one: Gmail goes to that conversation (only a hex id ever reaches the page)', () => {
    expect(gmailOpenCode('19a1b2c3d4e5f6a7')).toBe("location.hash = '#all/19a1b2c3d4e5f6a7'");
    expect(gmailOpenCode("1'; alert(1)//")).toBeNull();
  });
});

describe('reading the feed for each Google account', () => {
  const ok = (body: string) => ({ status: 200, text: async () => body });

  test('fetches, keeps the entries, and says when they changed', async () => {
    const changes: string[] = [];
    const fetch = vi.fn(async () => ok(feed(entry({ id: 'a1' }))));
    const mail = createGmailMail({ fetch, onChange: (id) => changes.push(id), unread: () => 5, delayMs: 0 });
    await mail.refresh('g1');
    expect(fetch).toHaveBeenCalledWith('g1', 'https://mail.google.com/mail/u/0/feed/atom');
    expect(mail.entries('g1').map((e) => e.id)).toEqual(['a1']);
    expect(mail.working('g1')).toBe(true);
    expect(changes).toEqual(['g1']);
    await mail.refresh('g1'); // same entries: no change
    expect(changes).toEqual(['g1']);
  });

  test('signed out or blocked: nothing listed and not working (Home keeps its hint)', async () => {
    const mail = createGmailMail({ fetch: async () => ({ status: 401, text: async () => '' }), onChange: () => undefined, unread: () => 5, delayMs: 0 });
    await mail.refresh('g1');
    expect(mail.entries('g1')).toEqual([]);
    expect(mail.working('g1')).toBe(false);
    const html = createGmailMail({ fetch: async () => ok('<html>sign in</html>'), onChange: () => undefined, unread: () => 5, delayMs: 0 });
    await html.refresh('g1');
    expect(html.working('g1')).toBe(false);
  });

  test('a failed fetch after a good one keeps the last entries (a blip is not "all read")', async () => {
    let fail = false;
    const mail = createGmailMail({
      fetch: async () => {
        if (fail) throw new Error('offline');
        return ok(feed(entry({ id: 'a1' })));
      },
      onChange: () => undefined,
      unread: () => 5,
      delayMs: 0,
    });
    await mail.refresh('g1');
    fail = true;
    await mail.refresh('g1');
    expect(mail.entries('g1').map((e) => e.id)).toEqual(['a1']);
  });

  test('a burst of refreshes for one account makes one fetch', async () => {
    const fetch = vi.fn(async () => ok(feed()));
    const mail = createGmailMail({ fetch, onChange: () => undefined, unread: () => 5, delayMs: 20 });
    await Promise.all([mail.refresh('g1'), mail.refresh('g1'), mail.refresh('g1')]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('an inbox with tabs (more in the feed than Gmail counts): the Primary tab is read instead', async () => {
    const urls: string[] = [];
    const fetch = async (_: string, url: string) => {
      urls.push(url);
      return url.endsWith('%5Esq_ig_i_personal') ? ok(feed(entry({ id: 'ff01' }))) : ok(feed(entry({ id: 'ee01' }), entry({ id: 'ee02' }), entry({ id: 'ff01' })));
    };
    const mail = createGmailMail({ fetch, onChange: () => undefined, unread: () => 1, delayMs: 0 });
    await mail.refresh('g1');
    expect(mail.entries('g1').map((e) => e.id)).toEqual(['ff01']);
    expect(urls).toEqual(['https://mail.google.com/mail/u/0/feed/atom', 'https://mail.google.com/mail/u/0/feed/atom/%5Esq_ig_i_personal']);
  });

  test('no tabs (Primary is empty, or the feed fits the count): the whole inbox', async () => {
    const urls: string[] = [];
    const fetch = async (_: string, url: string) => {
      urls.push(url);
      return url.endsWith('%5Esq_ig_i_personal') ? ok(feed()) : ok(feed(entry({ id: 'a1' }), entry({ id: 'a2' })));
    };
    const fits = createGmailMail({ fetch, onChange: () => undefined, unread: () => 2, delayMs: 0 });
    await fits.refresh('g1');
    expect(fits.entries('g1')).toHaveLength(2);
    expect(urls).toHaveLength(1); // no second request
    const lagging = createGmailMail({ fetch, onChange: () => undefined, unread: () => 1, delayMs: 0 });
    await lagging.refresh('g1');
    expect(lagging.entries('g1')).toHaveLength(2); // Primary empty: not tabs, keep the inbox (Home shows the count's worth)
  });

  test('forget: the account removed or all read', async () => {
    const changes: string[] = [];
    const mail = createGmailMail({ fetch: async () => ok(feed(entry())), onChange: (id) => changes.push(id), unread: () => 5, delayMs: 0 });
    await mail.refresh('g1');
    mail.forget('g1');
    expect(mail.entries('g1')).toEqual([]);
    expect(changes).toEqual(['g1', 'g1']);
    mail.forget('g1'); // nothing to forget: no change
    expect(changes).toHaveLength(2);
  });
});
