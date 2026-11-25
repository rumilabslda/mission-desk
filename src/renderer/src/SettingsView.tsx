import { isLanguageSetting, LOCALE_NAMES, LOCALES } from '../../shared/i18n/locales';
import { NameField as UserNameField } from './settings/NameField';
import { type MessageKey, rich, t } from './i18n';
import { useEffect, useState } from 'react';
import { ACCOUNT_COLORS, type AccountView, type AppInfo, type UiSnapshot } from '../../shared/ipc';
import type { Account, SidebarStyle, Space } from '../../shared/types';
import { AccountAvatar } from './AccountAvatar';
import { AssistantSettings, IntegrationsSettings } from './settings/AssistantSettings';
import { SkillsSettings } from './settings/SkillsSettings';
import { MeetingsSettings } from './settings/MeetingsSettings';
import { type Section, settingsSections } from './settings/sections';
import { CalendarToggles, LooseCalendars } from './settings/CalendarToggles';
import { SERVICE_LABEL } from './service-glyph';
import { COMPANY, COPYRIGHT, LICENSE_NAME, SITE, WEBSITE } from '../../shared/about';

const SECTIONS = settingsSections(window.missiondesk?.platform ?? 'darwin');

const STYLES: { id: SidebarStyle; label: MessageKey; hint: MessageKey }[] = [
  { id: 'sections', label: 'settings.style.sections', hint: 'settings.style.sectionsHint' },
  { id: 'folders', label: 'settings.style.folders', hint: 'settings.style.foldersHint' },
  { id: 'panel', label: 'settings.style.panel', hint: 'settings.style.panelHint' },
];

/** A text field that saves on Enter or when it loses focus. */
function NameField({ value, max, onSave }: { value: string; max: number; onSave(v: string): void }): React.JSX.Element {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = (): void => {
    const clean = text.trim();
    if (clean && clean.length <= max && clean !== value) onSave(clean);
    else setText(value);
  };
  return (
    <input
      className="set-input"
      value={text}
      maxLength={max}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setText(value);
          e.stopPropagation();
        }
      }}
    />
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange(v: boolean): void; label: string; hint?: string }): React.JSX.Element {
  return (
    <label className="set-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

const code = (s: string): React.JSX.Element => <code>{s}</code>;

const RELEASES = 'https://github.com/rumilabslda/mission-desk/releases/latest';

/** Where updates stand, and the one action that makes sense now. */
function UpdateStatus({ update }: { update: UiSnapshot['update'] }): React.JSX.Element {
  const s = update.state;
  const check = (
    <button className="set-action" disabled={s.kind === 'checking'} onClick={() => window.missiondesk.checkForUpdates()}>
      {t('settings.update.checkNow')}
    </button>
  );
  if (update.mode === 'off') return <p className="set-muted">{t('settings.update.devBuild')}</p>;
  switch (s.kind) {
    case 'checking':
      return <p className="set-update">{t('settings.update.checking')} {check}</p>;
    case 'none':
      return <p className="set-update">{t('settings.update.upToDate')} {check}</p>;
    case 'available':
      return (
        <p className="set-update">
          {t('settings.update.available', { version: s.version })}
          <button className="set-action" onClick={() => window.missiondesk.openExternal(RELEASES)}>
            {t('settings.update.download')}
          </button>
        </p>
      );
    case 'downloading':
      return (
        <p className="set-update">
          {t('settings.update.downloading', { version: s.version, percent: s.percent })}
        </p>
      );
    case 'ready':
      return (
        <p className="set-update">
          {t('settings.update.ready', { version: s.version })}
          <button className="primary" onClick={() => window.missiondesk.installUpdate()}>
            {t('settings.update.restart')}
          </button>
        </p>
      );
    case 'error':
      return (
        <p className="set-update">
          {s.message} {check}
        </p>
      );
    default:
      return (
        <p className="set-update">
          {update.auto ? t('settings.update.auto') : t('settings.update.autoOff')} {check}
        </p>
      );
  }
}

function iconValue(a: AccountView): string {
  const mode = a.iconMode ?? 'auto';
  return mode === 'account' ? `account:${a.iconSourceAccountId ?? ''}` : mode;
}
const CHOOSE_IMAGE = 'custom:choose';

function AccountCard({ a, snap }: { a: AccountView; snap: UiSnapshot }): React.JSX.Element {
  const update = (patch: Parameters<typeof window.missiondesk.updateAccount>[1]): void => window.missiondesk.updateAccount(a.id, patch);
  const others = snap.accounts.filter((o) => o.id !== a.id && o.iconMode !== 'account' && o.icon.kind === 'image');
  return (
    <div className="set-card">
      <div className="set-card-head">
        <AccountAvatar a={a} small />
        <NameField value={a.name} max={60} onSave={(name) => update({ name })} />
        <span className="set-muted">{SERVICE_LABEL[a.service]}</span>
        <button className="set-danger" onClick={() => window.missiondesk.removeAccount(a.id)}>
          {t('settings.account.remove')}
        </button>
      </div>
      <div className="set-grid">
        <span className="set-label">{t('settings.account.colour')}</span>
        <div className="colors set-colors">
          {ACCOUNT_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={c}
              className={`swatch${a.color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => update({ color: c })}
            />
          ))}
        </div>
        <span className="set-label">{t('settings.account.space')}</span>
        <select className="set-select" value={a.spaceId ?? ''} onChange={(e) => window.missiondesk.moveToSpace(a.id, e.target.value || null)}>
          <option value="">{t('common.none')}</option>
          {snap.spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {snap.chromeProfiles.length > 0 && (
          <>
            <span className="set-label">{t('settings.links.label')}</span>
            <span className="set-links-value">{linksTarget(snap, a.id)}</span>
          </>
        )}
        <span className="set-label">{t('settings.account.icon')}</span>
        <select
          className="set-select"
          value={iconValue(a)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === CHOOSE_IMAGE) window.missiondesk.chooseAccountImage(a.id); // the select snaps back if cancelled
            else if (v === 'custom' || v === iconValue(a)) return;
            else if (v.startsWith('account:')) update({ iconMode: 'account', iconSourceAccountId: v.slice(8) });
            else update({ iconMode: v as Account['iconMode'] });
          }}
        >
          <option value="auto">{t('settings.account.iconAuto')}</option>
          <option value="service">{t('settings.account.iconService')}</option>
          <option value="letter">{t('settings.account.iconLetter')}</option>
          {others.map((o) => (
            <option key={o.id} value={`account:${o.id}`}>
              {t('settings.account.iconSameAs', { name: o.name })}
            </option>
          ))}
          {a.iconMode === 'account' && !others.some((o) => `account:${o.id}` === iconValue(a)) && (
            <option value={iconValue(a)}>{t('settings.account.iconSameAsMissing')}</option>
          )}
          {a.iconMode === 'custom' && <option value="custom">{t('settings.account.iconCustom')}</option>}
          <option value={CHOOSE_IMAGE}>{a.iconMode === 'custom' ? t('settings.account.iconChooseAnother') : t('settings.account.iconChoose')}</option>
        </select>
        <span className="set-label">{t('settings.account.claudeAccess')}</span>
        <select className="set-select" value={a.claudeAccess ?? 'off'} onChange={(e) => update({ claudeAccess: e.target.value as Account['claudeAccess'] })}>
          <option value="off">{t('common.off')}</option>
          <option value="read">{t('settings.account.accessRead')}</option>
          <option value="act">{t('settings.account.accessAct')}</option>
        </select>
      </div>
      <div className="set-toggles">
        <Toggle checked={a.muted} onChange={(muted) => update({ muted })} label={t('settings.account.mute')} hint={t('settings.account.muteHint')} />
        <Toggle
          checked={a.hibernateWhenIdle}
          onChange={(hibernateWhenIdle) => update({ hibernateWhenIdle })}
          label={t('settings.account.hibernate')}
          hint={t('settings.account.hibernateHint')}
        />
      </div>
    </div>
  );
}

/** Where an app's browser links open: its Chrome profile (chosen, or matched by email) or the default browser. */
function linksTarget(snap: UiSnapshot, accountId: string): string {
  const p = snap.linkProfiles[accountId];
  if (!p) return t('settings.links.defaultBrowser');
  const target = t('settings.space.chromeProfileOption', { name: p.name });
  return p.auto ? t('settings.links.auto', { target }) : target;
}

function SpaceCard({ sp, snap }: { sp: Space; snap: UiSnapshot }): React.JSX.Element {
  const members = snap.accounts.filter((a) => a.spaceId === sp.id);
  const googles = members.filter((a) => a.service === 'google');
  const identity = (googles.find((g) => g.id === sp.googleAccountId) ?? googles[0])?.id ?? '';
  const sharing = sp.shareGoogle !== false;
  return (
    <div className="set-card">
      <div className="set-card-head">
        <NameField value={sp.name} max={40} onSave={(name) => window.missiondesk.renameSpace(sp.id, name)} />
        <span className="set-members">
          {members.map((m) => (
            <span key={m.id} title={m.name}>
              <AccountAvatar a={m} small />
            </span>
          ))}
        </span>
        <button className="set-danger" onClick={() => window.missiondesk.ungroupSpace(sp.id)}>
          {t('settings.space.ungroup')}
        </button>
      </div>
      <div className="set-toggles">
        <Toggle
          checked={!!sp.alwaysOpen}
          onChange={(v) => window.missiondesk.setSpaceAlwaysOpen(sp.id, v)}
          label={t('settings.space.alwaysOpen')}
          hint={t('settings.space.alwaysOpenHint')}
        />
        <Toggle
          checked={sharing}
          onChange={(v) => window.missiondesk.setSpaceShareGoogle(sp.id, v)}
          label={t('settings.space.shareGoogle')}
          hint={t('settings.space.shareGoogleHint')}
        />
      </div>
      <CalendarToggles accounts={members} hidden={snap.calendarHidden} />
      {googles.length > 1 && (
        <div className="set-grid">
          <span className="set-label">{t('settings.space.googleFrom')}</span>
          <select className="set-select" value={identity} disabled={!sharing} onChange={(e) => window.missiondesk.setSpaceGoogleAccount(sp.id, e.target.value)}>
            {googles.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {snap.chromeProfiles.length > 0 && (
        <>
          <div className="set-grid">
            <span className="set-label">{t('settings.space.chromeProfile')}</span>
            <select
              className="set-select"
              value={sp.chromeProfile ?? ''}
              onChange={(e) => window.missiondesk.setSpaceChromeProfile(sp.id, e.target.value || null)}
            >
              <option value="">{t('settings.space.chromeProfileDefault')}</option>
              {snap.chromeProfiles.map((p) => (
                <option key={p.dir} value={p.dir}>
                  {t('settings.space.chromeProfileOption', { name: p.name })}
                </option>
              ))}
            </select>
          </div>
          {!sp.chromeProfile && members.length > 0 && (
            <ul className="set-links">
              {members.map((m) => (
                <li key={m.id}>
                  <span>{m.name}</span>
                  <span>→ {linksTarget(snap, m.id)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="set-muted">{t('settings.space.chromeProfileHint')}</p>
        </>
      )}
    </div>
  );
}

/** The Mac's language, as Mission Desk picks it with Language set to the Mac's. */
const systemLocale = () => window.missiondesk.locale?.system ?? 'en';

export function SettingsView({ snapshot: snap }: { snapshot: UiSnapshot }): React.JSX.Element {
  const [section, setSection] = useState<Section>(() => (SECTIONS.some((s) => s.id === snap.settingsSection) ? (snap.settingsSection as Section) : 'general'));
  // Opened for a section (e.g. from the chat) while already open: go there.
  useEffect(() => {
    if (SECTIONS.some((s) => s.id === snap.settingsSection)) setSection(snap.settingsSection as Section);
  }, [snap.settingsSection]);
  const [info, setInfo] = useState<AppInfo | null>(null);
  useEffect(() => {
    void window.missiondesk.getAppInfo().then(setInfo);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || document.querySelector('.overlay')) return;
      // The dialog may already be gone by now (its own Escape closed it): check where the key came from.
      if ((e.target as Element | null)?.closest?.('.overlay, .set-body input, .set-body select')) return;
      window.missiondesk.closeSettings();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="settings">
      <nav className="set-nav">
        <h1>{t('settings.title')}</h1>
        {SECTIONS.map((s) => (
          <button key={s.id} className={section === s.id ? 'on' : ''} onClick={() => setSection(s.id)}>
            {t(s.label)}
          </button>
        ))}
      </nav>
      <section className="set-body">
        <button className="set-done" onClick={() => window.missiondesk.closeSettings()}>
          {t('common.done')}
        </button>
        {section === 'general' && (
          <>
            <h2>{t('settings.section.general')}</h2>
            <div className="set-toggles">
              <Toggle
                checked={snap.openOnToday}
                onChange={(v) => window.missiondesk.setOpenOnToday(v)}
                label={t('settings.general.openOnHome')}
                hint={t('settings.general.openOnHomeHint')}
              />
              <Toggle
                checked={snap.messagePreviews}
                onChange={(v) => window.missiondesk.setMessagePreviews(v)}
                label={t('settings.general.previews')}
                hint={t('settings.general.previewsHint')}
              />
              <Toggle
                checked={snap.linksInApp}
                onChange={(v) => window.missiondesk.setLinksInApp(v)}
                label={t('settings.general.linksInApp')}
                hint={t('settings.general.linksInAppHint')}
              />
            </div>
            <h3>{t('settings.general.name')}</h3>
            <UserNameField value={snap.userName} onSave={(n) => window.missiondesk.setUserName(n)} />
            <p className="set-muted">{t('settings.general.nameHint')}</p>
            <h3>{t('settings.language.title')}</h3>
            <select className="set-select" value={snap.language} onChange={(e) => isLanguageSetting(e.target.value) && window.missiondesk.setLanguage(e.target.value)}>
              <option value="system">{t('settings.language.system', { name: LOCALE_NAMES[systemLocale()] })}</option>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
            <p className="set-muted">{t('settings.language.hint')}</p>
            <h3>{t('settings.general.sidebarStyle')}</h3>
            <div className="set-styles">
              {STYLES.map((s) => (
                <button key={s.id} className={`set-style${snap.sidebarStyle === s.id ? ' on' : ''}`} onClick={() => window.missiondesk.setSidebarStyle(s.id)}>
                  <strong>{t(s.label)}</strong>
                  <span>{t(s.hint)}</span>
                </button>
              ))}
            </div>
            <h3>{t('settings.general.weekStart')}</h3>
            <select
              className="set-select"
              value={String(snap.weekStartSetting)}
              onChange={(e) => window.missiondesk.setWeekStart(e.target.value === 'auto' ? 'auto' : (Number(e.target.value) as 0 | 1))}
            >
              <option value="auto">{t('settings.general.weekStartAuto')}</option>
              <option value="1">{t('settings.general.monday')}</option>
              <option value="0">{t('settings.general.sunday')}</option>
            </select>
            <h3>{t('settings.general.setup')}</h3>
            <p className="set-muted">{t('settings.general.setupHint')}</p>
            <button className="set-action" onClick={() => window.missiondesk.openSetup()}>
              {t('settings.general.runSetup')}
            </button>
          </>
        )}
        {section === 'apps' && (
          <>
            <h2>{t('settings.section.apps')}</h2>
            {snap.accounts.length === 0 && <p className="set-muted">{t('settings.accounts.empty')}</p>}
            {snap.accounts.map((a) => (
              <AccountCard key={a.id} a={a} snap={snap} />
            ))}
          </>
        )}
        {section === 'spaces' && (
          <>
            <h2>{t('settings.section.spaces')}</h2>
            <p className="set-muted">{t('settings.spaces.intro')}</p>
            {snap.spaces.length === 0 && <p className="set-muted">{t('settings.spaces.empty')}</p>}
            {snap.spaces.map((sp) => (
              <SpaceCard key={sp.id} sp={sp} snap={snap} />
            ))}
            <LooseCalendars accounts={snap.accounts} hidden={snap.calendarHidden} />
          </>
        )}
        {section === 'assistant' && <AssistantSettings snap={snap} />}
        {section === 'skills' && <SkillsSettings snap={snap} />}
        {section === 'meetings' && <MeetingsSettings snap={snap} />}
        {section === 'integrations' && <IntegrationsSettings snap={snap} />}
        {section === 'data' && (
          <>
            <h2>{t('settings.section.data')}</h2>
            <p>{t('settings.data.intro')}</p>
            <h3>{t('settings.data.where')}</h3>
            <div className="set-card">
              <p className="set-path">{info?.dataFolder ?? '…'}</p>
              <ul className="set-list">
                <li>{rich('settings.data.accountsFile', { code })}</li>
                <li>{rich('settings.data.avatarsFile', { code })}</li>
                <li>{rich('settings.data.partitions', { code })}</li>
                <li>{rich('settings.data.activityLog', { code })}</li>
              </ul>
              <button className="set-link" onClick={() => window.missiondesk.showDataFolder()}>
                {t('settings.data.showInFinder')}
              </button>
            </div>
            <p className="set-muted">{t('settings.data.calendarMemory')}</p>
          </>
        )}
        {section === 'about' && (
          <>
            <h2>{t('settings.section.about')}</h2>
            <div className="set-card">
              <p>
                <strong>Mission Desk</strong> {info?.version ? t('settings.about.version', { version: info.version }) : ''} ·{' '}
                <a
                  href={SITE}
                  onClick={(e) => {
                    e.preventDefault();
                    window.missiondesk.openExternal(SITE);
                  }}
                >
                  {SITE.replace(/^https:\/\//, '')}
                </a>
              </p>
              <p>
                {t('settings.about.madeBy', { company: COMPANY })} ·{' '}
                <a
                  href={WEBSITE}
                  onClick={(e) => {
                    e.preventDefault();
                    window.missiondesk.openExternal(WEBSITE);
                  }}
                >
                  {WEBSITE.replace(/^https:\/\//, '')}
                </a>
              </p>
              <p className="set-muted">{COPYRIGHT}</p>
            </div>
            <h3>{t('settings.about.updates')}</h3>
            <div className="set-card" role="status" aria-live="polite">
              <UpdateStatus update={snap.update} />
            </div>
            {snap.update.mode !== 'off' && (
              <div className="set-toggles">
                <Toggle
                  checked={snap.update.auto}
                  onChange={(v) => window.missiondesk.setAutoUpdate(v)}
                  label={t('settings.about.autoUpdate')}
                  hint={t('settings.about.autoUpdateHint')}
                />
              </div>
            )}
            <h3>{t('settings.about.license')}</h3>
            <div className="set-card">
              <p>{LICENSE_NAME}</p>
              <p className="set-muted">{t('settings.about.licenseSummary')}</p>
            </div>
            <p className="set-muted">{t('settings.about.independent')}</p>
          </>
        )}
      </section>
    </div>
  );
}
