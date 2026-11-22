import { useEffect, useState } from 'react';
import type { UiSnapshot } from '../../../shared/ipc';
import { MEETING_LOCALES, type LiveMeeting } from '../../../shared/meeting';
import { intlLocale, t } from '../i18n';

const languageName = (locale: string): string => {
  try {
    return new Intl.DisplayNames([intlLocale()], { type: 'language' }).of(locale) ?? locale;
  } catch {
    return locale;
  }
};

interface Props {
  live: LiveMeeting | null;
  asking: { title: string; switchTo: boolean } | null;
  spaceName: string;
  localeInstall: { locale: string; fraction: number } | null;
}

/** The bar over a meeting view: Ask, or the live transcription's state and controls. */
export function MeetingBarView({ live, asking, spaceName, localeInstall }: Props): React.JSX.Element | null {
  const md = window.missiondesk;
  const [copied, setCopied] = useState(false);
  /** The meeting whose notice was copied (the button stands out until then). */
  const [noticed, setNoticed] = useState<string | null>(null);
  if (asking) {
    return (
      <div className="mb-bar">
        <span className="mb-dot ask" aria-hidden />
        <span className="mb-text">{asking.switchTo ? t('meetings.bar.askSwitch') : t('meetings.bar.ask')}</span>
        <button type="button" className="mb-primary" onClick={() => md.meetingAnswer(true, false)}>
          {t('meetings.bar.yes')}
        </button>
        <button type="button" onClick={() => md.meetingAnswer(false, false)}>
          {t('meetings.bar.no')}
        </button>
        {!asking.switchTo && (
          <button type="button" onClick={() => md.meetingAnswer(false, true)}>
            {t('meetings.bar.never')}
          </button>
        )}
      </div>
    );
  }
  if (!live) return null;
  const n = live.notice;
  return (
    <div className={`mb-bar${n ? ' two' : ''}`}>
      <div className="mb-row">
        <span className={`mb-dot${live.paused ? ' paused' : ''}`} aria-hidden />
        <span className="mb-text">
          {live.paused ? t('meetings.bar.paused') : t('meetings.bar.transcribing')} · {spaceName}
        </span>
        <select className="mb-lang" aria-label={t('meetings.bar.language')} value={live.language} onChange={(e) => md.meetingSetLanguage(e.target.value)}>
          {[...new Set([live.language, ...MEETING_LOCALES])].map((l) => (
            <option key={l} value={l}>
              {languageName(l)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => (live.paused ? md.meetingResume() : md.meetingPause())}>
          {live.paused ? t('meetings.bar.resume') : t('meetings.bar.pause')}
        </button>
        <button type="button" onClick={() => md.meetingStop()}>
          {t('meetings.bar.stop')}
        </button>
        <button
          type="button"
          className={`mb-notice${noticed === live.id ? '' : ' fresh'}`}
          onClick={() => {
            md.meetingCopyNotice();
            setNoticed(live.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? t('meetings.bar.copied') : t('meetings.bar.copyNotice')}
        </button>
      </div>
      {n && (
        <div className="mb-row mb-sub">
          <span>{n.text}</span>
          {n.code === 'localeMissing' && n.locale &&
            (localeInstall?.locale === n.locale ? (
              <span>{t('meetings.bar.downloading', { language: languageName(n.locale), percent: `${Math.round(localeInstall.fraction * 100)}%` })}</span>
            ) : (
              <button type="button" onClick={() => md.meetingInstallLocale(n.locale!)}>
                {t('meetings.bar.download', { language: languageName(n.locale) })}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/** The #meeting-bar page: follows the snapshot. */
export function MeetingBar(): React.JSX.Element | null {
  const [snap, setSnap] = useState<UiSnapshot | null>(null);
  useEffect(() => {
    void window.missiondesk.getSnapshot().then((s) => s && setSnap(s));
    return window.missiondesk.onSnapshot(setSnap);
  }, []);
  if (!snap) return null;
  const m = snap.meetings;
  const scope = m.asking ? m.asking.scope : m.live?.scope;
  const spaceName = snap.assistant.scopes.find((s) => s.key === scope)?.name ?? '';
  return <MeetingBarView live={m.live} asking={m.asking} spaceName={spaceName} localeInstall={m.localeInstall} />;
}
