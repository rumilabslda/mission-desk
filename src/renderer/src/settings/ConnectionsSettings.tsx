import { useEffect, useRef, useState } from 'react';
import { BUILTIN, CONNECTION_KINDS, type Connection, type ConnectionInfo, type ConnectionKind } from '../../../shared/connections';
import { type MessageKey, rich, t } from '../i18n';

export const INSTALL_CLAUDE = 'curl -fsSL https://claude.ai/install.sh | bash';
export const INSTALL_CODEX = 'npm install -g @openai/codex';

export const KIND_NAME: Record<ConnectionKind, MessageKey> = { claude: 'settings.connections.kind.claude', codex: 'settings.connections.kind.codex', openrouter: 'settings.connections.kind.openrouter' };
const KIND_HINT: Record<ConnectionKind, MessageKey> = { claude: 'settings.connections.kindHint.claude', codex: 'settings.connections.kindHint.codex', openrouter: 'settings.connections.kindHint.openrouter' };
const BUILTIN_NAME: Record<ConnectionKind, MessageKey> = {
  claude: 'settings.connections.builtinName.claude',
  codex: 'settings.connections.builtinName.codex',
  openrouter: 'settings.connections.builtinName.openrouter',
};
const BASE_NAME: Record<ConnectionKind, string> = { claude: 'Claude', codex: 'Codex', openrouter: 'OpenRouter' };

/** What a connection is called: its own name, or the built-in's name in the user's language until renamed. */
export const connectionLabel = (c: Pick<Connection, 'kind' | 'name' | 'builtin'>): string => (c.name || (c.builtin ? t(BUILTIN_NAME[c.kind]) : ''));

/** "Claude 2", "Claude 3"…: the first that no connection has (built-ins included). */
export function uniqueName(kind: ConnectionKind, names: string[]): string {
  const low = new Set(names.map((n) => n.toLowerCase()));
  for (let n = 2; ; n++) if (!low.has(`${BASE_NAME[kind]} ${n}`.toLowerCase())) return `${BASE_NAME[kind]} ${n}`;
}

function InstallHint({ command, onDone }: { command: string; onDone(): void }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <div className="asg-install">
      <p className="set-muted">{t('settings.integrations.installHint')}</p>
      <div className="ast-cmd">
        <code>{command}</code>
        <button onClick={() => void navigator.clipboard.writeText(command).then(() => setCopied(true))}>{copied ? t('settings.integrations.copied') : t('settings.integrations.copy')}</button>
      </div>
      <button className="set-link" onClick={onDone}>
        {t('settings.integrations.installed')}
      </button>
    </div>
  );
}

function KeyField({ busy, label, onSubmit }: { busy: boolean; label: string; onSubmit(key: string): void }): React.JSX.Element {
  const [key, setKey] = useState('');
  return (
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
          onKeyDown={(e) => e.key === 'Enter' && key.trim() && !busy && onSubmit(key.trim())}
        />
        <button className="primary" disabled={!key.trim() || busy} onClick={() => onSubmit(key.trim())}>
          {busy ? t('settings.integrations.checking') : label}
        </button>
      </div>
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
  );
}

/** One connection: name (renamed in place), type, state; sign in again, new key, remove. */
function ConnectionRow({ c, onChanged }: { c: ConnectionInfo; onChanged(): void }): React.JSX.Element {
  const md = window.missiondesk;
  const label = connectionLabel(c);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askKey, setAskKey] = useState(false);
  const [error, setError] = useState('');
  const done = (r: { ok: boolean; error?: string }): void => {
    setBusy(false);
    if (!r.ok) setError(r.error ?? '');
    else {
      setError('');
      setAskKey(false);
    }
    onChanged();
  };
  const saveName = async (): Promise<void> => {
    if (renaming === null) return;
    const name = renaming.trim();
    if (!name || name === label) return setRenaming(null);
    const r = await md.connectionRename(c.id, name);
    if (r.ok) {
      setRenaming(null);
      setError('');
      onChanged();
    } else setError(r.error);
  };
  const who = [c.email, c.org].filter(Boolean).join(' · ');
  const state =
    c.state === 'ready'
      ? who
        ? t('settings.connections.signedInAs', { who })
        : t('settings.integrations.connected')
      : c.state === 'signed-out'
        ? c.kind === 'openrouter'
          ? t('settings.integrations.notConnected')
          : t('settings.integrations.signedOut')
        : t('settings.integrations.notInstalled');
  return (
    <div className="cn-item">
      <div className="ca-row">
        {renaming !== null ? (
          <input
            className="set-input cn-rename"
            autoFocus
            maxLength={40}
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveName();
              if (e.key === 'Escape') (setRenaming(null), setError(''));
            }}
            onBlur={() => void saveName()}
          />
        ) : (
          <strong>{label}</strong>
        )}
        <span className="cn-kind">{t(KIND_NAME[c.kind])}</span>
        <span className={`set-muted asg-state ${c.state}`}>{busy ? t('settings.integrations.waiting') : state}</span>
        <span className="ca-actions">
          {busy && c.kind !== 'openrouter' ? (
            <button type="button" className="set-link" onClick={() => md.connectionCancel()}>
              {t('common.cancel')}
            </button>
          ) : (
            <>
              {c.state === 'signed-out' && c.kind !== 'openrouter' && (
                <button type="button" className="set-link" onClick={() => (setBusy(true), setError(''), void md.connectionSignIn(c.id).then(done))}>
                  {t('settings.connections.signInAgain')}
                </button>
              )}
              {c.kind === 'openrouter' && !c.builtin && (
                <button type="button" className="set-link" onClick={() => setAskKey((v) => !v)}>
                  {t('settings.connections.newKey')}
                </button>
              )}
              <button type="button" className="set-link" aria-label={t('settings.connections.renameLabel', { name: label })} onClick={() => setRenaming(label)}>
                {t('settings.connections.rename')}
              </button>
              {!c.builtin && (
                <button type="button" className="set-link danger" aria-label={t('settings.connections.removeLabel', { name: label })} onClick={() => (md.connectionRemove(c.id), onChanged())}>
                  {t('settings.connections.remove')}
                </button>
              )}
              {c.builtin && c.kind === 'openrouter' && (
                <button type="button" className="set-link danger" onClick={() => (md.openRouterDisconnect(), onChanged())}>
                  {t('settings.integrations.disconnect')}
                </button>
              )}
            </>
          )}
        </span>
      </div>
      {askKey && <KeyField busy={busy} label={t('settings.integrations.connect')} onSubmit={(key) => (setBusy(true), void md.connectionSignIn(c.id, key).then(done))} />}
      {c.state === 'not-installed' && <InstallHint command={c.kind === 'codex' ? INSTALL_CODEX : INSTALL_CLAUDE} onDone={onChanged} />}
      {error && <p className="asg-error">{error}</p>}
    </div>
  );
}

/** + New connection: type → name → connect. Nothing is kept unless it connects. */
function NewConnectionWizard({ list, onRefresh, onClose }: { list: ConnectionInfo[]; onRefresh(): void; onClose(created: boolean): void }): React.JSX.Element {
  const md = window.missiondesk;
  const [kind, setKind] = useState<ConnectionKind | null>(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState<'type' | 'name' | 'connect'>('type');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const waiting = useRef(false);
  // Settings closed, or another section opened, while the browser sign-in waits: stop it, so nothing is left.
  useEffect(
    () => () => {
      if (waiting.current) md.connectionCancel();
    },
    [md],
  );
  const names = list.map(connectionLabel);
  // The program is installed when its built-in shows (Settings lists it only then).
  const installed = (k: ConnectionKind): boolean => k === 'openrouter' || list.some((c) => c.id === BUILTIN[k]);

  const next = (): void => {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (!clean) return setError(t('settings.connections.errorName'));
    if (names.some((n) => n.toLowerCase() === clean.toLowerCase())) return setError(t('settings.connections.errorTaken'));
    setName(clean);
    setError('');
    setStep('connect');
  };
  const connect = async (key?: string): Promise<void> => {
    if (!kind) return;
    setBusy(true);
    setError('');
    waiting.current = true;
    const r = await (key === undefined ? md.connectionCreate(kind, name) : md.connectionCreate(kind, name, key));
    waiting.current = false;
    setBusy(false);
    if (r.ok) onClose(true);
    else setError(r.error);
  };

  return (
    <div className="set-card asg-card cn-wizard">
      {step === 'type' && (
        <>
          <strong>{t('settings.connections.stepType')}</strong>
          <div className="cn-kinds">
            {CONNECTION_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="set-style"
                data-kind={k}
                onClick={() => {
                  setKind(k);
                  setName(uniqueName(k, names));
                  setStep('name');
                }}
              >
                <strong>{t(KIND_NAME[k])}</strong>
                <span>{t(KIND_HINT[k])}</span>
              </button>
            ))}
          </div>
          <div>
            <button type="button" className="set-link" onClick={() => onClose(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}
      {step === 'name' && kind && (
        <>
          <strong>{t('settings.connections.stepName')}</strong>
          <div className="asg-key">
            <input
              className="set-input cn-name"
              autoFocus
              maxLength={40}
              value={name}
              aria-invalid={!!error}
              onChange={(e) => (setName(e.target.value), setError(''))}
              onKeyDown={(e) => e.key === 'Enter' && next()}
            />
            <button className="primary" onClick={next}>
              {t('settings.connections.next')}
            </button>
          </div>
          <p className="set-muted">{t('settings.connections.nameHint')}</p>
          {error && <p className="asg-error">{error}</p>}
          <div>
            <button type="button" className="set-link" onClick={() => (setStep('type'), setError(''))}>
              {t('settings.connections.back')}
            </button>{' '}
            <button type="button" className="set-link" onClick={() => onClose(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}
      {step === 'connect' && kind && (
        <>
          <strong>{t('settings.connections.stepConnect', { name })}</strong>
          <p className="set-muted">{t(KIND_HINT[kind])}</p>
          {kind === 'openrouter' ? (
            <KeyField busy={busy} label={t('settings.integrations.connect')} onSubmit={(key) => void connect(key)} />
          ) : !installed(kind) ? (
            <InstallHint command={kind === 'codex' ? INSTALL_CODEX : INSTALL_CLAUDE} onDone={onRefresh} />
          ) : busy ? (
            <p className="set-muted">
              {t('settings.integrations.waiting')}{' '}
              <button type="button" className="set-link" onClick={() => md.connectionCancel()}>
                {t('common.cancel')}
              </button>
            </p>
          ) : (
            <div>
              <button className="primary" onClick={() => void connect()}>
                {t('settings.connections.signInBrowser')}
              </button>
            </div>
          )}
          {error && <p className="asg-error">{error}</p>}
          {!busy && (
            <div>
              <button type="button" className="set-link" onClick={() => (setStep('name'), setError(''))}>
                {t('settings.connections.back')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Settings → Integrations: every assistant connection, and a wizard to add one. */
export function ConnectionsSettings({ connections }: { connections: Connection[] }): React.JSX.Element {
  const [list, setList] = useState<ConnectionInfo[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [tick, setTick] = useState(0);
  const stored = JSON.stringify(connections);
  useEffect(() => {
    let live = true;
    void window.missiondesk.connectionsInfo().then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, [stored, tick]);
  const refresh = (): void => setTick((n) => n + 1);
  return (
    <>
      <h3>{t('settings.connections.title')}</h3>
      <p className="set-muted">{t('settings.connections.intro')}</p>
      <div className="set-card asg-card">
        {list === null ? (
          <p className="set-muted">{t('settings.integrations.checking')}</p>
        ) : (
          <div className="ca-list">
            {list.map((c) => (
              <ConnectionRow key={c.id} c={c} onChanged={refresh} />
            ))}
          </div>
        )}
        {!adding && (
          <div>
            <button type="button" className="set-action" onClick={() => setAdding(true)}>
              {t('settings.connections.new')}
            </button>
          </div>
        )}
      </div>
      {adding && <NewConnectionWizard list={list ?? []} onRefresh={refresh} onClose={() => (setAdding(false), refresh())} />}
    </>
  );
}
