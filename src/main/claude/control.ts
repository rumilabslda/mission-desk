import { customHomeHosts } from '../../shared/custom-site';
import { hasTabs } from '../../shared/tabs';
import type { Account, UnreadCount, ViewKind } from '../../shared/types';
import { allows, findAccount, isActTool, type ToolName } from './access';
import type { Consent } from './consent';
import { collectScript, focusScript, formatElements, type PageElement, pointScript, READ_SCRIPT } from './elements';
import { logLine } from './log';
import { resolveOpenUrl } from './open-url';

export const MAX_PAGE_TEXT = 40_000;

export interface PageHandle {
  url(): string;
  title(): string;
  evalIsolated<T>(code: string): Promise<T>;
  /** Captures the view without changing what the user is looking at. */
  capturePng(maxWidth: number): Promise<Buffer>;
  mouseClick(x: number, y: number): void;
  insertText(text: string): void;
  key(key: string, modifiers: ('cmd' | 'shift')[]): void;
}

export interface ControlHost {
  accounts(): Account[];
  tabs(accountId: string): ViewKind[];
  defaultKind(accountId: string): ViewKind;
  /** Wakes the view if needed and waits for it (≤15 s); rejects with a readable Error. */
  page(accountId: string, kind: ViewKind): Promise<PageHandle>;
  show(accountId: string, kind: ViewKind): void;
  openUrl(accountId: string, target: { kind: ViewKind | 'extra'; url: string }): Promise<ViewKind>;
  /** Asks the user; resolves false if declined, timed out or `signal` aborts. */
  askConsent(account: Account, signal?: AbortSignal): Promise<boolean>;
  log(line: string): void;
  unread?(accountId: string): UnreadCount;
}

export type ToolResult = { text?: string; png?: Buffer; isError?: boolean };

const KEYS = new Set([
  'Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Space',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End',
]);
const TEXT_ROLES = new Set(['textbox', 'searchbox', 'combobox']);

class ToolError extends Error {}
const fail = (message: string): never => {
  throw new ToolError(message);
};

const untrusted = (body: string): string => `<untrusted_page_content>\n${body}\n</untrusted_page_content>`;

// Unique across the whole app, so a ref can never match another tab, page, account or connection.
let nextSnapshotId = 1;
let nextRef = 1;

interface RefEntry {
  accountId: string;
  kind: ViewKind;
  snapshotId: number;
  local: number;
  role: string;
  name: string;
}

/** Buttons that send a message or email (the assistant never presses them). */
const SEND_NAME = /^\s*(send|enviar|submit|post|publish|publicar)\b|\bsend (now|message|email|reply)\b/i;

/**
 * Tool semantics: who may do what, consent, element refs. No Electron here.
 * One `session()` per MCP connection; consent is shared by all of them.
 */
export function createControlService(host: ControlHost, consent: Consent) {
  const pendingConsent = new Map<string, Promise<boolean>>();

  const tabName = (a: Account, kind: ViewKind): string => (hasTabs(a.service) && a.service !== 'custom' && kind === 'main' ? 'mail' : kind);

  function resolveKind(a: Account, tab: unknown): ViewKind | null {
    if (tab === undefined || tab === null || tab === '') return null;
    const tabs = host.tabs(a.id);
    const wanted = tab === 'mail' ? 'main' : String(tab);
    const match = tabs.find((k) => k === wanted);
    if (!match) fail(`Unknown tab '${String(tab)}' for ${a.name}. Open tabs: ${tabs.map((k) => tabName(a, k)).join(', ')}.`);
    return match as ViewKind;
  }

  const accessError = (a: Account): string =>
    `Claude access for ${a.name} is '${a.claudeAccess ?? 'off'}'. To allow this, set it to 'Read & act' in Mission Desk (right-click the account).`;

  /** Re-checked right before every input: Stop, a lowered access or a cancel all win. */
  function checkpoint(accountId: string, tool: ToolName, signal?: AbortSignal): Account {
    if (signal?.aborted) fail('Cancelled.');
    const fresh = host.accounts().find((x) => x.id === accountId);
    if (!fresh || (fresh.claudeAccess ?? 'off') === 'off') fail('The account is no longer shared with Claude.');
    if (!allows(fresh!.claudeAccess, tool)) fail(accessError(fresh!));
    if (isActTool(tool) && !consent.has(accountId)) fail(`Claude was stopped in ${fresh!.name}.`);
    return fresh!;
  }

  async function ensureConsent(a: Account, signal?: AbortSignal): Promise<void> {
    if (!consent.has(a.id)) {
      let pending = pendingConsent.get(a.id);
      if (!pending) {
        pending = host
          .askConsent(a, signal)
          .then((ok) => {
            if (ok && !signal?.aborted) consent.grant(a.id);
            return ok;
          })
          .catch(() => false)
          .finally(() => pendingConsent.delete(a.id));
        pendingConsent.set(a.id, pending);
      }
      const ok = await pending;
      if (signal?.aborted) fail('Cancelled.');
      if (!ok) fail(`The user declined Claude acting in ${a.name}.`);
    }
    if (signal?.aborted) fail('Cancelled.');
  }

  async function pageFor(a: Account, kind: ViewKind): Promise<PageHandle> {
    try {
      return await host.page(a.id, kind);
    } catch (e) {
      return fail(`Could not load ${a.name}: ${(e as Error).message}`);
    }
  }

  /**
   * `neverSend`: refuse anything that sends (Send buttons, Enter, cmd+Enter); for the in-app assistant.
   * `only`: the accounts this session may see at all (a space's assistant sees only its space).
   */
  function session(opts: { neverSend?: boolean; only?: (a: Account) => boolean } = {}) {
    const visible = (): Account[] => host.accounts().filter((a) => !opts.only || opts.only(a));
    /** The global checks, plus: the account is still in this session's space (it may have moved). */
    const cp = (accountId: string, tool: ToolName, signal?: AbortSignal): Account => {
      const a = checkpoint(accountId, tool, signal);
      if (opts.only && !opts.only(a)) fail("That account is no longer in this assistant's space.");
      return a;
    };
    const NO_SEND = "The assistant won't send messages or emails: the draft is ready, and the user presses Send themselves.";
    const refs = new Map<number, RefEntry>();
    const latest = new Map<string, number>(); // view → its latest snapshot id

    function lookupRef(a: Account, ref: unknown, tab: unknown): RefEntry {
      if (!Number.isInteger(ref)) fail('ref must be a number from get_elements.');
      const entry = refs.get(ref as number);
      if (!entry) return fail(`Unknown ref ${String(ref)}; call get_elements first.`);
      if (entry.accountId !== a.id) fail(`Ref ${String(ref)} belongs to another account.`);
      const asked = resolveKind(a, tab);
      if (asked && asked !== entry.kind) {
        fail(`Ref ${String(ref)} belongs to the ${tabName(a, entry.kind)} tab, not ${tabName(a, asked)}.`);
      }
      return entry;
    }

    async function pointAt(page: PageHandle, entry: RefEntry): Promise<{ x: number; y: number }> {
      const point = await page.evalIsolated<{ x: number; y: number } | { error: string }>(pointScript(entry.snapshotId, entry.local));
      if (!point || 'error' in point) {
        fail(
          point && 'error' in point && point.error === 'obscured'
            ? 'Something else is on top of that element or it moved; call get_elements again.'
            : 'The page changed; call get_elements again.',
        );
      }
      return point as { x: number; y: number };
    }

    async function run(tool: ToolName, args: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult> {
      if (signal?.aborted) fail('Cancelled.');
      if (tool === 'list_accounts') {
        const lines = visible()
          .filter((a) => (a.claudeAccess ?? 'off') !== 'off')
          .map(
            (a) =>
              `${a.name} (${a.service}, access: ${a.claudeAccess}, unread: ${host.unread?.(a.id) ?? 0}, tabs: ${host
                .tabs(a.id)
                .map((k) => tabName(a, k))
                .join(', ')}) id=${a.id}`,
          );
        return {
          text: lines.length ? lines.join('\n') : 'No accounts are shared with Claude. In Mission Desk: right-click an account → Claude access.',
        };
      }

      const found = findAccount(visible(), String(args.account ?? ''));
      if ('error' in found) return fail(found.error);
      const a = found.account;
      if (!allows(a.claudeAccess, tool)) fail(accessError(a));

      if (tool === 'open_url') {
        const target = resolveOpenUrl(a.service, String(args.url ?? ''), a.service === 'custom' ? customHomeHosts(a.url, a.siteMoves) : []);
        if ('error' in target) return fail(target.error);
        const kind = await host.openUrl(a.id, target);
        return { text: `Opened in ${a.name} (tab ${tabName(a, kind)}).` };
      }

      // Acting tools: which view is decided by the ref (never by what the user happens to look at).
      if (tool === 'click' || tool === 'type') {
        const entry = lookupRef(a, args.ref, args.tab);
        if (opts.neverSend && tool === 'click' && SEND_NAME.test(entry.name)) fail(NO_SEND);
        if (tool === 'type') {
          if (typeof args.text !== 'string') fail('text must be a string.');
          if (!TEXT_ROLES.has(entry.role)) fail(`Ref ${String(args.ref)} is a ${entry.role}, not a text field.`);
        }
        await ensureConsent(a, signal);
        host.show(a.id, entry.kind);
        const page = await pageFor(a, entry.kind);
        cp(a.id, tool, signal);
        const p = await pointAt(page, entry);
        cp(a.id, tool, signal);
        page.mouseClick(p.x, p.y);
        if (tool === 'click') return { text: `Clicked [${String(args.ref)}] in ${a.name}.` };
        const focused = await page.evalIsolated<boolean>(focusScript(entry.snapshotId, entry.local));
        if (!focused) fail('The text field did not take the focus; nothing was typed.');
        cp(a.id, tool, signal);
        page.insertText(args.text as string);
        return { text: `Typed ${(args.text as string).length} characters into [${String(args.ref)}] in ${a.name}.` };
      }

      const kind = resolveKind(a, args.tab) ?? host.defaultKind(a.id);

      if (tool === 'press') {
        const key = String(args.key ?? '');
        if (!KEYS.has(key)) fail(`Unsupported key '${key}'. Use one of: ${[...KEYS].join(', ')}.`);
        const mods = Array.isArray(args.modifiers) ? args.modifiers : [];
        if (!mods.every((m) => m === 'cmd' || m === 'shift')) fail("modifiers may only contain 'cmd' and 'shift'.");
        if (opts.neverSend && key === 'Enter') fail(NO_SEND); // Enter sends in Slack/WhatsApp; cmd+Enter in Gmail
        await ensureConsent(a, signal);
        host.show(a.id, kind);
        const page = await pageFor(a, kind);
        cp(a.id, tool, signal);
        page.key(key, mods as ('cmd' | 'shift')[]);
        return { text: `Pressed ${[...mods, key].join('+')} in ${a.name}.` };
      }

      const page = await pageFor(a, kind);
      cp(a.id, tool, signal);
      switch (tool) {
        case 'read_page': {
          const text = await page.evalIsolated<string>(READ_SCRIPT);
          return { text: `URL: ${page.url()}\nTitle: ${page.title()}\n${untrusted(String(text ?? '').slice(0, MAX_PAGE_TEXT))}` };
        }
        case 'get_elements': {
          const snapshotId = nextSnapshotId++;
          const local = await page.evalIsolated<PageElement[]>(collectScript(snapshotId));
          const viewKey = `${a.id}|${kind}`;
          const previous = latest.get(viewKey);
          if (previous !== undefined) for (const [r, e] of refs) if (e.snapshotId === previous) refs.delete(r);
          latest.set(viewKey, snapshotId);
          const listed = (local ?? []).map((el) => {
            const ref = nextRef++;
            refs.set(ref, { accountId: a.id, kind, snapshotId, local: el.ref, role: el.role, name: el.name ?? '' });
            return { ...el, ref };
          });
          return { text: untrusted(formatElements(listed)) };
        }
        case 'screenshot':
          return { png: await page.capturePng(1280) };
      }
      return fail(`Unknown tool ${tool}.`);
    }

    return {
      async call(tool: ToolName, args: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult> {
        const account = typeof args.account === 'string' ? args.account : undefined;
        try {
          const result = await run(tool, args, signal);
          host.log(logLine({ tool, account, ok: true }, Date.now()));
          return result;
        } catch (e) {
          const message = e instanceof ToolError ? e.message : `Unexpected error: ${(e as Error).message}`;
          host.log(logLine({ tool, account, ok: false, error: message }, Date.now()));
          return { text: message, isError: true };
        }
      },
    };
  }

  return { session };
}
export type ControlSession = ReturnType<ReturnType<typeof createControlService>['session']>;
