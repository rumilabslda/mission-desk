import { useEffect, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantModel } from '../../../shared/assistant';
import type { AssistantEngine } from '../../../shared/assistant-engines';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import type { Account } from '../../../shared/types';
import { ClaudeConnectPanel } from '../ConnectClaudeDialog';
import { type MessageKey, t } from '../i18n';
import { BUILTIN, CONNECTION_KINDS, type Connection, type ConnectionInfo, type ConnectionKind } from '../../../shared/connections';
import { connectionLabel, ConnectionsSettings, KIND_NAME } from './ConnectionsSettings';

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


/** One scope's notes: only its own assistant sees them. Click a note to change it. */
/** Opens the scope's memory (the same window as the assistant's 🧠 button). */
function MemoryButton({ scope, count }: { scope: string; count: number }): React.JSX.Element {
  return (
    <div className="asg-memory">
      <button type="button" className="set-action" onClick={() => window.missiondesk.openMemory(scope)}>
        🧠 {t('settings.memory.open', { count })}
      </button>
    </div>
  );
}

function ScopeCard({ snap, scope, name, conns, orModels }: { snap: UiSnapshot; scope: string; name: string; conns: ConnectionInfo[] | null; orModels: { id: string; name: string }[] }): React.JSX.Element {
  const c = snap.assistant.configs[scope] ?? { engine: 'claude', model: 'default', effort: 'medium', openrouterModel: 'openrouter/auto', codexModel: '', connection: '' };
  const set = (patch: Partial<{ engine: AssistantEngine; model: AssistantModel; effort: AssistantEffort; openrouterModel: string; codexModel: string; connection: string }>): void =>
    window.missiondesk.setAssistantScopeConfig(scope, patch);
  const [codexModel, setCodexModel] = useState(c.codexModel);
  useEffect(() => setCodexModel(c.codexModel), [c.codexModel]);
  const accounts = accountsOf(snap, scope);
  // The space's connection: '' is its type's built-in. One that no longer exists is missing: never another.
  const currentId = c.engine === 'off' ? '' : c.connection || BUILTIN[c.engine];
  const builtinNow = c.engine !== 'off' && currentId === BUILTIN[c.engine];
  const stored = snap.assistant.connections.find((x) => x.id === currentId && x.kind === c.engine && !x.builtin);
  const missing = c.engine !== 'off' && !builtinNow && !stored;
  const current = c.engine === 'off' ? undefined : conns?.find((x) => x.id === currentId && x.kind === c.engine);
  const groups = CONNECTION_KINDS.map((kind) => {
    const items: (Pick<Connection, 'id' | 'kind' | 'name' | 'builtin' | 'email'> & { gone?: boolean })[] = (conns ?? []).filter((x) => x.kind === kind);
    if (c.engine === kind && !items.some((x) => x.id === currentId)) {
      // The space's own choice always shows, even before the list loads or when it's gone.
      items.unshift(builtinNow ? { id: currentId, kind, name: '', builtin: true } : stored ? { ...stored } : { id: currentId, kind, name: '—', gone: true });
    }
    return { kind, items };
  }).filter((g) => g.items.length > 0);
  const choose = (v: string): void => {
    if (v === 'off') return set({ engine: 'off' });
    const [kind, id] = v.split('|') as [ConnectionKind, string];
    set({ engine: kind, connection: id === BUILTIN[kind] ? '' : id });
  };
  return (
    <div className="set-card asg-card">
      <div className="asg-head">
        <strong>{name}</strong>
        <select className="set-select" value={c.engine === 'off' ? 'off' : `${c.engine}|${currentId}`} onChange={(e) => choose(e.target.value)} title={t('settings.assistant.engineTitle')}>
          {groups.map((g) => (
            <optgroup key={g.kind} label={t(KIND_NAME[g.kind])}>
              {g.items.map((x) => (
                <option key={x.id} value={`${x.kind}|${x.id}`}>
                  {x.gone ? '—' : connectionLabel(x) + (x.email ? ` · ${x.email}` : '')}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="off">{t('common.off')}</option>
        </select>
      </div>
      {missing && <p className="asg-error">{t('settings.connections.missing')}</p>}
      {c.engine !== 'off' && !missing && conns !== null && current?.state !== 'ready' && (
        <p className="asg-error">
          {t('settings.assistant.notConnected', { name: current ? connectionLabel(current) : builtinNow ? connectionLabel({ kind: c.engine, name: '', builtin: true }) : (stored?.name ?? '') })}{' '}
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
      {c.engine !== 'off' && <MemoryButton scope={scope} count={(snap.assistant.memory[scope] ?? []).length} />}
    </div>
  );
}

/** Settings → Assistant: one per space or one for everything, and each space's assistant. */
export function AssistantSettings({ snap }: { snap: UiSnapshot }): React.JSX.Element {
  const [conns, setConns] = useState<ConnectionInfo[] | null>(null);
  const [orModels, setOrModels] = useState<{ id: string; name: string }[]>([]);
  const uses = (e: AssistantEngine): boolean => Object.values(snap.assistant.configs).some((c) => c.engine === e);
  const storedKey = JSON.stringify(snap.assistant.connections);
  useEffect(() => {
    let live = true;
    void window.missiondesk.connectionsInfo().then((l) => live && setConns(l));
    return () => {
      live = false;
    };
  }, [storedKey]);
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
        <ScopeCard key={s.key} snap={snap} scope={s.key} name={s.name} conns={conns} orModels={orModels} />
      ))}
    </>
  );
}

/** Settings → Integrations: the assistants Mission Desk can use, and Claude in other apps. */
export function IntegrationsSettings({ snap }: { snap: UiSnapshot }): React.JSX.Element {
  return (
    <>
      <h2>{t('settings.section.integrations')}</h2>
      <p className="set-muted">{t('settings.integrations.intro')}</p>
      <ConnectionsSettings connections={snap.assistant.connections} />
      <h3>{t('settings.integrations.claudeOtherApps')}</h3>
      <div className="set-card asg-card">
        <ClaudeConnectPanel />
        <button className="set-link" onClick={() => window.missiondesk.showClaudeLog()}>
          {t('settings.integrations.claudeLog')}
        </button>
      </div>
    </>
  );
}
