import { useLayoutEffect, useRef, useState } from 'react';
import type { CalEvent } from '../../../shared/types';
import type { Owner } from './CalendarView';
import { sameDay } from './dates';
import { eventTimes, isAllDayLike, monthCell } from './layout';
import { eventClass } from './TimeGrid';
import { intlLocale, t } from '../i18n';

const ROW_PX = 22;
const timeFmt = new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'short' });

interface Props {
  days: Date[];
  month: number;
  events: CalEvent[];
  owners: Map<string, Owner>;
  onEvent(e: CalEvent, el: HTMLElement): void;
  onDay(d: Date): void;
  /** A click on the empty part of a day: create an all-day event. */
  onCreateDay(d: Date, x: number, y: number): void;
}

export function MonthGrid({ days, month, events, owners, onEvent, onDay, onCreateDay }: Props): React.JSX.Element {
  const grid = useRef<HTMLDivElement>(null);
  const [maxRows, setMaxRows] = useState(3);

  // As many event rows as fit in a cell (at least 2), like Google.
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const measure = (): void => setMaxRows(Math.max(2, Math.floor((el.clientHeight / 6 - 28) / ROW_PX)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const today = new Date();
  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {days.slice(0, 7).map((d) => (
          <div key={d.getDay()}>{weekdayFmt.format(d)}</div>
        ))}
      </div>
      <div className="cal-month-grid" ref={grid}>
        {days.map((d) => {
          const { shown, more } = monthCell(events, d, maxRows);
          return (
            <div
              key={d.getTime()}
              className={`cal-cell${d.getMonth() !== month ? ' other' : ''}`}
              onClick={(e) => e.target === e.currentTarget && onCreateDay(d, e.clientX, e.clientY)}
            >
              <button className={`cal-cell-num${sameDay(d, today) ? ' today' : ''}`} onClick={() => onDay(d)}>
                {d.getDate()}
              </button>
              {shown.map((e) => {
                const style = { ['--c' as string]: owners.get(e.accountId)?.color ?? '#888' };
                return isAllDayLike(e) ? (
                  <button key={e.id} className={`${eventClass(e)} bar`} style={style} onClick={(ev) => onEvent(e, ev.currentTarget)} title={e.title}>
                    {e.title}
                  </button>
                ) : (
                  <button key={e.id} className="cal-month-ev" style={style} onClick={(ev) => onEvent(e, ev.currentTarget)} title={e.title}>
                    <span className={`dot${e.response === 'needsAction' ? ' pending' : ''}`} />
                    <span className="h">{timeFmt.format(eventTimes(e).start)}</span>
                    <span className="t">{e.title}</span>
                  </button>
                );
              })}
              {more > 0 && (
                <button className="cal-more" onClick={() => onDay(d)}>
                  {t('calendar.month.more', { count: more })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
