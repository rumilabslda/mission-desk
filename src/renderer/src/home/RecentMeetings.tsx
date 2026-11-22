import type { MeetingListItem, MeetingState } from '../../../shared/meeting';
import { intlLocale, type MessageKey, t } from '../i18n';

const STATE: Record<MeetingState, MessageKey> = {
  transcribing: 'meetings.state.transcribing',
  notRun: 'meetings.state.notRun',
  running: 'meetings.state.running',
  ready: 'meetings.state.ready',
  failed: 'meetings.state.failed',
};
const timeFmt = new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' });
const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Home's card: today's transcribed meetings and where each stands. */
export function RecentMeetings({ items }: { items: MeetingListItem[] }): React.JSX.Element | null {
  const today = items.filter((m) => sameDay(new Date(m.startedAt), new Date()));
  if (today.length === 0) return null;
  return (
    <section className="td-card td-meetings">
      <div className="td-head">
        <h2>{t('meetings.recent.title')}</h2>
        <button type="button" className="td-link" onClick={() => window.missiondesk.openMeetings()}>
          {t('meetings.recent.seeAll')}
        </button>
      </div>
      <ul>
        {today.map((m) => (
          <li key={m.id}>
            <button type="button" className="td-meeting" onClick={() => window.missiondesk.openMeetings(m.scope, m.id)}>
              <span className="td-meeting-time">{timeFmt.format(new Date(m.startedAt))}</span>
              <span className="td-meeting-title">{m.title}</span>
              <span className={`td-meeting-state ${m.state}`}>{t(STATE[m.state])}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
