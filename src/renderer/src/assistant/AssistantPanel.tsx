import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantEvent, type AssistantModel, COMMANDS, effortLabel } from '../../../shared/assistant';
import type { UiSnapshot } from '../../../shared/ipc';
import { applyEvent, type ChatMessage, type ToolStep } from '../../../shared/assistant-history';
import { intlLocale, rich, t } from '../i18n';
import { type Block, parseMarkdown, type Span } from './markdown';

type Problem = { kind: 'not-found' | 'signed-out' | 'failed'; message: string } | null;

const has = (v: unknown): boolean => v !== undefined && v !== null;
const TOOL_LABEL: Record<string, (i: Record<string, unknown>) => string> = {
  current_context: () => t('assistant.tool.currentContext'),
  list_accounts: () => t('assistant.tool.listAccounts'),
  read_page: (i) =>
    has(i.account)
      ? i.tab
        ? t('assistant.tool.readPageTab', { account: String(i.account), tab: String(i.tab) })
        : t('assistant.tool.readPage', { account: String(i.account) })
      : i.tab
        ? t('assistant.tool.readPageAnyTab', { tab: String(i.tab) })
        : t('assistant.tool.readPageAny'),
  get_elements: (i) => (has(i.account) ? t('assistant.tool.getElements', { account: String(i.account) }) : t('assistant.tool.getElementsAny')),
  screenshot: (i) => (has(i.account) ? t('assistant.tool.screenshot', { account: String(i.account) }) : t('assistant.tool.screenshotAny')),
  open_url: (i) => (has(i.account) ? t('assistant.tool.openUrl', { account: String(i.account) }) : t('assistant.tool.openUrlAny')),
  click: (i) => (has(i.account) ? t('assistant.tool.click', { account: String(i.account) }) : t('assistant.tool.clickAny')),
  type: (i) => (has(i.account) ? t('assistant.tool.type', { account: String(i.account) }) : t('assistant.tool.typeAny')),
  press: (i) => (has(i.key) ? t('assistant.tool.press', { key: String(i.key) }) : t('assistant.tool.pressAny')),
  calendar_events: () => t('assistant.tool.calendarEvents'),
  find_free_time: () => t('assistant.tool.findFreeTime'),
  create_event: () => t('assistant.tool.createEvent'),
  unread_counts: () => t('assistant.tool.unreadCounts'),
};
const label = (step: ToolStep): string => (TOOL_LABEL[step.name] ?? (() => step.name.replace(/_/g, ' ')))(step.input ?? {});

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
    const piece = m.text.slice(pos, end);
    if (piece.trim()) out.push(piece);
    pos = end;
  };
  for (const step of m.tools) {
    words(Math.min(Math.max(step.at ?? 0, pos), m.text.length));
    const prev = out[out.length - 1];
    if (Array.isArray(prev)) prev.push(step);
    else out.push([step]);
  }
  words(m.text.length);
  return out;
}

const SUGGESTIONS = ['/brief', '/waiting', '/prep', '/summarize'];
const when = new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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
  const slash = /^\/([\w-]*)$/.exec(input);
  const at = /(?:^|\s)@([\w.-]*)$/.exec(input);
  // This space's skills that are on, after the built-in commands.
  const onHere = new Set(a.skillsActive[a.scope] ?? []);
  const skillCommands = a.skills.filter((s) => onHere.has(s.id)).map((s) => ({ name: s.command, hint: s.name }));
  const menu: { label: string; hint: string; apply(): void }[] = slash
    ? [...COMMANDS, ...skillCommands]
        .filter((c) => c.name.startsWith(slash[1].toLowerCase()))
        .map((c) => ({ label: `/${c.name}`, hint: c.hint, apply: () => setInput(`/${c.name} `) }))
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
    <div className="as-panel" aria-label={t('assistant.title')}>
      <header className="as-head">
        <span className="as-title">✦</span>
        {a.mode === 'space' ? (
          <select className="as-scope" title={t('assistant.panel.scopeTitle')} value={a.scope} onChange={(e) => window.missiondesk.assistantSetScope(e.target.value)}>
            {a.scopes.map((x) => (
              <option key={x.key} value={x.key}>
                {x.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="as-scope-name">{t('assistant.title')}</span>
        )}
        <button className={`as-icon${showHistory ? ' on' : ''}`} title={t('assistant.panel.history')} aria-label={t('assistant.panel.history')} onClick={() => setShowHistory((v) => !v)}>
          ⏱
        </button>
        <button
          className="as-icon"
          title={t('assistant.panel.newChat')}
          aria-label={t('assistant.panel.newChat')}
          onClick={() => {
            setShowHistory(false);
            window.missiondesk.assistantNewChat();
          }}
        >
          ＋
        </button>
        <button className="as-icon" title={t('assistant.closeShortcut')} aria-label={t('common.close')} onClick={() => window.missiondesk.toggleAssistant(false)}>
          ×
        </button>
      </header>

      {showHistory ? (
        <div className="as-history">
          <h3>{t('assistant.history.title', { scope: scopeName })}</h3>
          {a.conversations.length === 0 && <p className="as-tip">{t('assistant.history.empty')}</p>}
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
                <button className="as-icon" title={t('common.delete')} aria-label={t('assistant.history.deleteLabel', { title: c.title })} onClick={() => window.missiondesk.assistantDeleteConversation(c.id)}>
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
              <p>{rich('assistant.empty.off', { b: (s) => <strong>{s}</strong> }, { scope: scopeName })}</p>
              <button className="as-retry" onClick={() => window.missiondesk.openSettings('assistant')}>
                {t('assistant.empty.openSettings')}
              </button>
            </div>
          )}
          {a.engine !== 'off' && messages.length === 0 && (
            <div className="as-empty">
              {shared.length === 0 ? (
                <p>
                  {rich('assistant.empty.noAccount', { b: (s) => <strong>{s}</strong> }, { scope: scopeName })}{' '}
                  <button className="as-link" onClick={() => window.missiondesk.openSettings('assistant')}>
                    {t('assistant.empty.chooseInSettings')}
                  </button>
                </p>
              ) : (
                <>
                  <p>
                    {a.scope === 'all'
                      ? rich('assistant.empty.askAll', { b: (s) => <strong>{s}</strong> })
                      : rich('assistant.empty.askScope', { b: (s) => <strong>{s}</strong> }, { scope: scopeName })}
                  </p>
                  <div className="as-suggest">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} title={COMMANDS.find((c) => `/${c.name}` === s)?.hint}>
                        {s} <span>{COMMANDS.find((c) => `/${c.name}` === s)?.hint}</span>
                      </button>
                    ))}
                  </div>
                  <p className="as-tip">
                    {a.scope === 'all' || a.mode === 'all'
                      ? t('assistant.empty.seesAll')
                      : t('assistant.empty.seesScope', { scope: scopeName, accounts: shared.map((x) => x.name).join(', ') })}{' '}
                    {t('assistant.empty.tip')}
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
                      {seg.map((step) => (
                        <span key={step.id} className={`as-tool${step.done ? ' done' : ''}${step.isError ? ' err' : ''}`}>
                          {step.done ? (step.isError ? '⚠︎' : '✓') : '…'} {label(step)}
                        </span>
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          ))}
          {working && <div className="as-working">{t('assistant.working')}</div>}
          {problem && (
            <div className={`as-problem ${problem.kind}`}>
              {(problem.kind === 'signed-out' || problem.kind === 'not-found') && (
                <>
                  {rich('assistant.problem.signedOut', { b: (s) => <strong>{s}</strong>, code: (s) => <code>{s}</code> })}
                </>
              )}
              {problem.kind === 'failed' && (
                <>
                  <strong>{t('assistant.problem.failed')}</strong> <span className="as-detail">{problem.message.slice(0, 300)}</span>
                </>
              )}
              <button className="as-retry" onClick={() => lastSent.current && send(lastSent.current)}>
                {t('assistant.problem.retry')}
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
          placeholder={
            a.engine === 'off' ? t('assistant.compose.placeholderOff') : shared.length ? t('assistant.compose.placeholder') : t('assistant.compose.placeholderNoAccount')
          }
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
            <select title={t('assistant.compose.model')} value={a.model} onChange={(e) => window.missiondesk.assistantSetModel(e.target.value as AssistantModel, a.effort)}>
              {ASSISTANT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <button className="as-engine" title={t('assistant.compose.changeEngine')} onClick={() => window.missiondesk.openSettings('assistant')}>
              {a.engine === 'codex' ? `Codex${a.configs[a.scope]?.codexModel ? ` · ${a.configs[a.scope].codexModel}` : ''}` : `OpenRouter · ${(a.configs[a.scope]?.openrouterModel ?? 'auto').replace(/^openrouter\//, '')}`}
            </button>
          )}
          <select
            title={t('assistant.compose.effort')}
            value={a.effort}
            onChange={(e) =>
              a.engine === 'claude'
                ? window.missiondesk.assistantSetModel(a.model, e.target.value as AssistantEffort)
                : window.missiondesk.setAssistantScopeConfig(a.scope, { effort: e.target.value as AssistantEffort })
            }
          >
            {ASSISTANT_EFFORTS.map((ef) => (
              <option key={ef} value={ef}>
                {effortLabel(ef)}
              </option>
            ))}
          </select>
          <span className="as-model">{modelName ? modelName.replace(/^claude-/, '') : ''}</span>
          {working ? (
            <button className="as-stop" onClick={() => window.missiondesk.assistantStop()}>
              {t('assistant.stop')}
            </button>
          ) : (
            <button className="primary as-send" disabled={!input.trim() || shared.length === 0 || a.engine === 'off'} onClick={() => send(input)}>
              {t('assistant.compose.send')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
