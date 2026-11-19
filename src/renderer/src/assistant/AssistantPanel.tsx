import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantEvent, type AssistantModel, COMMANDS } from '../../../shared/assistant';
import type { UiSnapshot } from '../../../shared/ipc';
import { applyEvent, type ChatMessage, type ToolStep } from '../../../shared/assistant-history';
import { type Block, parseMarkdown, type Span } from './markdown';

type Problem = { kind: 'not-found' | 'signed-out' | 'failed'; message: string } | null;

const TOOL_LABEL: Record<string, (i: Record<string, unknown>) => string> = {
  current_context: () => 'Looking at your screen',
  list_accounts: () => 'Listing accounts',
  read_page: (i) => `Reading ${i.account ?? 'a page'}${i.tab ? ` · ${i.tab}` : ''}`,
  get_elements: (i) => `Looking at ${i.account ?? 'the page'}`,
  screenshot: (i) => `Screenshot of ${i.account ?? 'the page'}`,
  open_url: (i) => `Opening a page in ${i.account ?? 'an account'}`,
  click: (i) => `Clicking in ${i.account ?? 'an account'}`,
  type: (i) => `Typing in ${i.account ?? 'an account'}`,
  press: (i) => `Pressing ${i.key ?? 'a key'}`,
  calendar_events: () => 'Checking calendars',
  find_free_time: () => 'Finding free time',
  create_event: () => 'Waiting for your OK to create the event',
  unread_counts: () => 'Counting unread',
};
const label = (t: ToolStep): string => (TOOL_LABEL[t.name] ?? (() => t.name.replace(/_/g, ' ')))(t.input ?? {});

function Spans({ spans }: { spans: Span[] }): React.JSX.Element {
  return (
    <>
      {spans.map((s, i) =>
        s.type === 'bold' ? (
          <strong key={i}>{s.text}</strong>
        ) : s.type === 'code' ? (
          <code key={i}>{s.text}</code>
        ) : s.type === 'link' ? (
          <a
            key={i}
            href={s.href}
            onClick={(e) => {
              e.preventDefault();
              window.missiondesk.openExternal(s.href);
            }}
          >
            {s.text}
          </a>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function Markdown({ text }: { text: string }): React.JSX.Element {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <>
      {blocks.map((b: Block, i) =>
        b.type === 'heading' ? (
          <div key={i} className={`as-h as-h${b.level}`}>
            <Spans spans={b.spans} />
          </div>
        ) : b.type === 'list' ? (
          b.ordered ? (
            <ol key={i}>
              {b.items.map((it, j) => (
                <li key={j}>
                  <Spans spans={it} />
                </li>
              ))}
            </ol>
          ) : (
            <ul key={i}>
              {b.items.map((it, j) => (
                <li key={j}>
                  <Spans spans={it} />
                </li>
              ))}
            </ul>
          )
        ) : b.type === 'code' ? (
          <pre key={i}>{b.text}</pre>
        ) : b.type === 'table' ? (
          <div key={i} className="as-table">
            <table>
              <thead>
                <tr>
                  {b.header.map((c, j) => (
                    <th key={j}>
                      <Spans spans={c} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>
                        <Spans spans={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p key={i}>
            <Spans spans={b.spans} />
          </p>
        ),
      )}
    </>
  );
}

/** An answer in the order it happened: its words, with each run of tool steps where it ran. */
function segments(m: ChatMessage): (string | ToolStep[])[] {
  const out: (string | ToolStep[])[] = [];
  let pos = 0;
  const words = (end: number): void => {
    const t = m.text.slice(pos, end);
    if (t.trim()) out.push(t);
    pos = end;
  };
  for (const t of m.tools) {
    words(Math.min(Math.max(t.at ?? 0, pos), m.text.length));
    const prev = out[out.length - 1];
    if (Array.isArray(prev)) prev.push(t);
    else out.push([t]);
  }
  words(m.text.length);
  return out;
}

const SUGGESTIONS = ['/brief', '/waiting', '/prep', '/summarize'];
const when = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** The assistant: the user's own Claude Code working across the accounts of a space. */
export function AssistantPanel({
  snapshot,
  onNeedsSetup,
  pendingAsk,
  onAskTaken,
}: {
  snapshot: UiSnapshot;
  onNeedsSetup(): void;
  pendingAsk: string | null;
  onAskTaken(): void;
}): React.JSX.Element {
  const a = snapshot.assistant;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [modelName, setModelName] = useState('');
  const [input, setInput] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSent = useRef('');
  const convId = useRef<string | null>(null); // the conversation these messages belong to
  const sending = useRef(false);
  const onNeedsSetupRef = useRef(onNeedsSetup);
  onNeedsSetupRef.current = onNeedsSetup;

  const scopeName = a.scopes.find((x) => x.key === a.scope)?.name ?? '';
  const shared = snapshot.accounts.filter(
    (x) => (x.claudeAccess ?? 'off') !== 'off' && (a.scope === 'all' || (a.scope === 'nospace' ? !x.spaceId : a.scope === `space:${x.spaceId}`)),
  );

  // The conversation on screen changed (another space, the history, New chat): load it.
  useEffect(() => {
    const id = a.conversationId;
    if (id === convId.current) return;
    const creating = sending.current && convId.current === null; // our message just created this conversation
    convId.current = id;
    if (creating) return; // its messages are already here
    setProblem(null);
    if (!id) {
      setMessages([]);
      setWorking(false);
      return;
    }
    void window.missiondesk.assistantConversation(id).then((c) => {
      if (!c || convId.current !== id) return;
      setMessages(c.messages);
      setWorking(c.working);
    });
  }, [a.conversationId]);

  // Streamed events of the conversation on screen.
  useEffect(
    () =>
      window.missiondesk.onAssistantEvent(({ conversationId, event: e }: { conversationId: string; event: AssistantEvent }) => {
        if (conversationId !== convId.current) return; // another space's answer, saved in its history
        if (e.type === 'init') return setModelName(e.model);
        if (e.type === 'error') {
          setWorking(false);
          setProblem({ kind: e.kind, message: e.message });
          // Check Claude Code again: if it is signed out or gone, the setup steps come back.
          if (e.kind === 'not-found' || e.kind === 'signed-out') onNeedsSetupRef.current();
          return;
        }
        if (e.type === 'done') return setWorking(false);
        setMessages((ms) => applyEvent(ms, e));
      }),
    [],
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, working]);

  useEffect(() => {
    if (a.open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [a.open]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || working) return;
      lastSent.current = text;
      setProblem(null);
      setShowHistory(false);
      setMessages((ms) => [...ms, { role: 'user', text, tools: [] }]);
      setWorking(true);
      setInput('');
      sending.current = true;
      void window.missiondesk
        .assistantSend(text, { scope: a.scope, conversationId: convId.current })
        .then((id) => {
          if (id && convId.current === null) convId.current = id; // unless the user moved on meanwhile
        })
        .finally(() => (sending.current = false));
    },
    [working, a.scope],
  );

  // A request from Home ("Brief me"), held by the window until the chat could take it.
  useEffect(() => {
    if (pendingAsk && !working) {
      send(pendingAsk);
      onAskTaken();
    }
  }, [pendingAsk, working, send, onAskTaken]);

  // "/" and "@" menus
  const slash = /^\/(\w*)$/.exec(input);
  const at = /(?:^|\s)@([\w.-]*)$/.exec(input);
  const menu: { label: string; hint: string; apply(): void }[] = slash
    ? COMMANDS.filter((c) => c.name.startsWith(slash[1].toLowerCase())).map((c) => ({ label: `/${c.name}`, hint: c.hint, apply: () => setInput(`/${c.name} `) }))
    : at
      ? shared
          .filter((x) => x.name.toLowerCase().startsWith(at[1].toLowerCase()))
          .map((x) => ({ label: `@${x.name}`, hint: x.service, apply: () => setInput(input.replace(/@[\w.-]*$/, `@${x.name} `)) }))
      : [];
  const menuOpen = menu.length > 0;

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (menuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setMenuIndex((i) => (i + (e.key === 'ArrowDown' ? 1 : menu.length - 1)) % menu.length);
      return;
    }
    if (menuOpen && (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey))) {
      e.preventDefault();
      menu[Math.min(menuIndex, menu.length - 1)].apply();
      setMenuIndex(0);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (working) window.missiondesk.assistantStop();
      else window.missiondesk.toggleAssistant(false);
    }
  }

  return (
    <div className="as-panel" aria-label="Assistant">
      <header className="as-head">
        <span className="as-title">✦</span>
        {a.mode === 'space' ? (
          <select className="as-scope" title="Which space this assistant works for" value={a.scope} onChange={(e) => window.missiondesk.assistantSetScope(e.target.value)}>
            {a.scopes.map((x) => (
              <option key={x.key} value={x.key}>
                {x.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="as-scope-name">Assistant</span>
        )}
        <button className={`as-icon${showHistory ? ' on' : ''}`} title="History" aria-label="History" onClick={() => setShowHistory((v) => !v)}>
          ⏱
        </button>
        <button
          className="as-icon"
          title="New chat"
          aria-label="New chat"
          onClick={() => {
            setShowHistory(false);
            window.missiondesk.assistantNewChat();
          }}
        >
          ＋
        </button>
        <button className="as-icon" title="Close (⌘J)" aria-label="Close" onClick={() => window.missiondesk.toggleAssistant(false)}>
          ×
        </button>
      </header>

      {showHistory ? (
        <div className="as-history">
          <h3>{scopeName} · history</h3>
          {a.conversations.length === 0 && <p className="as-tip">No conversations yet.</p>}
          <ul>
            {a.conversations.map((c) => (
              <li key={c.id} className={c.id === a.conversationId ? 'on' : ''}>
                <button
                  className="as-history-open"
                  onClick={() => {
                    window.missiondesk.assistantOpenConversation(c.id);
                    setShowHistory(false);
                  }}
                >
                  <span>{c.title}</span>
                  <small>{when.format(new Date(c.updatedAt))}</small>
                </button>
                <button className="as-icon" title="Delete" aria-label={`Delete ${c.title}`} onClick={() => window.missiondesk.assistantDeleteConversation(c.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="as-list" ref={listRef}>
          {a.engine === 'off' && (
            <div className="as-empty">
              <p>
                The assistant is off for <strong>{scopeName}</strong>.
              </p>
              <button className="as-retry" onClick={() => window.missiondesk.openSettings('assistant')}>
                Open Settings → Assistant
              </button>
            </div>
          )}
          {a.engine !== 'off' && messages.length === 0 && (
            <div className="as-empty">
              {shared.length === 0 ? (
                <p>
                  No account in <strong>{scopeName}</strong> is turned on for the assistant yet.{' '}
                  <button className="as-link" onClick={() => window.missiondesk.openSettings('assistant')}>
                    Choose in Settings → Assistant
                  </button>
                </p>
              ) : (
                <>
                  <p>
                    Ask anything about <strong>{a.scope === 'all' ? 'all your accounts' : scopeName}</strong>, or start with:
                  </p>
                  <div className="as-suggest">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} title={COMMANDS.find((c) => `/${c.name}` === s)?.hint}>
                        {s} <span>{COMMANDS.find((c) => `/${c.name}` === s)?.hint}</span>
                      </button>
                    ))}
                  </div>
                  <p className="as-tip">
                    {a.scope === 'all' || a.mode === 'all' ? 'It sees every shared account.' : `It sees only ${scopeName}'s accounts: ${shared.map((x) => x.name).join(', ')}.`} Type / for
                    commands, @ for an account. Nothing is sent for you.
                  </p>
                </>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`as-msg ${m.role}`}>
              {m.role === 'user' ? (
                <p>{m.text}</p>
              ) : (
                segments(m).map((seg, j) =>
                  typeof seg === 'string' ? (
                    <Markdown key={j} text={seg} />
                  ) : (
                    <div key={j} className="as-tools">
                      {seg.map((t) => (
                        <span key={t.id} className={`as-tool${t.done ? ' done' : ''}${t.isError ? ' err' : ''}`}>
                          {t.done ? (t.isError ? '⚠︎' : '✓') : '…'} {label(t)}
                        </span>
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          ))}
          {working && <div className="as-working">Working…</div>}
          {problem && (
            <div className={`as-problem ${problem.kind}`}>
              {(problem.kind === 'signed-out' || problem.kind === 'not-found') && (
                <>
                  <strong>Claude Code can’t answer: it needs you to sign in again.</strong> Open Terminal and run <code>claude auth login</code>, then try again.
                </>
              )}
              {problem.kind === 'failed' && (
                <>
                  <strong>Something went wrong.</strong> <span className="as-detail">{problem.message.slice(0, 300)}</span>
                </>
              )}
              <button className="as-retry" onClick={() => lastSent.current && send(lastSent.current)}>
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      <div className="as-compose">
        {menuOpen && (
          <div className="as-menu" role="listbox">
            {menu.map((it, i) => (
              <button key={it.label} className={i === Math.min(menuIndex, menu.length - 1) ? 'on' : ''} onMouseDown={(e) => (e.preventDefault(), it.apply())}>
                <strong>{it.label}</strong> <span>{it.hint}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          rows={Math.min(8, Math.max(2, input.split('\n').length))}
          placeholder={a.engine === 'off' ? 'The assistant is off for this space' : shared.length ? 'Ask, or type / for commands…' : 'Turn on an account first (Settings → Assistant)'}
          value={input}
          disabled={shared.length === 0 || a.engine === 'off'}
          onChange={(e) => {
            setInput(e.target.value);
            setMenuIndex(0);
          }}
          onKeyDown={onKey}
        />
        <div className="as-actions">
          {a.engine === 'claude' ? (
            <select title="Model" value={a.model} onChange={(e) => window.missiondesk.assistantSetModel(e.target.value as AssistantModel, a.effort)}>
              {ASSISTANT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <button className="as-engine" title="Change in Settings → Assistant" onClick={() => window.missiondesk.openSettings('assistant')}>
              {a.engine === 'codex' ? `Codex${a.configs[a.scope]?.codexModel ? ` · ${a.configs[a.scope].codexModel}` : ''}` : `OpenRouter · ${(a.configs[a.scope]?.openrouterModel ?? 'auto').replace(/^openrouter\//, '')}`}
            </button>
          )}
          <select
            title="Effort (how hard it thinks)"
            value={a.effort}
            onChange={(e) =>
              a.engine === 'claude'
                ? window.missiondesk.assistantSetModel(a.model, e.target.value as AssistantEffort)
                : window.missiondesk.setAssistantScopeConfig(a.scope, { effort: e.target.value as AssistantEffort })
            }
          >
            {ASSISTANT_EFFORTS.map((ef) => (
              <option key={ef} value={ef}>
                {ef}
              </option>
            ))}
          </select>
          <span className="as-model">{modelName ? modelName.replace(/^claude-/, '') : ''}</span>
          {working ? (
            <button className="as-stop" onClick={() => window.missiondesk.assistantStop()}>
              Stop
            </button>
          ) : (
            <button className="primary as-send" disabled={!input.trim() || shared.length === 0 || a.engine === 'off'} onClick={() => send(input)}>
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
