import type { UiSnapshot } from '../../shared/ipc';
import type { ServiceId, ViewKind } from '../../shared/types';
import { LOGOS } from './logos';

const TAB_LOGO: Partial<Record<ServiceId, Partial<Record<ViewKind, string>>>> = {
  google: { main: LOGOS.gmail, calendar: LOGOS.calendar, drive: LOGOS.drive, meet: LOGOS.meet },
  microsoft: { main: LOGOS.outlookMail, calendar: LOGOS.outlookCalendar, teams: LOGOS.teams },
};

export function GoogleTabStrip({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element | null {
  const id = snapshot.calendarOpen || snapshot.settingsOpen || snapshot.todayOpen ? null : snapshot.activeAccountId;
  const tabs = id ? snapshot.googleTabs[id] : undefined;
  if (!id || !tabs) return null;
  const service = snapshot.accounts.find((a) => a.id === id)?.service;
  const logos = service ? (TAB_LOGO[service] ?? {}) : {};
  return (
    <div className="tabstrip" role="tablist">
      {tabs.tabs.map((t) => {
        const extra = t.id.startsWith('extra:');
        return (
          <div
            key={t.id}
            role="tab"
            aria-selected={tabs.active === t.id}
            className={`tab${tabs.active === t.id ? ' active' : ''}${extra ? ' extra' : ''}`}
            title={t.title}
            onClick={() => window.missiondesk.selectGoogleTab(id, t.id)}
            onAuxClick={(e) => {
              if (extra && e.button === 1) window.missiondesk.closeGoogleTab(id, t.id as `extra:${number}`);
            }}
          >
            {logos[t.id] && <img className="tab-logo" src={logos[t.id]} alt="" draggable={false} />}
            <span className="tab-title">{t.title}</span>
            {extra && (
              <button
                className="tab-close"
                aria-label={`Close ${t.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.missiondesk.closeGoogleTab(id, t.id as `extra:${number}`);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {tabs.offsite && (
        <span className="tab-offsite" title={`This page is on ${tabs.offsite}, outside ${snapshot.accounts.find((a) => a.id === id)?.name ?? 'the app'}`}>
          {tabs.offsite}
        </span>
      )}
    </div>
  );
}
