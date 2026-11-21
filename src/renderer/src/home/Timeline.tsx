import { type JoinLink, type MeetingProvider, PROVIDER_NAME } from '../../../shared/meetings';
import type { TimelineView } from '../../../shared/today';
import type { CalEvent } from '../../../shared/types';
import { LOGOS } from '../logos';

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const PROVIDER_LOGO: Partial<Record<MeetingProvider, string>> = { meet: LOGOS.meet, teams: LOGOS.teams, zoom: LOGOS.zoom, chime: LOGOS.chime };
const logoOf = (j: JoinLink): string => PROVIDER_LOGO[j.provider] ?? LOGOS.video;

/** Pixels per minute: four and a half hours come to about 330 px. */
const PX = 1.15;
/** Short meetings still get room for one line of text. */
const MIN_HEIGHT = 20;

/** "45 min", "1 h", "1 h 15". */
function free(mins: number): string {
  const m = Math.round(mins);
  if (m < 60) return `${m} min`;
  return m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`;
}

/** Today's meetings on a time scale around now, so the gaps between them show. */
export function Timeline({ view, now, color }: { view: TimelineView; now: Date; color(e: CalEvent): string }): React.JSX.Element {
  const start = view.start.getTime();
  const total = (view.end.getTime() - start) / 60_000;
  const y = (min: number): number => min * PX;
  const nowMin = (now.getTime() - start) / 60_000;

  // A line at each full hour inside the window.
  const hours: number[] = [];
  const first = new Date(start);
  first.setMinutes(0, 0, 0);
  if (first.getTime() < start) first.setHours(first.getHours() + 1);
  for (const h = first; h.getTime() <= view.end.getTime(); h.setHours(h.getHours() + 1)) hours.push((h.getTime() - start) / 60_000);

  return (
    <div className="tl" style={{ height: y(total) }}>
      {hours.map((m) => (
        <div key={m} className="tl-hour" style={{ top: y(m) }}>
          <span>{timeFmt.format(new Date(start + m * 60_000))}</span>
        </div>
      ))}
      {nowMin > 0 && <div className="tl-past" style={{ height: y(Math.min(nowMin, total)) }} />}

      {view.gaps.map((g) => (
        <div key={g.top} className="tl-gap" style={{ top: y(g.top), height: y(g.bottom - g.top) }}>
          <span>{g.open ? 'Free' : `${free(g.bottom - g.top)} free`}</span>
        </div>
      ))}

      {view.blocks.map(({ event: e, top, bottom, col, cols }) => {
        const past = Date.parse(e.end) <= now.getTime();
        const h = Math.max(MIN_HEIGHT, y(bottom - top) - 2);
        const range = `${timeFmt.format(new Date(e.start))} – ${timeFmt.format(new Date(e.end))}`;
        return (
          <div
            key={e.id}
            className={`tl-ev${past ? ' past' : ''}${e.free ? ' free' : ''}${h >= 36 ? ' tall' : ''}`}
            style={{
              top: y(top) + 1,
              height: h,
              left: `calc(var(--tl-gutter) + (100% - var(--tl-gutter)) * ${col / cols})`,
              width: `calc((100% - var(--tl-gutter)) / ${cols} - 3px)`,
              ['--c' as string]: color(e),
            }}
          >
            <button className="tl-ev-main" onClick={() => window.missiondesk.openCalendar()} title={`${e.title} · ${range}`}>
              <span className="tl-ev-title">{e.title}</span>
              <span className="tl-ev-time">{range}</span>
            </button>
            {e.join && !past && (
              <button
                className="tl-join"
                onClick={() => window.missiondesk.joinMeeting(e.accountId, e.join!.url)}
                title={`Join ${PROVIDER_NAME[e.join.provider]}`}
                aria-label={`Join ${PROVIDER_NAME[e.join.provider]}`}
              >
                <img src={logoOf(e.join)} alt="" draggable={false} />
              </button>
            )}
          </div>
        );
      })}

      {nowMin >= 0 && nowMin <= total && <div className="tl-now" style={{ top: y(nowMin) }} />}
    </div>
  );
}
