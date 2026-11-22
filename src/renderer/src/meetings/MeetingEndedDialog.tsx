import { useState } from 'react';
import { MEETING_ACTIONS, type MeetingAction, type MeetingEndedInfo } from '../../../shared/meeting';
import { intlLocale, type MessageKey, t } from '../i18n';

const LABEL: Record<MeetingAction, [MessageKey, MessageKey]> = {
  summary: ['meetings.action.summary', 'meetings.action.summaryHint'],
  myTodos: ['meetings.action.myTodos', 'meetings.action.myTodosHint'],
  waitingOn: ['meetings.action.waitingOn', 'meetings.action.waitingOnHint'],
  email: ['meetings.action.email', 'meetings.action.emailHint'],
  memory: ['meetings.action.memory', 'meetings.action.memoryHint'],
  event: ['meetings.action.event', 'meetings.action.eventHint'],
};

const languageName = (l: string): string => {
  try {
    return new Intl.DisplayNames([intlLocale()], { type: 'language' }).of(l) ?? l;
  } catch {
    return l;
  }
};

/** "The meeting ended": what to do with the transcript, as the space last chose. */
export function MeetingEndedDialog({ info, onClose }: { info: MeetingEndedInfo; onClose(): void }): React.JSX.Element {
  const [ticked, setTicked] = useState<MeetingAction[]>(info.defaults);
  const toggle = (a: MeetingAction): void => setTicked(ticked.includes(a) ? ticked.filter((x) => x !== a) : [...ticked, a]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog me-dialog" role="dialog" aria-labelledby="me-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2 id="me-title">{t('meetings.ended.title')}</h2>
        <p className="me-sub">{t('meetings.ended.subtitle', { space: info.spaceName, title: info.title, minutes: String(info.minutes), language: languageName(info.language) })}</p>
        {info.askAvailable ? (
          <>
            <p className="me-intro">{t('meetings.ended.intro')}</p>
            <div className="me-actions">
              {MEETING_ACTIONS.map((a) => (
                <label key={a} className="me-action">
                  <input type="checkbox" checked={ticked.includes(a)} onChange={() => toggle(a)} />
                  <span>
                    <strong>{t(LABEL[a][0])}</strong>
                    <small>{t(LABEL[a][1])}</small>
                  </span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="me-intro">{t('meetings.ended.noAssistant')}</p>
        )}
        <div className="actions">
          <button type="button" onClick={onClose}>
            {t('meetings.ended.notNow')}
          </button>
          {info.askAvailable ? (
            <button
              type="button"
              className="primary"
              disabled={ticked.length === 0}
              onClick={() => {
                window.missiondesk.meetingRun(info.scope, info.id, MEETING_ACTIONS.filter((a) => ticked.includes(a)));
                onClose();
              }}
            >
              {t('meetings.ended.run')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              onClick={() => {
                window.missiondesk.openSettings('assistant');
                onClose();
              }}
            >
              {t('meetings.ended.setUp')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
