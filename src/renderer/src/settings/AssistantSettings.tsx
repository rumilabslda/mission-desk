import { useEffect, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantModel, type ClaudeStatus } from '../../../shared/assistant';
import { type AssistantEngine, ENGINES } from '../../../shared/assistant-engines';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import type { Account } from '../../../shared/types';
import { ClaudeConnectPanel } from '../ConnectClaudeDialog';

const ACCESS: { value: NonNullable<Account['claudeAccess']>; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'read', label: 'Read' },
  { value: 'act', label: 'Read & act' },
];

/** The accounts a scope's card lists ('all' lists none: it uses every account turned on in the spaces). */
function accountsOf(snap: UiSnapshot, scope: string): AccountView[] {
  if (scope === 'nospace') return snap.accounts.filter((a) => !a.spaceId);
  if (scope.startsWith('space:')) return snap.accounts.filter((a) => a.spaceId === scope.slice(6));
  if (snap.assistant.mode === 'all') return snap.accounts;
  return [];
}

type Ready = Partial<Record<AssistantEngine, boolean>>;

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
        <select className="set-select" value={c.engine} onChange={(e) => set({ engine: e.target.value as AssistantEngine })} title="Which assistant answers in this space">
          {ENGINES.map((en) => (
            <option key={en.id} value={en.id}>
              {en.name}
            </option>
          ))}
          <option value="off">Off</option>
        </select>
      </div>
      {c.engine !== 'off' && ready[c.engine] === false && (
        <p className="asg-error">
          {ENGINES.find((x) => x.id === c.engine)?.name} isn't connected yet.{' '}
          <button className="set-link" onClick={() => window.missiondesk.openSettings('integrations')}>
            Connect it in Integrations
          </button>
        </p>
      )}
      {c.engine !== 'off' && (
        <div className="asg-row">
          {c.engine === 'claude' && (
            <label>
              Model
              <select className="set-select" value={c.model} onChange={(e) => set({ model: e.target.value as AssistantModel })}>
                {ASSISTANT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {c.engine === 'openrouter' && (
            <label>
              Model
              <select className="set-select asg-model" value={c.openrouterModel} onChange={(e) => set({ openrouterModel: e.target.value })}>
                <option value="openrouter/auto">Auto (OpenRouter picks)</option>
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
              Model
              <input
                className="set-input"
                placeholder="Codex default"
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
            Effort
            <select className="set-select" value={c.effort} onChange={(e) => set({ effort: e.target.value as AssistantEffort })}>
              {ASSISTANT_EFFORTS.map((ef) => (
                <option key={ef} value={ef}>
                  {ef}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {c.engine === 'off' && <p className="set-muted">No assistant in this space.</p>}
      {c.engine !== 'off' &&
        (scope === 'all' && snap.assistant.mode === 'space' ? (
          <p className="set-muted">Sees every account turned on in the spaces above.</p>
        ) : accounts.length === 0 ? (
          <p className="set-muted">No accounts here.</p>
        ) : (
          <ul className="asg-accounts">
            {accounts.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span>
                <select
                  className="set-select"
                  value={a.claudeAccess ?? 'off'}
                  onChange={(e) => window.missiondesk.updateAccount(a.id, { claudeAccess: e.target.value as Account['claudeAccess'] })}
                  title="What the assistant may do in this account"
                >
                  {ACCESS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        ))}
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
      <h2>Assistant</h2>
      <div className="set-styles">
        <button className={`set-style${snap.assistant.mode === 'space' ? ' on' : ''}`} onClick={() => window.missiondesk.setAssistantMode('space')}>
          <strong>One per space</strong>
          <span>Each space has its own assistant and history, and it sees only that space's accounts.</span>
        </button>
        <button className={`set-style${snap.assistant.mode === 'all' ? ' on' : ''}`} onClick={() => window.missiondesk.setAssistantMode('all')}>
          <strong>One for everything</strong>
          <span>A single assistant and history that sees every account turned on below.</span>
        </button>
      </div>
      <label className="set-toggle">
        <input type="checkbox" checked={snap.assistant.button} onChange={(e) => window.missiondesk.setAssistantButton(e.target.checked)} />
        <span>
          Show the assistant button
          <small>The round ✦ button. Drag it up, down or to the other side. ⌘J opens the assistant either way.</small>
        </span>
      </label>
      <h3>{snap.assistant.mode === 'space' ? 'Spaces' : 'Everything'}</h3>
      <p className="set-muted">
        Choose the assistant for each one and what it may do in each account: Read, or Read & act (click and type, after asking you). It never sends anything for
        you. Connect assistants in Integrations.
      </p>
      {snap.assistant.scopes.map((s) => (
        <ScopeCard key={s.key} snap={snap} scope={s.key} name={s.name} ready={ready} orModels={orModels} />
      ))}
    </>
  );
}

const INSTALL_CLAUDE = 'curl -fsSL https://claude.ai/install.sh | bash';
const INSTALL_CODEX = 'npm install -g @openai/codex';

function statusText(st: ClaudeStatus | null, app: string): string {
  if (st === null) return 'Checking…';
  if (st.state === 'ready') return `Connected${'version' in st && st.version ? ` · ${app} ${st.version}` : ''}`;
  return st.state === 'signed-out' ? 'Not signed in' : 'Not installed';
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
            Waiting for you to finish in the browser…{' '}
            <button className="set-link" onClick={cancel}>
              Cancel
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
              Sign in
            </button>
          </div>
        ))}
      {status?.state === 'not-installed' && (
        <div className="asg-install">
          <p className="set-muted">Install it: open Terminal, paste this and press Return.</p>
          <div className="ast-cmd">
            <code>{install}</code>
            <button onClick={() => void navigator.clipboard.writeText(install).then(() => setCopied(true))}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <button className="set-link" onClick={check}>
            I’ve installed it
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
        <span className={`asg-state ${connected ? 'ready' : connected === false ? 'signed-out' : ''}`}>{connected === null ? 'Checking…' : connected ? 'Connected' : 'Not connected'}</span>
      </div>
      <p className="set-muted">GPT, Gemini, Llama, Mistral, Claude and many more, with your OpenRouter key. The key is kept encrypted by macOS on this Mac; usage is billed by OpenRouter.</p>
      {connected ? (
        <div>
          <button className="set-link" onClick={() => (window.missiondesk.openRouterDisconnect(), setConnected(false))}>
            Disconnect (forget the key)
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
              {busy ? 'Checking…' : 'Connect'}
            </button>
          </div>
          {error && <p className="asg-error">{error}</p>}
          <p className="set-muted">
            Create a key at{' '}
            <a
              href="https://openrouter.ai/keys"
              onClick={(e) => {
                e.preventDefault();
                window.missiondesk.openExternal('https://openrouter.ai/keys');
              }}
            >
              openrouter.ai/keys
            </a>
            .
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
      <h2>Integrations</h2>
      <p className="set-muted">Connect the assistants you want. Then, in Assistant, choose which one each space uses.</p>
      <CliIntegration
        title="Claude"
        app="Claude Code"
        blurb="Runs on your own Claude Code, with your Claude plan."
        install={INSTALL_CLAUDE}
        getStatus={() => window.missiondesk.claudeIntegrationStatus()}
        signIn={() => window.missiondesk.assistantSignIn()}
        cancel={() => window.missiondesk.assistantSignInCancel()}
      >
        <h3>Claude in other apps</h3>
        <ClaudeConnectPanel />
        <button className="set-link" onClick={() => window.missiondesk.showClaudeLog()}>
          Show Claude's activity log
        </button>
      </CliIntegration>
      <CliIntegration
        title="OpenAI Codex"
        app="Codex"
        blurb="Runs on your own Codex CLI, with your ChatGPT plan. Mission Desk turns off Codex's own tools (shell, web, files) and your Codex settings, and stops any answer that tries to use them."
        install={INSTALL_CODEX}
        getStatus={() => window.missiondesk.codexStatus()}
        signIn={() => window.missiondesk.codexSignIn()}
        cancel={() => window.missiondesk.codexSignInCancel()}
      />
      <OpenRouterIntegration />
    </>
  );
}
