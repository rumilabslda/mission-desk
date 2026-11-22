import { useEffect, useState } from 'react';
import { MEETING_ACTIONS, type Meeting, type MeetingAction, type MeetingListItem } from '../../../shared/meeting';
import type { Todo } from '../../../shared/types';
import { type MessageKey, t } from '../i18n';
import { MeetingEndedDialog } from './MeetingEndedDialog';
import { TranscriptView } from './TranscriptView';

const SUMMARY_PARTS: ['decisions' | 'points' | 'nextSteps', MessageKey][] = [
  ['decisions', 'meetings.section.decisions'],
  ['points', 'meetings.section.points'],
  ['nextSteps', 'meetings.section.nextSteps'],
];

/** A transcribed meeting: its summary, to-dos, draft and proposals, and what can still be run. */
export function MeetingSection({ item, todos, spaceName, defaults }: { item: MeetingListItem; todos: Todo[]; spaceName: string; defaults: MeetingAction[] }): React.JSX.Element {
  const md = window.missiondesk;
  const [m, setM] = useState<Meeting | null>(null);
  const [dialog, setDialog] = useState(false);
  const [transcript, setTranscript] = useState(false);

  useEffect(() => {
    let live = true;
    void md.meetingGet(item.scope, item.id).then((x) => live && setM(x));
    return () => {
      live = false;
    };
  }, [item.scope, item.id, item.state]);

  if (!m) return <div className="mt-section">{t('meetings.section.loading')}</div>;
  const r = m.result;
  const notRun = MEETING_ACTIONS.filter((a) => !(m.applied ?? []).includes(a));
  /** Ticked in the dialog: the space's usual choices that haven't run yet. */
  const remaining = defaults.filter((a) => notRun.includes(a));
  const mine = todos.filter((x) => x.meetingId === m.id);
  return (
    <div className="mt-section">
      {item.state === 'transcribing' && <p className="mt-muted">{t('meetings.section.transcribing')}</p>}
      {item.state === 'running' && <p className="mt-muted">{t('meetings.section.running')}</p>}
      {item.state === 'failed' && <p className="mt-error">{t('meetings.section.failed', { reason: item.error ?? '' })}</p>}
      {item.state === 'notRun' && !r && <p className="mt-muted">{t('meetings.section.notRun')}</p>}
      {r?.summary &&
        SUMMARY_PARTS.map(([k, label]) =>
          r.summary![k].length ? (
            <div key={k} className="mt-part">
              <strong>{t(label)}</strong>
              <ul>
                {r.summary![k].map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      {mine.length > 0 && (
        <div className="mt-part">
          <strong>{t('meetings.section.todos')}</strong>
          <ul>
            {mine.map((x) => (
              <li key={x.id} className={x.done ? 'done' : undefined}>
                {x.waitingOn ? `${t('meetings.section.waitingOn', { who: x.waitingOn })}: ${x.text}` : x.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(r?.memoryNotes?.length || r?.followUpEvent) && (
        <div className="mt-part">
          <strong>{t('meetings.section.proposals')}</strong>
          <ul>
            {r?.memoryNotes?.map((n, i) => (
              <li key={i} className="mt-proposal">
                <span>{n}</span>
                <button type="button" className="mt-link" onClick={() => md.meetingSaveNote(m.scope, m.id, i)}>
                  {t('meetings.section.saveNote')}
                </button>
              </li>
            ))}
            {r?.followUpEvent && (
              <li className="mt-proposal">
                <span>
                  {r.followUpEvent.title} · {new Date(r.followUpEvent.start).toLocaleString()}
                </span>
                <button type="button" className="mt-link" onClick={() => md.meetingCreateEvent(m.scope, m.id)}>
                  {t('meetings.section.createEvent')}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      <div className="mt-buttons">
        {r?.email && (
          <button type="button" className="primary" onClick={() => md.meetingOpenDraft(m.scope, m.id)}>
            {t('meetings.section.openDraft')}
          </button>
        )}
        {r?.summary && (
          <button type="button" onClick={() => md.meetingCopySummary(m.scope, m.id)}>
            {t('meetings.section.copySummary')}
          </button>
        )}
        {m.segments.length > 0 && (
          <button type="button" onClick={() => setTranscript(true)}>
            {t('meetings.section.transcript')}
          </button>
        )}
        {item.state !== 'transcribing' && item.state !== 'running' && (notRun.length > 0 || item.state === 'failed') && (
          <button type="button" onClick={() => setDialog(true)}>
            {item.state === 'failed' ? t('meetings.section.tryAgain') : t('meetings.section.run')}
          </button>
        )}
        {item.state !== 'transcribing' && (
          <button type="button" className="mt-danger" onClick={() => md.meetingDelete(m.scope, m.id)}>
            {t('meetings.section.delete')}
          </button>
        )}
      </div>
      {dialog && (
        <MeetingEndedDialog
          info={{ scope: m.scope, id: m.id, title: m.title, minutes: item.minutes, language: m.language, spaceName, defaults: item.state === 'failed' ? (m.actions ?? remaining) : remaining, askAvailable: true }}
          onClose={() => setDialog(false)}
        />
      )}
      {transcript && <TranscriptView meeting={m} onClose={() => setTranscript(false)} />}
    </div>
  );
}
