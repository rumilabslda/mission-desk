import type { AccountView } from '../../../shared/ipc';
import { t } from '../i18n';

type Acct = Pick<AccountView, 'id' | 'name' | 'service' | 'spaceId'>;

/** Whether each Google account's calendar shows in All calendars (⌘0): one switch, or one per account. */
/** `named`: always say which account (a card that doesn't name it, like the apps outside spaces). */
export function CalendarToggles({ accounts, hidden, named = false }: { accounts: Acct[]; hidden: string[]; named?: boolean }): React.JSX.Element | null {
  const google = accounts.filter((a) => a.service === 'google');
  if (google.length === 0) return null;
  return (
    <div className="set-toggles">
      {google.map((a) => (
        <label key={a.id} className="set-toggle">
          <input type="checkbox" checked={!hidden.includes(a.id)} onChange={(e) => window.missiondesk.setCalendarHidden(a.id, !e.target.checked)} />
          <span>
            {google.length === 1 && !named ? t('settings.calendar.show') : t('settings.calendar.showAccount', { name: a.name })}
            <small>{t('settings.calendar.showHint')}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

/** The Google accounts that aren't in any space, in Settings → Spaces. */
export function LooseCalendars({ accounts, hidden }: { accounts: Acct[]; hidden: string[] }): React.JSX.Element | null {
  const loose = accounts.filter((a) => !a.spaceId && a.service === 'google');
  if (loose.length === 0) return null;
  return (
    <div className="set-card">
      <div className="set-card-head">
        <strong>{t('settings.calendar.loose')}</strong>
      </div>
      <CalendarToggles accounts={loose} hidden={hidden} named />
    </div>
  );
}
