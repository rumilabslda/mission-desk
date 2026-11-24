import type { Meeting } from '../../../shared/meeting';
import { t } from '../i18n';
import { stamp } from './format';

const KIND_KEY = { past: 'meetings.insights.kind.past', commitment: 'meetings.insights.kind.commitment', contradiction: 'meetings.insights.kind.contradiction' } as const;

/** The whole transcript, with who spoke and where transcription was interrupted, and the meeting's insights. */
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
        {meeting.insights && meeting.insights.length > 0 && (
          <section className="mt-insights">
            <h3>{t('meetings.transcript.insights')}</h3>
            <ul>
              {meeting.insights.map((i) => (
                <li key={i.id} className={i.notUseful ? 'not-useful' : undefined}>
                  <p>
                    [{stamp(i.at)}] {t(KIND_KEY[i.kind])}: {i.text}
                    {i.notUseful && <small> · {t('meetings.insights.notUseful')}</small>}
                  </p>
                  {i.sources.map((s, n) => (
                    <p key={n} className="mt-muted">
                      {s.label}: “{s.text}”
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        )}
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
