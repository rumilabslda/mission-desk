import { useEffect, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantModel, type ClaudeStatus } from '../../../shared/assistant';
import { type AssistantEngine, ENGINES } from '../../../shared/assistant-engines';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import type { Account } from '../../../shared/types';
import type { MemoryNote } from '../../../shared/assistant';
import { ClaudeConnectPanel } from '../ConnectClaudeDialog';
import { type MessageKey, rich, t } from '../i18n';

const ACCESS: { value: NonNullable<Account['claudeAccess']>; label: MessageKey }[] = [
  { value: 'off', label: 'common.off' },
  { value: 'read', label: 'settings.assistant.accessRead' },
  { value: 'act', label: 'settings.assistant.accessAct' },
];

const EFFORT_LABEL: Record<AssistantEffort, MessageKey> = {
  low: 'settings.assistant.effortLow',
  medium: 'settings.assistant.effortMedium',
  high: 'settings.assistant.effortHigh',
  xhigh: 'settings.assistant.effortXhigh',
  max: 'settings.assistant.effortMax',
};

/** The accounts a scope's card lists ('all' lists none: it uses every account turned on in the spaces). */
function accountsOf(snap: UiSnapshot, scope: string): AccountView[] {
  if (scope === 'nospace') return snap.accounts.filter((a) => !a.spaceId);
  if (scope.startsWith('space:')) return snap.accounts.filter((a) => a.spaceId === scope.slice(6));
  if (snap.assistant.mode === 'all') return snap.accounts;
  return [];
}

type Ready = Partial<Record<AssistantEngine, boolean>>;

/** One scope's notes: only its own assistant sees them. Click a note to change it. */
function MemoryList({ scope, notes, isAll }: { scope: string; notes: MemoryNote[]; isAll: boolean }): React.JSX.Element {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const add = (): void => {
    const text = draft.trim();
    if (!text) return;
    window.missiondesk.assistantMemoryAdd(scope, text);
    setDraft('');
  };
  const saveEdit = (): void => {
    if (!editing) return;
    const text = editing.text.trim();
    if (text) window.missiondesk.assistantMemoryUpdate(scope, editing.id, text);
    setEditing(null);
  };
  return (
    <div className="asg-memory">
      <div className="asg-memory-head">
        <span>{t('settings.memory.title')}</span>
        <span className="set-muted">
          {isAll ? t('settings.memory.allHint') : t('settings.memory.spaceHint')}
        </span>
      </div>
      {notes.length > 0 && (
        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              {editing?.id === n.id ? (
                <input
                  className="set-input"
                  autoFocus
                  maxLength={300}
                  value={editing.text}
                  onChange={(e) => setEditing({ id: n.id, text: e.target.value })}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                />
              ) : (
                <button className="asg-note" title={t('settings.memory.change')} onClick={() => setEditing({ id: n.id, text: n.text })}>
                  {n.text}
                </button>
              )}
              <button className="asg-note-remove" aria-label={t('settings.memory.forgetLabel', { note: n.text })} title={t('settings.memory.forget')} onClick={() => window.missiondesk.assistantMemoryRemove(scope, n.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="asg-key">
        <input
          className="set-input"
          placeholder={notes.length ? t('settings.memory.addPlaceholder') : t('settings.memory.addPlaceholderExample')}
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="set-action" disabled={!draft.trim() || notes.length >= 40} onClick={add}>
          {t('common.add')}
        </button>
      </div>
    </div>
  );
}

function ScopeCard({ snap, scope, name, ready, orModels }: { snap: UiSnapshot; scope: string; name: string; ready: Ready; orModels: { id: string; name: string }[] }): React.JSX.Element {
  const c = snap.assistant.configs[scope] ?? { engine: 'claude', model: 'default', effort: 'medium', openrouterModel: 'openrouter/auto', codexModel: '' };
  const set = (patch: Partial<{ engine: AssistantEngine; model: AssistantModel; effort: AssistantEffort; openrouterModel: string; codexModel: string }>): void =>
    window.missiondesk.setAssistantScopeConfig(scope, patch);
  const [codexModel, setCodexModel] = useState(c.codexModel);
  useEffect(() => setCodexModel(c.codexModel), [c.codexModel]);
  const accounts = accountsOf(snap, scope);
  return (
    <div className="set-card asg-card">
      <div className="asg-head">
        <strong>{name}</strong>
        <select className="set-select" value={c.engine} onChange={(e) => set({ engine: e.target.value as AssistantEngine })} title={t('settings.assistant.engineTitle')}>
          {ENGINES.map((en) => (
            <option key={en.id} value={en.id}>
              {en.name}
            </option>
          ))}
          <option value="off">{t('common.off')}</option>
        </select>
      </div>
      {c.engine !== 'off' && ready[c.engine] === false && (
        <p className="asg-error">
          {t('settings.assistant.notConnected', { name: ENGINES.find((x) => x.id === c.engine)?.name ?? c.engine })}{' '}
          <button className="set-link" onClick={() => window.missiondesk.openSettings('integrations')}>
            {t('settings.assistant.connectInIntegrations')}
          </button>
        </p>
      )}
      {c.engine !== 'off' && (
        <div className="asg-row">
          {c.engine === 'claude' && (
            <label>
              {t('settings.assistant.model')}
              <select className="set-select" value={c.model} onChange={(e) => set({ model: e.target.value as AssistantModel })}>
                {ASSISTANT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === 'default' ? t('settings.assistant.modelDefault') : m.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {c.engine === 'openrouter' && (
            <label>
              {t('settings.assistant.model')}
              <select className="set-select asg-model" value={c.openrouterModel} onChange={(e) => set({ openrouterModel: e.target.value })}>
                <option value="openrouter/auto">{t('settings.assistant.openrouterAuto')}</option>
                {!orModels.some((m) => m.id === c.openrouterModel) && c.openrouterModel !== 'openrouter/auto' && <option value={c.openrouterModel}>{c.openrouterModel}</option>}
                {orModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {c.engine === 'codex' && (
            <label>
              {t('settings.assistant.model')}
              <input
                className="set-input"
                placeholder={t('settings.assistant.codexDefault')}
                aria-invalid={codexModel !== '' && !/^[A-Za-z0-9][\w.:-]{0,59}$/.test(codexModel)}
                value={codexModel}
                maxLength={60}
                onChange={(e) => setCodexModel(e.target.value)}
                onBlur={() => {
                  const v = codexModel.trim();
                  if (v !== c.codexModel && (v === '' || /^[A-Za-z0-9][\w.:-]{0,59}$/.test(v))) set({ codexModel: v });
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              />
            </label>
          )}
          <label>
            {t('settings.assistant.effort')}
            <select className="set-select" value={c.effort} onChange={(e) => set({ effort: e.target.value as AssistantEffort })}>
              {ASSISTANT_EFFORTS.map((ef) => (
                <option key={ef} value={ef}>
                  {t(EFFORT_LABEL[ef])}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {c.engine === 'off' && <p className="set-muted">{t('settings.assistant.noAssistant')}</p>}
      {c.engine !== 'off' &&
        (scope === 'all' && snap.assistant.mode === 'space' ? (
          <p className="set-muted">{t('settings.assistant.seesSpaces')}</p>
        ) : accounts.length === 0 ? (
          <p className="set-muted">{t('settings.assistant.noAccounts')}</p>
        ) : (
          <ul className="asg-accounts">
            {accounts.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span>
                <select
                  className="set-select"
                  value={a.claudeAccess ?? 'off'}
                  onChange={(e) => window.missiondesk.updateAccount(a.id, { claudeAccess: e.target.value as Account['claudeAccess'] })}
                  title={t('settings.assistant.accessTitle')}
                >
                  {ACCESS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {t(x.label)}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        ))}
      {c.engine !== 'off' && <MemoryList scope={scope} notes={snap.assistant.memory[scope] ?? []} isAll={scope === 'all'} />}
    </div>
  );
}

/** Settings → Assistant: one per space or one for everything, and each space's assistant. */
export function AssistantSettings({ snap }: { snap: UiSnapshot }): React.JSX.Element {
  const [ready, setReady] = useState<Ready>({});
  const [orModels, setOrModels] = useState<{ id: string; name: string }[]>([]);
  const uses = (e: AssistantEngine): boolean => Object.values(snap.assistant.configs).some((c) => c.engine === e);
  useEffect(() => {
    void window.missiondesk.claudeIntegrationStatus().then((s) => setReady((r) => ({ ...r, claude: s.state === 'ready' })));
    void window.missiondesk.openRouterStatus().then((s) => setReady((r) => ({ ...r, openrouter: s.connected })));
    void window.missiondesk.codexStatus().then((s) => setReady((r) => ({ ...r, codex: s.state === 'ready' })));
  }, []);
  const needModels = uses('openrouter');
  useEffect(() => {
    if (needModels && orModels.length === 0) void window.missiondesk.openRouterModels().then(setOrModels);
  }, [needModels, orModels.length]);
  return (
    <>
      <h2>{t('settings.section.assistant')}</h2>
      <div className="set-styles">
        <button className={`set-style${snap.assistant.mode === 'space' ? ' on' : ''}`} onClick={() => window.missiondesk.setAssistantMode('space')}>
          <strong>{t('settings.assistant.onePerSpace')}</strong>
          <span>{t('settings.assistant.onePerSpaceHint')}</span>
        </button>
        <button className={`set-style${snap.assistant.mode === 'all' ? ' on' : ''}`} onClick={() => window.missiondesk.setAssistantMode('all')}>
          <strong>{t('settings.assistant.oneForAll')}</strong>
          <span>{t('settings.assistant.oneForAllHint')}</span>
        </button>
      </div>
      <label className="set-toggle">
        <input type="checkbox" checked={snap.assistant.button} onChange={(e) => window.missiondesk.setAssistantButton(e.target.checked)} />
        <span>
          {t('settings.assistant.button')}
          <small>{t('settings.assistant.buttonHint')}</small>
        </span>
      </label>
      <h3>{snap.assistant.mode === 'space' ? t('settings.assistant.spacesHeading') : t('settings.assistant.everythingHeading')}</h3>
      <p className="set-muted">{t('settings.assistant.intro')}</p>
      {snap.assistant.scopes.map((s) => (
        <ScopeCard key={s.key} snap={snap} scope={s.key} name={s.name} ready={ready} orModels={orModels} />
      ))}
    </>
  );
}

const INSTALL_CLAUDE = 'curl -fsSL https://claude.ai/install.sh | bash';
const INSTALL_CODEX = 'npm install -g @openai/codex';

function statusText(st: ClaudeStatus | null, app: string): string {
  if (st === null) return t('settings.integrations.checking');
  if (st.state === 'ready')
    return 'version' in st && st.version ? t('settings.integrations.connectedVersion', { app, version: st.version }) : t('settings.integrations.connected');
  return st.state === 'signed-out' ? t('settings.integrations.signedOut') : t('settings.integrations.notInstalled');
}

/** A CLI the user signs in to in the browser (Claude Code, Codex): status, install, sign in. */
function CliIntegration({
  title,
  app,
  blurb,
  install,
  getStatus,
  signIn,
  cancel,
  children,
}: {
  title: string;
  app: string;
  blurb: string;
  install: string;
  getStatus(): Promise<ClaudeStatus>;
  signIn(): Promise<ClaudeStatus>;
  cancel(): void;
  children?: React.ReactNode;
}): React.JSX.Element {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const check = (): void => {
    setStatus(null);
    void getStatus().then(setStatus);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(check, []);
  return (
    <div className="set-card asg-card">
      <div className="asg-head">
        <strong>{title}</strong>
        <span className={`asg-state ${status?.state ?? ''}`}>{statusText(status, app)}</span>
      </div>
      <p className="set-muted">{blurb}</p>
      {status?.state === 'signed-out' &&
        (waiting ? (
          <p className="set-muted">
            {t('settings.integrations.waiting')}{' '}
            <button className="set-link" onClick={cancel}>
              {t('common.cancel')}
            </button>
          </p>
        ) : (
          <div>
            <button
              className="primary"
              onClick={() => {
                setWaiting(true);
                void signIn().then((st) => {
                  setStatus(st);
                  setWaiting(false);
                });
              }}
            >
              {t('settings.integrations.signIn')}
            </button>
          </div>
        ))}
      {status?.state === 'not-installed' && (
        <div className="asg-install">
          <p className="set-muted">{t('settings.integrations.installHint')}</p>
          <div className="ast-cmd">
            <code>{install}</code>
            <button onClick={() => void navigator.clipboard.writeText(install).then(() => setCopied(true))}>{copied ? t('settings.integrations.copied') : t('settings.integrations.copy')}</button>
          </div>
          <button className="set-link" onClick={check}>
            {t('settings.integrations.installed')}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function OpenRouterIntegration(): React.JSX.Element {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void window.missiondesk.openRouterStatus().then((s) => setConnected(s.connected));
  }, []);
  async function connect(): Promise<void> {
    setBusy(true);
    setError('');
    const r = await window.missiondesk.openRouterConnect(key);
    setBusy(false);
    setConnected(r.connected);
    if (r.error) setError(r.error);
    else setKey('');
  }
  return (
    <div className="set-card asg-card">
      <div className="asg-head">
        <strong>OpenRouter</strong>
        <span className={`asg-state ${connected ? 'ready' : connected === false ? 'signed-out' : ''}`}>{connected === null ? t('settings.integrations.checking') : connected ? t('settings.integrations.connected') : t('settings.integrations.notConnected')}</span>
      </div>
      <p className="set-muted">{t('settings.integrations.openrouterBlurb')}</p>
      {connected ? (
        <div>
          <button className="set-link" onClick={() => (window.missiondesk.openRouterDisconnect(), setConnected(false))}>
            {t('settings.integrations.disconnect')}
          </button>
        </div>
      ) : (
        <>
          <div className="asg-key">
            <input
              type="password"
              className="set-input"
              placeholder="sk-or-v1-…"
              value={key}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && key.trim() && !busy && void connect()}
            />
            <button className="primary" disabled={!key.trim() || busy} onClick={() => void connect()}>
              {busy ? t('settings.integrations.checking') : t('settings.integrations.connect')}
            </button>
          </div>
          {error && <p className="asg-error">{error}</p>}
          <p className="set-muted">
            {rich('settings.integrations.createKey', {
              link: (s) => (
                <a
                  href="https://openrouter.ai/keys"
                  onClick={(e) => {
                    e.preventDefault();
                    window.missiondesk.openExternal('https://openrouter.ai/keys');
                  }}
                >
                  {s}
                </a>
              ),
            })}
          </p>
        </>
      )}
    </div>
  );
}

/** Settings → Integrations: the assistants Mission Desk can use, and Claude in other apps. */
export function IntegrationsSettings(): React.JSX.Element {
  return (
    <>
      <h2>{t('settings.section.integrations')}</h2>
      <p className="set-muted">{t('settings.integrations.intro')}</p>
      <CliIntegration
        title="Claude"
        app="Claude Code"
        blurb={t('settings.integrations.claudeBlurb')}
        install={INSTALL_CLAUDE}
        getStatus={() => window.missiondesk.claudeIntegrationStatus()}
        signIn={() => window.missiondesk.assistantSignIn()}
        cancel={() => window.missiondesk.assistantSignInCancel()}
      >
        <h3>{t('settings.integrations.claudeOtherApps')}</h3>
        <ClaudeConnectPanel />
        <button className="set-link" onClick={() => window.missiondesk.showClaudeLog()}>
          {t('settings.integrations.claudeLog')}
        </button>
      </CliIntegration>
      <CliIntegration
        title="OpenAI Codex"
        app="Codex"
        blurb={t('settings.integrations.codexBlurb')}
        install={INSTALL_CODEX}
        getStatus={() => window.missiondesk.codexStatus()}
        signIn={() => window.missiondesk.codexSignIn()}
        cancel={() => window.missiondesk.codexSignInCancel()}
      />
      <OpenRouterIntegration />
    </>
  );
}
