import { useMemo, useState } from 'react';
import type { AccountView } from '../../../shared/ipc';
import { type JoinLink, type MeetingProvider, PROVIDER_NAME } from '../../../shared/meetings';
import { agendaView, clashes, timelineView } from '../../../shared/today';
import type { AccountCalendarStatus, CalEvent } from '../../../shared/types';
import { LOGOS } from '../logos';
import { Timeline } from './Timeline';

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

const PROVIDER_LOGO: Partial<Record<MeetingProvider, string>> = { meet: LOGOS.meet, teams: LOGOS.teams, zoom: LOGOS.zoom, chime: LOGOS.chime };
const logoOf = (j: JoinLink): string => PROVIDER_LOGO[j.provider] ?? LOGOS.video;

/** "12 min", "1 h 5 min", "2 h". */
function span(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return mins % 60 ? `${h} h ${mins % 60} min` : `${h} h`;
}

/** "Now · ends in 20 min", "In 12 min", "Starting now". */
function when(now: Date, e: CalEvent): { text: string; soon: boolean; live: boolean } {
  const t = now.getTime();
  const s = Date.parse(e.start);
  if (s <= t) return { text: `Ends in ${span(Date.parse(e.end) - t)}`, soon: true, live: true };
  if (s - t < 60_000) return { text: 'Starting now', soon: true, live: false };
  return { text: `In ${span(s - t)}`, soon: s - t <= 10 * 60_000, live: false };
}

const PROBLEM: Record<string, string> = { 'signed-out': 'signed out', offline: 'offline', error: "couldn't load" };

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
      m.set(a.id, (m.get(a.id) ?? new Set()).add(accounts.get(b.accountId)?.name ?? 'another account'));
      m.set(b.id, (m.get(b.id) ?? new Set()).add(accounts.get(a.accountId)?.name ?? 'another account'));
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
      {e.response === 'needsAction' ? ' · not answered' : ''}
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
            <button className="ag-title" onClick={() => window.missiondesk.openCalendar()} title="Open in All calendars">
              {e.title}
            </button>
            <span className="ag-time">
              {timeFmt.format(new Date(e.start))} – {timeFmt.format(new Date(e.end))}
            </span>
            {meta(e)}
            {clash && <span className="ag-clash">Clash with {[...clash].join(', ')}</span>}
          </div>
          {e.join && (
            <button className="ag-join" onClick={() => join(e)} title={e.join.url}>
              Join {PROVIDER_NAME[e.join.provider]}
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
          <small>{ongoing ? 'now' : timeFmt.format(new Date(e.end))}</small>
        </span>
        <span className="ag-bar" style={{ background: color(e) }} />
        <button className="ag-row-main" onClick={() => window.missiondesk.openCalendar()} title="Open in All calendars">
          <span className="ag-row-title">{e.title}</span>
          {meta(e)}
          {clashWith.get(e.id) && <span className="ag-clash">Clash with {[...clashWith.get(e.id)!].join(', ')}</span>}
        </button>
        {e.join && !cls.includes('past') && (
          <button className="ag-join-icon" onClick={() => join(e)} title={`Join ${PROVIDER_NAME[e.join.provider]}`} aria-label={`Join ${PROVIDER_NAME[e.join.provider]}`}>
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
        <h2>Agenda</h2>
        {hasGoogle && (
          <button className="td-link" onClick={() => window.missiondesk.openCalendar()}>
            Open calendar
          </button>
        )}
      </div>
      {!hasGoogle && <p className="td-muted">Add a Google account to see your meetings here.</p>}
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
                {accounts.get(x.accountId)?.name}'s calendar: {PROBLEM[x.state] ?? x.state}. Some meetings may be missing.
              </button>
            </li>
          ))}
        </ul>
      )}

      {v.current.map((e) => hero(e, 'Now'))}
      {v.next &&
        (v.current.length === 0 ? (
          hero(v.next, 'Up next')
        ) : (
          <>
            <div className="ag-sub">
              <h3>Up next</h3>
              <span className={`ag-when${when(now, v.next).soon ? ' soon' : ''}`}>{when(now, v.next).text.toLowerCase()}</span>
            </div>
            <ul className="ag-list">{row(v.next, ' next')}</ul>
          </>
        ))}

      {hasGoogle && loaded && (showTimeline || tl.earlier > 0) && (
        <>
          <div className="ag-sub">
            <h3>{showEarlier || showLater ? 'Today' : 'Next hours'}</h3>
            {(tl.earlier > 0 || showEarlier) && (
              <button className="td-link" onClick={() => setShowEarlier((x) => !x)}>
                {showEarlier ? 'Hide earlier' : `Earlier today (${tl.earlier})`}
              </button>
            )}
          </div>
          {showTimeline && <Timeline view={tl} now={now} color={color} />}
          {(tl.later > 0 || showLater) && (
            <button className="td-link ag-later" onClick={() => setShowLater((x) => !x)}>
              {showLater ? 'Show less' : `${tl.later} more later today`}
            </button>
          )}
        </>
      )}

      {hasGoogle && loaded && nothingNow && problems.length === 0 && (
        <div className="ag-empty">
          <p>No more meetings today.</p>
          {v.tomorrow.length > 0 && (
            <>
              <h3>Tomorrow</h3>
              <ul className="ag-list">{v.tomorrow.slice(0, 3).map((e) => row(e))}</ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
