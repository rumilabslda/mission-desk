import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { UiSnapshot } from '../../../shared/ipc';
import { MEETING_LOCALES, type LiveInsights, type LiveMeeting, type MeetingInsight } from '../../../shared/meeting';
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
  /** What this bar was placed for (main decides: over the asking call, or over the live meeting). */
  mode?: 'ask' | 'live' | null;
}

/** The overlay's content; it tells main the height it needs (the card or the list make it taller). */
function Page({ children }: { children: React.ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let last = 0;
    const report = (): void => {
      const h = Math.max(36, Math.min(400, Math.ceil(el.offsetHeight)));
      if (h === last) return;
      last = h;
      window.missiondesk.meetingBarHeight(h);
    };
    const ro = new ResizeObserver(report);
    ro.observe(el);
    report();
    return () => ro.disconnect();
  }, []);
  return (
    <div className="mb-page" ref={ref}>
      {children}
    </div>
  );
}

const KIND_KEY = { past: 'meetings.insights.kind.past', commitment: 'meetings.insights.kind.commitment', contradiction: 'meetings.insights.kind.contradiction' } as const;

/** The newest insight, under the bar: hides after 20 s, but never while the pointer is over it. Never takes focus. */
function InsightCard({ insight, onClose }: { insight: MeetingInsight; onClose(): void }): React.JSX.Element {
  const md = window.missiondesk;
  const [hover, setHover] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setExpired(true), 20_000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (expired && !hover) onClose();
  }, [expired, hover, onClose]);
  return (
    <div
      className="mb-card"
      role="status"
      aria-live="polite"
      onMouseOver={() => setHover(true)}
      onMouseOut={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHover(false)}
    >
      <div className="mb-card-head">
        <span className="mb-kind">{t(KIND_KEY[insight.kind])}</span>
        <button type="button" className="mb-x" aria-label={t('meetings.insights.close')} onClick={onClose}>
          ×
        </button>
      </div>
      <p className="mb-card-text">{insight.text}</p>
      {insight.sources.map((s, i) => (
        <p key={i} className="mb-source">
          ▸ {s.label}: “{s.text}”
        </p>
      ))}
      {insight.ask && <p className="mb-ask">{t('meetings.insights.ask', { text: insight.ask })}</p>}
      <div className="mb-card-actions">
        <button type="button" onClick={() => md.meetingInsightOpen(insight.id, 0)}>
          {t('meetings.insights.openSource')}
        </button>
        <button
          type="button"
          onClick={() => {
            md.meetingInsightNotUseful(insight.id);
            onClose();
          }}
        >
          {t('meetings.insights.notUseful')}
        </button>
      </div>
    </div>
  );
}

/** Every insight of this meeting, newest first, and Pause insights. */
function InsightList({ insights }: { insights: LiveInsights }): React.JSX.Element {
  const md = window.missiondesk;
  return (
    <div className="mb-list">
      {insights.list.length === 0 ? (
        <p className="mb-empty">{t('meetings.insights.empty')}</p>
      ) : (
        <ul>
          {insights.list.map((i) => (
            <li key={i.id} className={i.notUseful ? 'not-useful' : undefined}>
              <span className="mb-kind">{t(KIND_KEY[i.kind])}</span>
              <span>{i.text}</span>
              {i.sources[0] && <small>{i.sources[0].label}</small>}
            </li>
          ))}
        </ul>
      )}
      <div className="mb-list-foot">
        {insights.state === 'paused' ? (
          <>
            <span>{insights.reason || t('meetings.insights.paused')}</span>
            <button type="button" onClick={() => md.meetingInsightsResume()}>
              {t('meetings.insights.resume')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => md.meetingInsightsPause()}>
            {t('meetings.insights.pause')}
          </button>
        )}
      </div>
    </div>
  );
}

/** The bar over a meeting view: Ask, or the live transcription's state and controls. */
export function MeetingBarView({ live, asking, spaceName, localeInstall, mode }: Props): React.JSX.Element | null {
  const md = window.missiondesk;
  const [copied, setCopied] = useState(false);
  /** The meeting whose notice was copied (the button stands out until then). */
  const [noticed, setNoticed] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  /** The insight whose card was closed (a newer one opens a new card). */
  const [dismissed, setDismissed] = useState<string | null>(null);
  // Another meeting: its bar starts closed (the overlay page outlives meetings).
  const [forMeeting, setForMeeting] = useState(live?.id ?? null);
  if ((live?.id ?? null) !== forMeeting) {
    setForMeeting(live?.id ?? null);
    setListOpen(false);
    setDismissed(null);
  }
  if (asking && mode !== 'live') {
    return (
      <Page>
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
      </Page>
    );
  }
  if (!live) return null;
  const n = live.notice;
  const ins = live.insights;
  const card = ins?.latest && ins.latest.id !== dismissed && !listOpen ? ins.latest : null;
  return (
    <Page>
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
        {ins && (
          <button
            type="button"
            className={`mb-insights${listOpen ? ' on' : ''}`}
            aria-expanded={listOpen}
            title={ins.state === 'unavailable' ? ins.reason || t('meetings.insights.unavailable') : ins.state === 'paused' ? ins.reason || t('meetings.insights.paused') : t('meetings.insights.title')}
            onClick={() => setListOpen((v) => !v)}
          >
            {ins.state === 'unavailable' ? '✦ —' : t('meetings.insights.count', { count: ins.count })}
          </button>
        )}
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
    {card && <InsightCard key={card.id} insight={card} onClose={() => setDismissed(card.id)} />}
    {ins && listOpen && <InsightList insights={ins} />}
    </Page>
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
  const scope = m.barMode === 'ask' && m.asking ? m.asking.scope : (m.live?.scope ?? m.asking?.scope);
  const spaceName = snap.assistant.scopes.find((s) => s.key === scope)?.name ?? '';
  return <MeetingBarView live={m.live} asking={m.asking} spaceName={spaceName} localeInstall={m.localeInstall} mode={m.barMode} />;
}
