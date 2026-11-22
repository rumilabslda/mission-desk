import type { Meeting } from '../../../shared/meeting';
import { t } from '../i18n';
import { stamp } from './format';

/** The whole transcript, with who spoke and where transcription was interrupted. */
export function TranscriptView({ meeting, onClose }: { meeting: Meeting; onClose(): void }): React.JSX.Element {
  const speaker = (s: string): string => (s === 'me' ? t('meetings.transcript.me') : s === 'others' ? t('meetings.transcript.others') : s);
  const rows: { at: number; text: string; gap?: boolean }[] = [
    ...meeting.segments.map((s) => ({ at: s.start, text: `[${stamp(s.start)}] ${speaker(s.speaker)}: ${s.text}` })),
    ...meeting.gaps.map((g) => ({ at: g.start, gap: true, text: t('meetings.transcript.gap', { from: stamp(g.start), to: stamp(g.end) }) })),
  ].sort((a, b) => a.at - b.at);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog mt-transcript" role="dialog" aria-label={t('meetings.transcript.title', { title: meeting.title })} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>{t('meetings.transcript.title', { title: meeting.title })}</h2>
        {meeting.transcriptPruned && <p className="mt-muted">{t('meetings.transcript.pruned')}</p>}
        <div className="mt-lines">
          {rows.map((r, i) => (
            <p key={i} className={r.gap ? 'mt-gap' : undefined}>
              {r.text}
            </p>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
