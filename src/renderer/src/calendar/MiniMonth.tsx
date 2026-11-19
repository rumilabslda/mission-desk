import { useEffect, useState } from 'react';
import { dayKey, sameDay, visibleDays } from './dates';

const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const initialFmt = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

interface Props {
  anchor: Date;
  weekStart: 0 | 1;
  /** Days on screen in the main view (highlighted). */
  selected: Date[];
  onPick(d: Date): void;
}

export function MiniMonth({ anchor, weekStart, selected, onPick }: Props): React.JSX.Element {
  const [month, setMonth] = useState(() => new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  useEffect(() => setMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), [anchor]);

  const days = visibleDays('month', month, weekStart);
  const picked = new Set(selected.length <= 7 ? selected.map(dayKey) : []);
  const today = new Date();
  return (
    <div className="mini-month">
      <div className="mini-head">
        <span>{monthFmt.format(month)}</span>
        <button className="cal-icon-btn small" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          ‹
        </button>
        <button className="cal-icon-btn small" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          ›
        </button>
      </div>
      <div className="mini-grid">
        {days.slice(0, 7).map((d) => (
          <span key={`h${d.getDay()}`} className="mini-wd">
            {initialFmt.format(d)}
          </span>
        ))}
        {days.map((d) => (
          <button
            key={d.getTime()}
            className={`mini-day${d.getMonth() !== month.getMonth() ? ' other' : ''}${sameDay(d, today) ? ' today' : ''}${picked.has(dayKey(d)) ? ' picked' : ''}`}
            onClick={() => onPick(d)}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
