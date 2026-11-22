import { useState } from 'react';
import type { UiSnapshot } from '../../../shared/ipc';
import { MAX_DESCRIPTION, MAX_INSTRUCTIONS, MAX_NAME, SKILL_CATALOG, type Skill, type SkillDraft, type SkillMode } from '../../../shared/skills';
import { intlLocale, type MessageKey, rich, t } from '../i18n';

type Panel = { kind: 'none' } | { kind: 'catalog' } | { kind: 'import' } | { kind: 'new' } | { kind: 'edit'; id: string };

const MODE_LABEL: Record<SkillMode, MessageKey> = { always: 'settings.skills.modeAlways', auto: 'settings.skills.modeAuto' };

function sourceLabel(s: Skill): string {
  if (s.source.kind === 'catalog') return t('settings.skills.sourceCatalog');
  if (s.source.kind === 'import') return t('settings.skills.sourceImport');
  return t('settings.skills.sourceCustom');
}

/** Which spaces a skill is on in: one chip per space. */
function ScopeChips({ scopes, on, onToggle }: { scopes: { key: string; name: string }[]; on: (key: string) => boolean; onToggle(key: string): void }): React.JSX.Element {
  return (
    <div className="sk-scopes" role="group" aria-label={t('settings.skills.onIn')}>
      {scopes.map((s) => (
        <button key={s.key} type="button" className={`sk-scope${on(s.key) ? ' on' : ''}`} aria-pressed={on(s.key)} onClick={() => onToggle(s.key)}>
          {on(s.key) ? '✓ ' : ''}
          {s.name}
        </button>
      ))}
    </div>
  );
}

/** Name, when to use it, always or when it fits, and the instructions. */
function SkillEditor({
  initial,
  scopes,
  pickScopes,
  note,
  saveLabel,
  onSave,
  onCancel,
}: {
  initial: SkillDraft;
  scopes: { key: string; name: string }[];
  /** Ask where it is on (new and imported skills); editing keeps the switches as they are. */
  pickScopes: boolean;
  note?: React.ReactNode;
  saveLabel: string;
  onSave(draft: SkillDraft, scopes: string[]): void;
  onCancel(): void;
}): React.JSX.Element {
  const [d, setD] = useState<SkillDraft>(initial);
  const [where, setWhere] = useState<string[]>([]);
  const ok = d.name.trim() && d.description.trim() && d.instructions.trim() && d.name.length <= MAX_NAME && d.description.length <= MAX_DESCRIPTION && d.instructions.length <= MAX_INSTRUCTIONS;
  return (
    <div className="set-card sk-editor">
      {note}
      <label>
        {t('settings.skills.name')}
        <input className="set-input" maxLength={MAX_NAME} value={d.name} placeholder={t('settings.skills.namePlaceholder')} onChange={(e) => setD({ ...d, name: e.target.value })} />
      </label>
      <label>
        {t('settings.skills.whenToUse')}
        <input
          className="set-input"
          maxLength={MAX_DESCRIPTION}
          value={d.description}
          placeholder={t('settings.skills.whenToUsePlaceholder')}
          onChange={(e) => setD({ ...d, description: e.target.value })}
        />
      </label>
      <div className="sk-modes" role="radiogroup" aria-label={t('settings.skills.whenItApplies')}>
        {(['auto', 'always'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={d.mode === m} className={`sk-mode${d.mode === m ? ' on' : ''}`} onClick={() => setD({ ...d, mode: m })}>
            <strong>{t(MODE_LABEL[m])}</strong>
            <span>{m === 'auto' ? t('settings.skills.modeAutoHint') : t('settings.skills.modeAlwaysHint')}</span>
          </button>
        ))}
      </div>
      <label>
        {t('settings.skills.instructions')}
        <textarea
          className="set-input sk-instructions"
          rows={10}
          maxLength={MAX_INSTRUCTIONS}
          value={d.instructions}
          placeholder={t('settings.skills.instructionsPlaceholder')}
          onChange={(e) => setD({ ...d, instructions: e.target.value })}
        />
        <span className="set-muted sk-count">
          {d.instructions.length.toLocaleString(intlLocale())} / {MAX_INSTRUCTIONS.toLocaleString(intlLocale())}
        </span>
      </label>
      {pickScopes && (
        <div>
          <span className="sk-label">{t('settings.skills.onIn')}</span>
          <ScopeChips scopes={scopes} on={(k) => where.includes(k)} onToggle={(k) => setWhere(where.includes(k) ? where.filter((x) => x !== k) : [...where, k])} />
          {where.length === 0 && <p className="set-muted">{t('settings.skills.offEverywhere')}</p>}
        </div>
      )}
      <div className="sk-actions">
        <button type="button" className="set-action" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="primary" disabled={!ok} onClick={() => onSave({ ...d, name: d.name.trim(), description: d.description.trim(), instructions: d.instructions.trim() }, where)}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

function ImportPanel({ scopes, onDone }: { scopes: { key: string; name: string }[]; onDone(): void }): React.JSX.Element {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ url: string; draft: SkillDraft } | null>(null);

  async function fetchIt(): Promise<void> {
    setBusy(true);
    setError(null);
    const r = await window.missiondesk.skillFetch(url.trim());
    setBusy(false);
    if (r.ok) setFetched({ url: r.url, draft: r.draft });
    else setError(r.error);
  }

  if (fetched)
    return (
      <SkillEditor
        initial={fetched.draft}
        scopes={scopes}
        pickScopes
        saveLabel={t('settings.skills.save')}
        note={
          <p className="sk-warning">
            {rich('settings.skills.importWarning', { b: (s) => <strong>{s}</strong> }, { host: new URL(fetched.url).hostname })}
          </p>
        }
        onSave={(draft, where) => {
          window.missiondesk.skillAdd(draft, { kind: 'import', url: fetched.url }, where);
          onDone();
        }}
        onCancel={onDone}
      />
    );

  return (
    <div className="set-card sk-import">
      <p className="set-muted">{t('settings.skills.importHint')}</p>
      <div className="asg-key">
        <input
          className="set-input"
          autoFocus
          placeholder="https://github.com/…/SKILL.md"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && url.trim() && !busy && void fetchIt()}
        />
        <button type="button" className="set-action" disabled={!url.trim() || busy} onClick={() => void fetchIt()}>
          {busy ? t('settings.skills.fetching') : t('settings.skills.fetch')}
        </button>
      </div>
      {error && <p className="asg-error">{error}</p>}
      <div className="sk-actions">
        <button type="button" className="set-action" onClick={onDone}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

export function SkillsSettings({ snap }: { snap: UiSnapshot }): React.JSX.Element {
  const [panel, setPanel] = useState<Panel>({ kind: 'none' });
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { skills, skillsActive, scopes } = snap.assistant;
  const isOn = (id: string, scope: string): boolean => (skillsActive[scope] ?? []).includes(id);
  const inLibrary = (catalogId: string): boolean => skills.some((s) => s.source.kind === 'catalog' && s.source.id === catalogId);
  const close = (): void => setPanel({ kind: 'none' });
  const editing = panel.kind === 'edit' ? skills.find((s) => s.id === panel.id) : undefined;

  return (
    <>
      <h2>{t('settings.section.skills')}</h2>
      <p className="set-muted">{rich('settings.skills.intro', { code: (s) => <code>{s}</code> })}</p>
      <div className="sk-toolbar">
        <button type="button" className={panel.kind === 'catalog' ? 'primary' : 'set-action'} onClick={() => setPanel(panel.kind === 'catalog' ? { kind: 'none' } : { kind: 'catalog' })}>
          {t('settings.skills.catalog')}
        </button>
        <button type="button" className={panel.kind === 'import' ? 'primary' : 'set-action'} onClick={() => setPanel({ kind: 'import' })}>
          {t('settings.skills.import')}
        </button>
        <button type="button" className={panel.kind === 'new' ? 'primary' : 'set-action'} onClick={() => setPanel({ kind: 'new' })}>
          {t('settings.skills.new')}
        </button>
      </div>

      {panel.kind === 'catalog' && (
        <div className="sk-catalog">
          {SKILL_CATALOG.map((c) => (
            <div key={c.id} className="set-card sk-card">
              <div className="sk-head">
                <strong>{c.name}</strong>
                <span className="sk-badge">{t(MODE_LABEL[c.mode])}</span>
              </div>
              <p className="set-muted">{c.description}</p>
              <button
                type="button"
                className="set-action"
                disabled={inLibrary(c.id)}
                onClick={() =>
                  window.missiondesk.skillAdd(
                    null,
                    { kind: 'catalog', id: c.id },
                    scopes.map((s) => s.key),
                  )
                }
              >
                {inLibrary(c.id) ? t('settings.skills.added') : t('settings.skills.addEverywhere')}
              </button>
            </div>
          ))}
        </div>
      )}
      {panel.kind === 'import' && <ImportPanel scopes={scopes} onDone={close} />}
      {panel.kind === 'new' && (
        <SkillEditor
          initial={{ name: '', description: '', instructions: '', mode: 'auto' }}
          scopes={scopes}
          pickScopes
          saveLabel={t('settings.skills.save')}
          onSave={(draft, where) => {
            window.missiondesk.skillAdd(draft, { kind: 'custom' }, where);
            close();
          }}
          onCancel={close}
        />
      )}
      {editing && (
        <SkillEditor
          key={editing.id}
          initial={{ name: editing.name, description: editing.description, instructions: editing.instructions, mode: editing.mode }}
          scopes={scopes}
          pickScopes={false}
          saveLabel={t('common.saveChanges')}
          onSave={(draft) => {
            window.missiondesk.skillUpdate(editing.id, draft);
            close();
          }}
          onCancel={close}
        />
      )}

      <h3>{t('settings.skills.yours')}</h3>
      {skills.length === 0 ? (
        <p className="set-muted">{t('settings.skills.empty')}</p>
      ) : (
        skills.map((s) => (
          <div key={s.id} className="set-card sk-card">
            <div className="sk-head">
              <strong>{s.name}</strong>
              <code>/{s.command}</code>
              <span className="sk-badge">{t(MODE_LABEL[s.mode])}</span>
              <span className="sk-badge sk-source" title={s.source.kind === 'import' ? s.source.url : undefined}>
                {sourceLabel(s)}
              </span>
            </div>
            <p className="set-muted">{s.description}</p>
            <ScopeChips scopes={scopes} on={(k) => isOn(s.id, k)} onToggle={(k) => window.missiondesk.skillSetActive(s.id, k, !isOn(s.id, k))} />
            <div className="sk-actions left">
              <button type="button" className="set-link" onClick={() => setPanel({ kind: 'edit', id: s.id })}>
                {t('common.edit')}
              </button>
              {confirmRemove === s.id ? (
                <>
                  <button type="button" className="set-link danger" onClick={() => (window.missiondesk.skillRemove(s.id), setConfirmRemove(null))}>
                    {t('settings.skills.removeEverywhere')}
                  </button>
                  <button type="button" className="set-link" onClick={() => setConfirmRemove(null)}>
                    {t('common.keep')}
                  </button>
                </>
              ) : (
                <button type="button" className="set-link" onClick={() => setConfirmRemove(s.id)}>
                  {t('common.remove')}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}
