import { useEffect, useState } from 'react';
import { ACCOUNT_COLORS, type AccountView, type AppInfo, type UiSnapshot } from '../../shared/ipc';
import type { Account, SidebarStyle, Space } from '../../shared/types';
import { AccountAvatar } from './AccountAvatar';
import { AssistantSettings, IntegrationsSettings } from './settings/AssistantSettings';
import { SkillsSettings } from './settings/SkillsSettings';
import { SERVICE_LABEL } from './service-glyph';
import { COMPANY, COPYRIGHT, LICENSE_NAME, LICENSE_SUMMARY, SITE, WEBSITE } from '../../shared/about';

type Section = 'general' | 'accounts' | 'spaces' | 'calendar' | 'assistant' | 'skills' | 'integrations' | 'data' | 'about';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'spaces', label: 'Spaces' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'skills', label: 'Skills' },
  { id: 'data', label: 'Data and privacy' },
  { id: 'about', label: 'About' },
];

const STYLES: { id: SidebarStyle; label: string; hint: string }[] = [
  { id: 'sections', label: 'Sections', hint: 'Every space always open, with its name above it.' },
  { id: 'folders', label: 'Folders', hint: 'Spaces are folders you open in place; open ones are remembered.' },
  { id: 'panel', label: 'Folders with panel', hint: 'Clicking a space shows its apps in a panel next to the sidebar.' },
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

const RELEASES = 'https://github.com/rumilabslda/mission-desk/releases/latest';

/** Where updates stand, and the one action that makes sense now. */
function UpdateStatus({ update }: { update: UiSnapshot['update'] }): React.JSX.Element {
  const s = update.state;
  const check = (
    <button className="set-action" disabled={s.kind === 'checking'} onClick={() => window.missiondesk.checkForUpdates()}>
      Check now
    </button>
  );
  if (update.mode === 'off') return <p className="set-muted">This is a development build; it doesn’t update itself.</p>;
  switch (s.kind) {
    case 'checking':
      return <p className="set-update">Checking for a new version… {check}</p>;
    case 'none':
      return <p className="set-update">Mission Desk is up to date. {check}</p>;
    case 'available':
      return (
        <p className="set-update">
          Version {s.version} is available.
          <button className="set-action" onClick={() => window.missiondesk.openExternal(RELEASES)}>
            Download
          </button>
        </p>
      );
    case 'downloading':
      return (
        <p className="set-update">
          Downloading version {s.version}… {s.percent}%
        </p>
      );
    case 'ready':
      return (
        <p className="set-update">
          Version {s.version} is ready.
          <button className="primary" onClick={() => window.missiondesk.installUpdate()}>
            Restart to update
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
          {update.auto ? 'Mission Desk looks for new versions by itself.' : 'Automatic checks are off.'} {check}
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
          Remove…
        </button>
      </div>
      <div className="set-grid">
        <span className="set-label">Colour</span>
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
        <span className="set-label">Space</span>
        <select className="set-select" value={a.spaceId ?? ''} onChange={(e) => window.missiondesk.moveToSpace(a.id, e.target.value || null)}>
          <option value="">None</option>
          {snap.spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="set-label">Icon</span>
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
          <option value="auto">Company logo or photo</option>
          <option value="service">Service logo</option>
          <option value="letter">Letter</option>
          {others.map((o) => (
            <option key={o.id} value={`account:${o.id}`}>
              Same as {o.name}
            </option>
          ))}
          {a.iconMode === 'account' && !others.some((o) => `account:${o.id}` === iconValue(a)) && (
            <option value={iconValue(a)}>Same as another account (not available)</option>
          )}
          {a.iconMode === 'custom' && <option value="custom">Custom image</option>}
          <option value={CHOOSE_IMAGE}>{a.iconMode === 'custom' ? 'Choose another image…' : 'Choose image…'}</option>
        </select>
        <span className="set-label">Claude access</span>
        <select className="set-select" value={a.claudeAccess ?? 'off'} onChange={(e) => update({ claudeAccess: e.target.value as Account['claudeAccess'] })}>
          <option value="off">Off</option>
          <option value="read">Read</option>
          <option value="act">Read and act</option>
        </select>
      </div>
      <div className="set-toggles">
        <Toggle checked={a.muted} onChange={(muted) => update({ muted })} label="Mute notifications" hint="The badge still counts." />
        <Toggle
          checked={a.hibernateWhenIdle}
          onChange={(hibernateWhenIdle) => update({ hibernateWhenIdle })}
          label="Hibernate when not in use"
          hint="Frees memory after 10 minutes; reloads when you open it."
        />
      </div>
    </div>
  );
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
          Ungroup
        </button>
      </div>
      <div className="set-toggles">
        <Toggle
          checked={!!sp.alwaysOpen}
          onChange={(v) => window.missiondesk.setSpaceAlwaysOpen(sp.id, v)}
          label="Always open"
          hint="In the Folders style, this space never closes."
        />
        <Toggle
          checked={sharing}
          onChange={(v) => window.missiondesk.setSpaceShareGoogle(sp.id, v)}
          label="Share Google sign-in"
          hint="Sign in to Google once; the space's other apps (e.g. Slack) reuse it. WhatsApp is never touched."
        />
      </div>
      {googles.length > 1 && (
        <div className="set-grid">
          <span className="set-label">Google sign-in from</span>
          <select className="set-select" value={identity} disabled={!sharing} onChange={(e) => window.missiondesk.setSpaceGoogleAccount(sp.id, e.target.value)}>
            {googles.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

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
  const google = snap.accounts.filter((a) => a.service === 'google');
  const hidden = new Set(snap.calendarHidden);

  return (
    <div className="settings">
      <nav className="set-nav">
        <h1>Settings</h1>
        {SECTIONS.map((s) => (
          <button key={s.id} className={section === s.id ? 'on' : ''} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>
      <section className="set-body">
        <button className="set-done" onClick={() => window.missiondesk.closeSettings()}>
          Done
        </button>
        {section === 'general' && (
          <>
            <h2>General</h2>
            <div className="set-toggles">
              <Toggle
                checked={snap.openOnToday}
                onChange={(v) => window.missiondesk.setOpenOnToday(v)}
                label="Open on Home"
                hint="Show your meetings, to-dos and unread messages when Mission Desk starts."
              />
              <Toggle
                checked={snap.messagePreviews}
                onChange={(v) => window.missiondesk.setMessagePreviews(v)}
                label="Show message previews on Home"
                hint="Home lists new chats and emails. Turn this off to hide the text: only the sender or conversation shows. Nothing is saved; the list clears when Mission Desk quits."
              />
            </div>
            <h3>Sidebar style</h3>
            <div className="set-styles">
              {STYLES.map((s) => (
                <button key={s.id} className={`set-style${snap.sidebarStyle === s.id ? ' on' : ''}`} onClick={() => window.missiondesk.setSidebarStyle(s.id)}>
                  <strong>{s.label}</strong>
                  <span>{s.hint}</span>
                </button>
              ))}
            </div>
            <h3>Week starts on</h3>
            <select
              className="set-select"
              value={String(snap.weekStartSetting)}
              onChange={(e) => window.missiondesk.setWeekStart(e.target.value === 'auto' ? 'auto' : (Number(e.target.value) as 0 | 1))}
            >
              <option value="auto">Same as the Mac</option>
              <option value="1">Monday</option>
              <option value="0">Sunday</option>
            </select>
            <h3>Setup</h3>
            <p className="set-muted">Walk through the assistant, spaces and apps again. It only adds; what you have stays as it is.</p>
            <button className="set-action" onClick={() => window.missiondesk.openSetup()}>
              Run the setup again
            </button>
          </>
        )}
        {section === 'accounts' && (
          <>
            <h2>Accounts</h2>
            {snap.accounts.length === 0 && <p className="set-muted">No accounts yet. Add one with the + button.</p>}
            {snap.accounts.map((a) => (
              <AccountCard key={a.id} a={a} snap={snap} />
            ))}
          </>
        )}
        {section === 'spaces' && (
          <>
            <h2>Spaces</h2>
            <p className="set-muted">Group related apps together in a space. Create a space with the + button, or drag one app onto another.</p>
            {snap.spaces.length === 0 && <p className="set-muted">No spaces yet.</p>}
            {snap.spaces.map((sp) => (
              <SpaceCard key={sp.id} sp={sp} snap={snap} />
            ))}
          </>
        )}
        {section === 'calendar' && (
          <>
            <h2>Calendar</h2>
            <p className="set-muted">Accounts shown in All calendars (⌘0). It shows the calendars you have ticked in each account's Google Calendar.</p>
            {google.length === 0 && <p className="set-muted">Add a Google account to see its calendar.</p>}
            <div className="set-card">
              {google.map((a) => (
                <Toggle key={a.id} checked={!hidden.has(a.id)} onChange={(v) => window.missiondesk.setCalendarHidden(a.id, !v)} label={a.name} />
              ))}
            </div>
          </>
        )}
        {section === 'assistant' && <AssistantSettings snap={snap} />}
        {section === 'skills' && <SkillsSettings snap={snap} />}
        {section === 'integrations' && <IntegrationsSettings />}
        {section === 'data' && (
          <>
            <h2>Data and privacy</h2>
            <p>Mission Desk has no server and no tracking. It talks only to the services you add (and to Claude, if you connect it).</p>
            <h3>Where your data is</h3>
            <div className="set-card">
              <p className="set-path">{info?.dataFolder ?? '…'}</p>
              <ul className="set-list">
                <li>
                  <code>accounts.json</code>: your accounts, spaces and these settings
                </li>
                <li>
                  <code>avatars.json</code>: account icons
                </li>
                <li>
                  <code>Partitions/</code>: each account's own sign-in and data
                </li>
                <li>
                  <code>claude-activity.log</code>: what Claude did (never page text)
                </li>
              </ul>
              <button className="set-link" onClick={() => window.missiondesk.showDataFolder()}>
                Show in Finder
              </button>
            </div>
            <p className="set-muted">Calendar events are only kept in memory.</p>
          </>
        )}
        {section === 'about' && (
          <>
            <h2>About</h2>
            <div className="set-card">
              <p>
                <strong>Mission Desk</strong> {info?.version ? `version ${info.version}` : ''} ·{' '}
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
                Made by {COMPANY} ·{' '}
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
            <h3>Updates</h3>
            <div className="set-card" role="status" aria-live="polite">
              <UpdateStatus update={snap.update} />
            </div>
            {snap.update.mode !== 'off' && (
              <div className="set-toggles">
                <Toggle
                  checked={snap.update.auto}
                  onChange={(v) => window.missiondesk.setAutoUpdate(v)}
                  label="Check for updates automatically"
                  hint="Mission Desk asks GitHub, where its releases are, whether there’s a new version. GitHub only sees that a copy of Mission Desk is asking; nothing about you or your accounts is sent."
                />
              </div>
            )}
            <h3>License</h3>
            <div className="set-card">
              <p>{LICENSE_NAME}</p>
              <p className="set-muted">{LICENSE_SUMMARY}</p>
            </div>
            <p className="set-muted">
              Mission Desk is independent and not affiliated with Google, Microsoft, Slack, WhatsApp, Telegram, LinkedIn, Discord, Zoom, Notion, Proton, Apple, Fastmail, Anthropic, OpenAI or OpenRouter.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
