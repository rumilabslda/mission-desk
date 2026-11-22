import { useMemo, useState } from 'react';
import type { AccountView } from '../../../shared/ipc';
import { type JoinLink, type MeetingProvider, PROVIDER_NAME } from '../../../shared/meetings';
import { agendaView, clashes, timelineView } from '../../../shared/today';
import type { AccountCalendarStatus, CalEvent } from '../../../shared/types';
import { intlLocale, type MessageKey, t } from '../i18n';
import { LOGOS } from '../logos';
import { Timeline } from './Timeline';

const timeFmt = new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' });

const PROVIDER_LOGO: Partial<Record<MeetingProvider, string>> = { meet: LOGOS.meet, teams: LOGOS.teams, zoom: LOGOS.zoom, chime: LOGOS.chime };
const logoOf = (j: JoinLink): string => PROVIDER_LOGO[j.provider] ?? LOGOS.video;

/** "12 min", "1 h 5 min", "2 h". */
function span(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return t('home.duration.minutes', { count: mins });
  const h = Math.floor(mins / 60);
  return mins % 60 ? t('home.duration.hoursMinutes', { hours: h, minutes: mins % 60 }) : t('home.duration.hours', { count: h });
}

/** "Ends in 20 min", "In 12 min", "Starting now"; `sub`: in lower case, after a heading ("in 12 min"). */
function when(now: Date, e: CalEvent, sub = false): { text: string; soon: boolean; live: boolean } {
  const n = now.getTime();
  const s = Date.parse(e.start);
  if (s <= n) return { text: t(sub ? 'home.agenda.endsInSub' : 'home.agenda.endsIn', { duration: span(Date.parse(e.end) - n) }), soon: true, live: true };
  if (s - n < 60_000) return { text: t(sub ? 'home.agenda.startingNowSub' : 'home.agenda.startingNow'), soon: true, live: false };
  return { text: t(sub ? 'home.agenda.startsInSub' : 'home.agenda.startsIn', { duration: span(s - n) }), soon: s - n <= 10 * 60_000, live: false };
}

const PROBLEM: Record<AccountCalendarStatus['state'], MessageKey | null> = {
  ok: null,
  'signed-out': 'home.agenda.problemSignedOut',
  offline: 'home.agenda.problemOffline',
  error: 'home.agenda.problemError',
};

export function Agenda({
  events,
  status,
  loaded,
  accounts,
  hasGoogle,
  colors,
  now,
}: {
  events: CalEvent[];
  status: AccountCalendarStatus[];
  loaded: boolean;
  accounts: Map<string, AccountView>;
  hasGoogle: boolean;
  colors: Map<string, string>;
  now: Date;
}): React.JSX.Element {
  const [showEarlier, setShowEarlier] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const v = useMemo(() => agendaView(events, now), [events, now]);
  const tl = useMemo(() => timelineView(events, now, { earlier: showEarlier, later: showLater }), [events, now, showEarlier, showLater]);
  const clashWith = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of clashes(events)) {
      m.set(a.id, (m.get(a.id) ?? new Set()).add(accounts.get(b.accountId)?.name ?? t('home.agenda.anotherAccount')));
      m.set(b.id, (m.get(b.id) ?? new Set()).add(accounts.get(a.accountId)?.name ?? t('home.agenda.anotherAccount')));
    }
    return m;
  }, [events, accounts]);
  const problems = status.filter((x) => x.state !== 'ok' && accounts.has(x.accountId));
  const color = (e: CalEvent): string => colors.get(e.accountId) ?? accounts.get(e.accountId)?.color ?? '#888';
  const join = (e: CalEvent): void => {
    if (e.join) window.missiondesk.joinMeeting(e.accountId, e.join.url);
  };
  // A plain address in "location" (not the meeting link itself).
  const place = (e: CalEvent): string | undefined => (e.location && !/^https?:\/\//.test(e.location.trim()) ? e.location : undefined);

  const meta = (e: CalEvent) => (
    <span className="ag-meta">
      <span className="ag-dot" style={{ background: color(e) }} />
      {accounts.get(e.accountId)?.name}
      {place(e) ? ` · ${place(e)}` : ''}
      {e.response === 'needsAction' ? ` · ${t('home.agenda.notAnswered')}` : ''}
    </span>
  );

  const hero = (e: CalEvent, label: string) => {
    const w = when(now, e);
    const clash = clashWith.get(e.id);
    return (
      <div key={e.id} className={`ag-hero${w.live ? ' live' : ''}${w.soon ? ' soon' : ''}`} style={{ ['--c' as string]: color(e) }}>
        <div className="ag-hero-top">
          <span className="ag-label">{label}</span>
          <span className="ag-when">{w.text}</span>
        </div>
        <div className="ag-hero-body">
          {e.join ? (
            <img className="ag-hero-logo" src={logoOf(e.join)} alt="" draggable={false} />
          ) : (
            <span className="ag-hero-logo none" aria-hidden="true">
              {timeFmt.format(new Date(e.start))}
            </span>
          )}
          <div className="ag-hero-text">
            <button className="ag-title" onClick={() => window.missiondesk.openCalendar()} title={t('home.agenda.openInCalendars')}>
              {e.title}
            </button>
            <span className="ag-time">
              {timeFmt.format(new Date(e.start))} – {timeFmt.format(new Date(e.end))}
            </span>
            {meta(e)}
            {clash && <span className="ag-clash">{t('home.agenda.clashWith', { names: [...clash].join(', ') })}</span>}
          </div>
          {e.join && (
            <button className="ag-join" onClick={() => join(e)} title={e.join.url}>
              {t('home.agenda.join', { provider: PROVIDER_NAME[e.join.provider] })}
            </button>
          )}
        </div>
      </div>
    );
  };

  const row = (e: CalEvent, cls = '') => {
    const ongoing = Date.parse(e.start) <= now.getTime() && Date.parse(e.end) > now.getTime();
    return (
      <li key={e.id} className={`ag-row${cls}${e.free ? ' free' : ''}`}>
        <span className="ag-row-time">
          {timeFmt.format(new Date(e.start))}
          <small>{ongoing ? t('home.agenda.rowNow') : timeFmt.format(new Date(e.end))}</small>
        </span>
        <span className="ag-bar" style={{ background: color(e) }} />
        <button className="ag-row-main" onClick={() => window.missiondesk.openCalendar()} title={t('home.agenda.openInCalendars')}>
          <span className="ag-row-title">{e.title}</span>
          {meta(e)}
          {clashWith.get(e.id) && <span className="ag-clash">{t('home.agenda.clashWith', { names: [...clashWith.get(e.id)!].join(', ') })}</span>}
        </button>
        {e.join && !cls.includes('past') && (
          <button className="ag-join-icon" onClick={() => join(e)} title={t('home.agenda.join', { provider: PROVIDER_NAME[e.join.provider] })} aria-label={t('home.agenda.join', { provider: PROVIDER_NAME[e.join.provider] })}>
            <img src={logoOf(e.join)} alt="" draggable={false} />
          </button>
        )}
      </li>
    );
  };

  const nothingNow = v.current.length === 0 && !v.next;
  // The timeline once there's something on it (or after it, or asked for).
  const showTimeline = tl.blocks.length > 0 || tl.later > 0 || showEarlier;
  return (
    <section className="td-card td-agenda">
      <div className="ag-head">
        <h2>{t('home.agenda.title')}</h2>
        {hasGoogle && (
          <button className="td-link" onClick={() => window.missiondesk.openCalendar()}>
            {t('home.agenda.openCalendar')}
          </button>
        )}
      </div>
      {!hasGoogle && <p className="td-muted">{t('home.agenda.noGoogle')}</p>}
      {v.allDay.length > 0 && (
        <div className="td-allday">
          {v.allDay.map((e) => (
            <span key={e.id} className="td-chip" style={{ ['--c' as string]: color(e) }}>
              {e.title}
            </span>
          ))}
        </div>
      )}
      {problems.length > 0 && (
        <ul className="td-problems">
          {problems.map((x) => (
            <li key={x.accountId}>
              <button onClick={() => window.missiondesk.selectAccount(x.accountId)}>
                {t(PROBLEM[x.state] ?? 'home.agenda.problemError', { name: accounts.get(x.accountId)?.name ?? '' })}
              </button>
            </li>
          ))}
        </ul>
      )}

      {v.current.map((e) => hero(e, t('home.agenda.now')))}
      {v.next &&
        (v.current.length === 0 ? (
          hero(v.next, t('home.agenda.upNext'))
        ) : (
          <>
            <div className="ag-sub">
              <h3>{t('home.agenda.upNext')}</h3>
              <span className={`ag-when${when(now, v.next).soon ? ' soon' : ''}`}>{when(now, v.next, true).text}</span>
            </div>
            <ul className="ag-list">{row(v.next, ' next')}</ul>
          </>
        ))}

      {hasGoogle && loaded && (showTimeline || tl.earlier > 0) && (
        <>
          <div className="ag-sub">
            <h3>{showEarlier || showLater ? t('common.today') : t('home.agenda.nextHours')}</h3>
            {(tl.earlier > 0 || showEarlier) && (
              <button className="td-link" onClick={() => setShowEarlier((x) => !x)}>
                {showEarlier ? t('home.agenda.hideEarlier') : t('home.agenda.earlierToday', { count: tl.earlier })}
              </button>
            )}
          </div>
          {showTimeline && <Timeline view={tl} now={now} color={color} />}
          {(tl.later > 0 || showLater) && (
            <button className="td-link ag-later" onClick={() => setShowLater((x) => !x)}>
              {showLater ? t('home.agenda.showLess') : t('home.agenda.laterToday', { count: tl.later })}
            </button>
          )}
        </>
      )}

      {hasGoogle && loaded && nothingNow && problems.length === 0 && (
        <div className="ag-empty">
          <p>{t('home.agenda.noMore')}</p>
          {v.tomorrow.length > 0 && (
            <>
              <h3>{t('common.tomorrow')}</h3>
              <ul className="ag-list">{v.tomorrow.slice(0, 3).map((e) => row(e))}</ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
