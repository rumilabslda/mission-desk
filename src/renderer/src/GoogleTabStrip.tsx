import type { UiSnapshot } from '../../shared/ipc';
import type { ServiceId, ViewKind } from '../../shared/types';
import { t } from './i18n';
import { LOGOS } from './logos';

const TAB_LOGO: Partial<Record<ServiceId, Partial<Record<ViewKind, string>>>> = {
  google: { main: LOGOS.gmail, calendar: LOGOS.calendar, drive: LOGOS.drive, meet: LOGOS.meet },
  microsoft: { main: LOGOS.outlookMail, calendar: LOGOS.outlookCalendar, teams: LOGOS.teams },
};

function offsiteTitle(host: string, app: string | undefined): string {
  return app ? t('app.tab.offsite', { host, app }) : t('app.tab.offsiteNoName', { host });
}

export function GoogleTabStrip({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element | null {
  const id = snapshot.calendarOpen || snapshot.settingsOpen || snapshot.todayOpen ? null : snapshot.activeAccountId;
  const tabs = id ? snapshot.googleTabs[id] : undefined;
  if (!id || !tabs) return null;
  const service = snapshot.accounts.find((a) => a.id === id)?.service;
  const logos = service ? (TAB_LOGO[service] ?? {}) : {};
  return (
    <div className="tabstrip" role="tablist">
      {tabs.tabs.map((tab) => {
        const extra = tab.id.startsWith('extra:');
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tabs.active === tab.id}
            className={`tab${tabs.active === tab.id ? ' active' : ''}${extra ? ' extra' : ''}`}
            title={tab.title}
            onClick={() => window.missiondesk.selectGoogleTab(id, tab.id)}
            onAuxClick={(e) => {
              if (extra && e.button === 1) window.missiondesk.closeGoogleTab(id, tab.id as `extra:${number}`);
            }}
          >
            {logos[tab.id] && <img className="tab-logo" src={logos[tab.id]} alt="" draggable={false} />}
            <span className="tab-title">{tab.title}</span>
            {extra && (
              <button
                className="tab-close"
                aria-label={t('app.tab.close', { title: tab.title })}
                onClick={(e) => {
                  e.stopPropagation();
                  window.missiondesk.closeGoogleTab(id, tab.id as `extra:${number}`);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {tabs.offsite && (
        <span className="tab-offsite" title={offsiteTitle(tabs.offsite, snapshot.accounts.find((a) => a.id === id)?.name)}>
          {tabs.offsite}
        </span>
      )}
    </div>
  );
}
