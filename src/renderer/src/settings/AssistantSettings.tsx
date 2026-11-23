import { useEffect, useState } from 'react';
import { ASSISTANT_EFFORTS, ASSISTANT_MODELS, type AssistantEffort, type AssistantModel, type ClaudeStatus } from '../../../shared/assistant';
import { type AssistantEngine, ENGINES } from '../../../shared/assistant-engines';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import type { Account } from '../../../shared/types';
import { ClaudeConnectPanel } from '../ConnectClaudeDialog';
import { type MessageKey, rich, t } from '../i18n';
import { ConnectionsSettings } from './ConnectionsSettings';

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

function ScopeCard({ snap, scope, name, ready, orModels }: { snap: UiSnapshot; scope: string; name: string; ready: Ready; orModels: { id: string; name: string }[] }): React.JSX.Element {
  const c = snap.assistant.configs[scope] ?? { engine: 'claude', model: 'default', effort: 'medium', openrouterModel: 'openrouter/auto', codexModel: '', connection: '' };
  const set = (patch: Partial<{ engine: AssistantEngine; model: AssistantModel; effort: AssistantEffort; openrouterModel: string; codexModel: string; connection: string }>): void =>
    window.missiondesk.setAssistantScopeConfig(scope, patch);
  const [codexModel, setCodexModel] = useState(c.codexModel);
  useEffect(() => setCodexModel(c.codexModel), [c.codexModel]);
  const accounts = accountsOf(snap, scope);
  const claudeConns = snap.assistant.connections.filter((x) => x.kind === 'claude' && !x.builtin);
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
      {c.engine === 'claude' && c.connection && !claudeConns.some((a) => a.id === c.connection) && <p className="asg-error">{t('settings.claudeAccounts.missing')}</p>}
      {c.engine !== 'off' && (
        <div className="asg-row">
          {c.engine === 'claude' && (claudeConns.length > 0 || c.connection) && (
            <label>
              {t('settings.claudeAccounts.choose')}
              <select className="set-select" value={c.connection} onChange={(e) => set({ connection: e.target.value })}>
                <option value="">{t('settings.claudeAccounts.mac')}</option>
                {claudeConns.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.email ? `${a.name} · ${a.email}` : a.name}
                  </option>
                ))}
                {c.connection && !claudeConns.some((a) => a.id === c.connection) && <option value={c.connection}>—</option>}
              </select>
            </label>
          )}
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
