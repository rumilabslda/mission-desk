import { createConsent } from '../src/main/claude/consent';
import { createControlService, type ControlHost, type PageHandle } from '../src/main/claude/control';
import type { Account, ViewKind } from '../src/shared/types';

const acct = (id: string, name: string, access: Account['claudeAccess'], service: Account['service'] = 'google'): Account => ({
  id, service, name, color: '#000000', muted: false, hibernateWhenIdle: false, claudeAccess: access,
});

interface FakePage extends PageHandle {
  clicks: [number, number][];
  inserted: string[];
  keys: [string, string[]][];
  point: { x: number; y: number } | { error: string };
  focused: boolean;
  takesText: boolean;
  elements: { ref: number; role: string; name: string }[];
  scripts: string[];
}

type Opts = { consent?: boolean | Promise<boolean>; pageError?: Error; text?: string; pageDelay?: Promise<void> };

function setup(opts: Opts = {}) {
  const accounts = [acct('t', 'Acme', 'act'), acct('r', 'Globex', 'read'), acct('p', 'Personal', 'off'), acct('w', 'WhatsApp', 'act', 'whatsapp')];
  const pages = new Map<string, FakePage>();
  const logs: string[] = [];
  const shown: string[] = [];
  let consentCalls = 0;
  const consentSignals: (AbortSignal | undefined)[] = [];
  const makePage = (): FakePage => {
    const page: FakePage = {
      clicks: [], inserted: [], keys: [], scripts: [], point: { x: 10, y: 20 }, focused: true, takesText: true,
      elements: [{ ref: 1, role: 'textbox', name: 'Message' }, { ref: 2, role: 'button', name: 'Send' }],
      url: () => 'https://mail.google.com/mail/u/0/#inbox',
      title: () => 'Inbox (2) - user@example.com - Gmail',
      evalIsolated: async <T,>(code: string) => {
        page.scripts.push(code);
        if (code.includes('/*read*/')) return (opts.text ?? 'hello world') as T;
        if (code.includes('/*collect*/')) return page.elements as T;
        if (code.includes('/*focus*/')) return page.focused as T;
        if (code.includes('/*point*/')) return page.point as T;
        if (code.includes('/*takes-text*/')) return page.takesText as T;
        throw new Error(`unexpected script ${code.slice(0, 40)}`);
      },
      capturePng: async () => Buffer.from('png'),
      mouseClick: (x, y) => void page.clicks.push([x, y]),
      insertText: (t) => void page.inserted.push(t),
      key: (k, m) => void page.keys.push([k, m]),
    };
    return page;
  };
  let pageImpl = async (id: string, kind: ViewKind): Promise<FakePage> => {
    if (opts.pageDelay) await opts.pageDelay;
    if (opts.pageError) throw opts.pageError;
    const key = `${id}|${kind}`;
    if (!pages.has(key)) pages.set(key, makePage());
    return pages.get(key)!;
  };
  const hostPage = pageImpl;
  const host: ControlHost = {
    accounts: () => accounts,
    tabs: (id) => (accounts.find((a) => a.id === id)?.service === 'google' ? (['main', 'calendar'] as ViewKind[]) : ['main']),
    defaultKind: () => current.kind,
    page: (id, kind) => pageImpl(id, kind),
    show: (id, kind) => void shown.push(`${id}|${kind}`),
    openUrl: async (_id, target) => (target.kind === 'extra' ? 'extra:1' : target.kind),
    askConsent: async (_a, signal) => {
      consentCalls++;
      consentSignals.push(signal);
      return opts.consent ?? true;
    },
    log: (line) => void logs.push(line),
  };
  const current = { kind: 'main' as ViewKind };
  const consent = createConsent(() => 0);
  const control = createControlService(host, consent);
  const session = control.session();
  const setPage = (fn: typeof pageImpl): void => {
    pageImpl = fn;
  };
  return { control, session, consent, pages, logs, shown, current, accounts, hostPage, setPage, consentCalls: () => consentCalls, consentSignals };
}

/** The ref numbers listed by get_elements, in order. */
const refs = (text: string | undefined): number[] => [...(text ?? '').matchAll(/^\[(\d+)\]/gm)].map((m) => Number(m[1]));

test('list_accounts hides accounts with access off', async () => {
  const { session } = setup();
  const r = await session.call('list_accounts', {});
  expect(r.text).toContain('Acme');
  expect(r.text).toContain('Globex');
  expect(r.text).not.toContain('Personal');
  expect(r.text).toContain('id=t');
});

test('read_page wraps the text as untrusted and truncates it', async () => {
  const { session } = setup({ text: 'x'.repeat(50_000) });
  const r = await session.call('read_page', { account: 'Globex' });
  expect(r.text).toMatch(/^URL: https:\/\/mail\.google\.com/);
  expect(r.text).toContain('<untrusted_page_content>\n');
  expect(r.text).toContain('\n</untrusted_page_content>');
  expect(r.text!.length).toBeLessThan(40_000 + 300);
});

test('get_elements output is marked as untrusted page content', async () => {
  const { session } = setup();
  const r = await session.call('get_elements', { account: 'Globex' });
  expect(r.text).toMatch(/^<untrusted_page_content>\n\[\d+\] textbox "Message"/);
  expect(r.text).toMatch(/\n<\/untrusted_page_content>$/);
});

test('act tools on a read-only account fail without asking consent', async () => {
  const { session, consentCalls } = setup();
  const r = await session.call('click', { account: 'Globex', ref: 1 });
  expect(r.isError).toBe(true);
  expect(r.text).toMatch(/Read & act/);
  expect(consentCalls()).toBe(0);
});

test('two concurrent clicks ask for consent once', async () => {
  let answer!: (v: boolean) => void;
  const pending = new Promise<boolean>((r) => (answer = r));
  const { session, pages, consentCalls } = setup({ consent: pending });
  const [ref] = refs((await session.call('get_elements', { account: 'Acme' })).text);
  const a = session.call('click', { account: 'Acme', ref });
  const b = session.call('click', { account: 'Acme', ref });
  answer(true);
  const [ra, rb] = await Promise.all([a, b]);
  expect(ra.isError).toBeFalsy();
  expect(rb.isError).toBeFalsy();
  expect(consentCalls()).toBe(1);
  expect(pages.get('t|main')!.clicks).toHaveLength(2);
});

test('denied consent is an error and nothing is clicked', async () => {
  const { session, pages } = setup({ consent: false });
  const [ref] = refs((await session.call('get_elements', { account: 'Acme' })).text);
  const r = await session.call('click', { account: 'Acme', ref });
  expect(r).toEqual({ text: 'The user declined Claude acting in Acme.', isError: true });
  expect(pages.get('t|main')!.clicks).toHaveLength(0);
});

test('an unknown ref is an error', async () => {
  const { session } = setup();
  const r = await session.call('click', { account: 'Acme', ref: 999 });
  expect(r).toEqual({ text: 'Unknown ref 999; call get_elements first.', isError: true });
});

test('a stale or covered element never gets clicked', async () => {
  const { session, pages } = setup();
  const [ref] = refs((await session.call('get_elements', { account: 'Acme' })).text);
  pages.get('t|main')!.point = { error: 'stale' };
  expect((await session.call('click', { account: 'Acme', ref })).text).toBe('The page changed; call get_elements again.');
  pages.get('t|main')!.point = { error: 'obscured' };
  expect((await session.call('click', { account: 'Acme', ref })).text).toBe(
    'Something else is on top of that element or it moved; call get_elements again.',
  );
  expect(pages.get('t|main')!.clicks).toHaveLength(0);
});

describe('refs are unique: never another tab, account or connection', () => {
  test('two tabs snapshotted separately get different refs, and a ref acts on its own tab', async () => {
    const { session, pages, current } = setup();
    const mailRefs = refs((await session.call('get_elements', { account: 'Acme', tab: 'mail' })).text);
    const calRefs = refs((await session.call('get_elements', { account: 'Acme', tab: 'calendar' })).text);
    expect(mailRefs.some((r) => calRefs.includes(r))).toBe(false);
    current.kind = 'calendar'; // the user is now looking at Calendar
    await session.call('click', { account: 'Acme', ref: mailRefs[0] });
    expect(pages.get('t|main')!.clicks).toHaveLength(1);
    expect(pages.get('t|calendar')!.clicks).toHaveLength(0);
  });

  test('a ref used with a different tab argument is refused', async () => {
    const { session } = setup();
    const [ref] = refs((await session.call('get_elements', { account: 'Acme', tab: 'mail' })).text);
    const r = await session.call('click', { account: 'Acme', ref, tab: 'calendar' });
    expect(r).toEqual({ text: `Ref ${ref} belongs to the mail tab, not calendar.`, isError: true });
  });

  test('a ref used with another account is refused', async () => {
    const { session } = setup();
    const [ref] = refs((await session.call('get_elements', { account: 'Acme' })).text);
    const r = await session.call('click', { account: 'WhatsApp', ref });
    expect(r).toEqual({ text: `Ref ${ref} belongs to another account.`, isError: true });
  });

  test("one connection cannot use another connection's refs", async () => {
    const { control } = setup();
    const a = control.session();
    const b = control.session();
    const [ref] = refs((await a.call('get_elements', { account: 'Acme' })).text);
    expect((await b.call('click', { account: 'Acme', ref })).text).toBe(`Unknown ref ${ref}; call get_elements first.`);
  });

  test('a new snapshot of the same tab retires the old refs', async () => {
    const { session } = setup();
    const [old] = refs((await session.call('get_elements', { account: 'Acme' })).text);
    await session.call('get_elements', { account: 'Acme' });
    expect((await session.call('click', { account: 'Acme', ref: old })).text).toBe(`Unknown ref ${old}; call get_elements first.`);
  });
});

describe('type', () => {
  test('clicks the field, checks it has focus, then inserts the text; the account is shown', async () => {
    const { session, pages, shown } = setup();
    const [field] = refs((await session.call('get_elements', { account: 'WhatsApp' })).text);
    const r = await session.call('type', { account: 'WhatsApp', ref: field, text: 'on my way' });
    expect(r.isError).toBeFalsy();
    expect(pages.get('w|main')!.clicks).toEqual([[10, 20]]);
    expect(pages.get('w|main')!.inserted).toEqual(['on my way']);
    expect(shown).toContain('w|main');
  });

  test('refuses an element that is not a text field', async () => {
    const { session, pages } = setup();
    const [, button] = refs((await session.call('get_elements', { account: 'WhatsApp' })).text);
    const r = await session.call('type', { account: 'WhatsApp', ref: button, text: 'x' });
    expect(r).toEqual({ text: `Ref ${button} is a button, not a text field.`, isError: true });
    expect(pages.get('w|main')!.clicks).toHaveLength(0);
  });

  test('if the field did not get focus, nothing is typed', async () => {
    const { session, pages } = setup();
    const [field] = refs((await session.call('get_elements', { account: 'WhatsApp' })).text);
    pages.get('w|main')!.focused = false;
    const r = await session.call('type', { account: 'WhatsApp', ref: field, text: 'x' });
    expect(r.text).toBe('The text field did not take the focus; nothing was typed.');
    expect(pages.get('w|main')!.inserted).toEqual([]);
  });
});

describe('stopping really stops', () => {
  test('Stop while the page is loading: the click never happens', async () => {
    const env = setup();
    const [ref] = refs((await env.session.call('get_elements', { account: 'Acme' })).text);
    env.consent.grant('t');
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const original = env.hostPage;
    env.setPage(async (id, kind) => {
      await gate;
      return original(id, kind);
    });
    const p = env.session.call('click', { account: 'Acme', ref });
    env.consent.revoke('t'); // the user pressed Stop
    release();
    expect(await p).toEqual({ text: 'Claude was stopped in Acme.', isError: true });
    expect(env.pages.get('t|main')!.clicks).toHaveLength(0);
  });

  test('access lowered to Read while the page loads: the input is refused', async () => {
    const env = setup();
    const [ref] = refs((await env.session.call('get_elements', { account: 'Acme' })).text);
    env.consent.grant('t');
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const original = env.hostPage;
    env.setPage(async (id, kind) => {
      await gate;
      return original(id, kind);
    });
    const p = env.session.call('click', { account: 'Acme', ref });
    env.accounts[0].claudeAccess = 'read';
    release();
    expect((await p).text).toMatch(/Claude access for Acme is 'read'/);
    expect(env.pages.get('t|main')!.clicks).toHaveLength(0);
  });

  test('a cancelled call does nothing, even if consent arrives later', async () => {
    let answer!: (v: boolean) => void;
    const pending = new Promise<boolean>((r) => (answer = r));
    const { session, pages, consentSignals } = setup({ consent: pending });
    const [ref] = refs((await session.call('get_elements', { account: 'Acme' })).text);
    const abort = new AbortController();
    const p = session.call('click', { account: 'Acme', ref }, abort.signal);
    await Promise.resolve();
    abort.abort();
    answer(true);
    expect(await p).toEqual({ text: 'Cancelled.', isError: true });
    expect(pages.get('t|main')!.clicks).toHaveLength(0);
    expect(consentSignals[0]).toBeInstanceOf(AbortSignal);
  });
});

test('press sends the key with modifiers', async () => {
  const { session, pages } = setup();
  await session.call('press', { account: 'Acme', key: 'Enter', modifiers: ['cmd'] });
  expect(pages.get('t|main')!.keys).toEqual([['Enter', ['cmd']]]);
});

test('a view that fails to load gives an error naming the account', async () => {
  const { session } = setup({ pageError: new Error('Timed out loading the page') });
  const r = await session.call('read_page', { account: 'Globex' });
  expect(r.isError).toBe(true);
  expect(r.text).toContain('Globex');
  expect(r.text).toContain('Timed out');
});

test('unknown tab is an error', async () => {
  const { session } = setup();
  const r = await session.call('read_page', { account: 'Globex', tab: 'drive' });
  expect(r).toEqual({ text: "Unknown tab 'drive' for Globex. Open tabs: mail, calendar.", isError: true });
});

test('open_url refuses other sites and opens service pages', async () => {
  const { session } = setup();
  expect((await session.call('open_url', { account: 'Globex', url: 'https://evil.example' })).isError).toBe(true);
  expect((await session.call('open_url', { account: 'Globex', url: 'https://docs.google.com/document/d/x/edit' })).text).toBe('Opened in Globex (tab extra:1).');
  expect((await session.call('open_url', { account: 'Globex', url: 'https://mail.google.com/mail/u/0/#search/invoice' })).text).toBe('Opened in Globex (tab mail).');
});

test('open_url never opens Google pages that could carry data out', async () => {
  const { session } = setup();
  for (const url of [
    'https://docs.google.com/forms/d/e/abc/formResponse?entry.1=secret&submit=Submit',
    'https://docs.google.com/forms/d/e/abc/viewform',
    'https://sites.google.com/view/attacker',
    'https://translate.google.com/translate?u=https://evil.example',
    'https://www.google.com/url?q=https://evil.example',
    'https://script.google.com/macros/s/x/exec',
  ]) expect((await session.call('open_url', { account: 'Acme', url })).isError).toBe(true);
});

test('a link with parameters counts as acting: refused with Read only, asks consent with Read & act', async () => {
  const env = setup();
  const r = await env.session.call('open_url', { account: 'Globex', url: 'https://drive.google.com/drive/search?q=secret' });
  expect(r.isError).toBe(true);
  expect(r.text).toMatch(/counts as acting/);
  expect(env.consentCalls()).toBe(0);
  expect((await env.session.call('open_url', { account: 'Acme', url: 'https://drive.google.com/drive/search?q=report' })).text).toBe('Opened in Acme (tab drive).');
  expect(env.consentCalls()).toBe(1);
  const declined = setup({ consent: false });
  expect((await declined.session.call('open_url', { account: 'Acme', url: 'https://drive.google.com/drive/search?q=x' })).isError).toBe(true);
});

test('screenshot returns a png without switching what the user sees', async () => {
  const { session, shown } = setup();
  const r = await session.call('screenshot', { account: 'Globex' });
  expect(r.png?.toString()).toBe('png');
  expect(shown).toEqual([]);
});

test('every call is logged, successes and failures', async () => {
  const { session, logs } = setup();
  await session.call('list_accounts', {});
  await session.call('read_page', { account: 'Nope' });
  expect(logs).toHaveLength(2);
  expect(JSON.parse(logs[0])).toMatchObject({ tool: 'list_accounts', ok: true });
  expect(JSON.parse(logs[1])).toMatchObject({ tool: 'read_page', account: 'Nope', ok: false });
});

describe('assistant sessions never send', () => {
  test('a Send button is refused; other buttons and typing work', async () => {
    const env = setup();
    const s = env.control.session({ neverSend: true });
    const [textbox, send] = refs((await s.call('get_elements', { account: 'Acme' })).text);
    const r = await s.call('click', { account: 'Acme', ref: send });
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/won't send/i);
    expect((await s.call('type', { account: 'Acme', ref: textbox, text: 'draft' })).isError).toBeFalsy();
  });
  test('cmd+Enter and Enter are refused; other keys work', async () => {
    const env = setup();
    const s = env.control.session({ neverSend: true });
    expect((await s.call('press', { account: 'Acme', key: 'Enter', modifiers: ['cmd'] })).isError).toBe(true);
    expect((await s.call('press', { account: 'Acme', key: 'Enter' })).isError).toBe(true);
    expect((await s.call('press', { account: 'Acme', key: 'Escape' })).isError).toBeFalsy();
  });
  test('Send in other languages, Schedule send and unnamed buttons are refused too', async () => {
    for (const name of ['Senden (⌘Enter)', 'Envoyer', 'Invia', 'Verzenden', 'Wyślij', 'Schedule send', 'Enviar ahora', '送信', 'Send ‪(⌘Enter)‬', '']) {
      const env = setup();
      env.pages.clear();
      const s = env.control.session({ neverSend: true });
      const page = await env.hostPage('t', 'main');
      page.elements = [{ ref: 1, role: 'button', name }];
      const [btn] = refs((await s.call('get_elements', { account: 'Acme' })).text);
      const r = await s.call('click', { account: 'Acme', ref: btn });
      expect(r.isError, name).toBe(true);
      expect(page.clicks, name).toEqual([]);
    }
  });
  test('ordinary buttons still work (words that only contain "send" are not Send)', async () => {
    for (const name of ['Archive', 'Reply', 'Sender details', 'Resend code later', 'Postpone']) {
      const env = setup();
      const s = env.control.session({ neverSend: true });
      const page = await env.hostPage('t', 'main');
      page.elements = [{ ref: 1, role: 'button', name }];
      const [btn] = refs((await s.call('get_elements', { account: 'Acme' })).text);
      expect((await s.call('click', { account: 'Acme', ref: btn })).isError, name).toBeFalsy();
    }
  });
  test('Space presses a focused button: only allowed in a text field', async () => {
    const env = setup();
    const s = env.control.session({ neverSend: true });
    const page = await env.hostPage('t', 'main');
    page.takesText = false; // Tab moved the focus to Send
    expect((await s.call('press', { account: 'Acme', key: 'Space' })).isError).toBe(true);
    expect(page.keys).toEqual([]);
    page.takesText = true;
    expect((await s.call('press', { account: 'Acme', key: 'Space' })).isError).toBeFalsy();
    expect((await s.call('press', { account: 'Acme', key: 'Tab' })).isError).toBeFalsy();
  });
  test('external Claude connections keep the old behaviour', async () => {
    const env = setup();
    const [, send] = refs((await env.session.call('get_elements', { account: 'Acme' })).text);
    expect((await env.session.call('click', { account: 'Acme', ref: send })).isError).toBeFalsy();
  });
});

describe("a space's assistant sees only that space's accounts", () => {
  test('other accounts are not listed and cannot be read or used', async () => {
    const env = setup();
    const only = env.accounts[0].id;
    const s = env.control.session({ neverSend: true, only: (a) => a.id === only });
    const list = (await s.call('list_accounts', {})).text;
    expect(list).toContain(env.accounts[0].name);
    for (const other of env.accounts.slice(1)) {
      expect(list).not.toContain(`id=${other.id}`);
      const r = await s.call('read_page', { account: other.name });
      expect(r.isError).toBe(true);
    }
  });
});
