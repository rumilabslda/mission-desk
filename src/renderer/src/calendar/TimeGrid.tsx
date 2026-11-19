import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CalEvent } from '../../../shared/types';
import type { Owner } from './CalendarView';
import { sameDay } from './dates';
import { createRange, isDrag, minutesAt, moveBy, resizeTo } from './drag';
import { allDayFor, eventTimes, timedBlocksForDay } from './layout';

const HOUR_PX = 48;
const PX_PER_MIN = HOUR_PX / 60;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

export function eventClass(e: CalEvent): string {
  return `cal-ev${e.response === 'needsAction' ? ' pending' : e.response === 'tentative' ? ' maybe' : ''}`;
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

interface Props {
  days: Date[];
  events: CalEvent[];
  owners: Map<string, Owner>;
  onEvent(e: CalEvent, el: HTMLElement): void;
  onDay(d: Date): void;
  /** A click or drag on empty time: create an event there. */
  onCreate(start: Date, end: Date, x: number, y: number): void;
  /** An editable event was dragged (moved or resized). */
  onMove(e: CalEvent, start: Date, end: Date): void;
}

type Drag =
  | { kind: 'create'; day: number; a: number; b: number; x0: number; y0: number; moved: boolean }
  | { kind: 'move' | 'resize'; ev: CalEvent; start: Date; end: Date; x0: number; y0: number; day0: number; day: number; minDelta: number; moved: boolean };

export function TimeGrid({ days, events, owners, onEvent, onDay, onCreate, onMove }: Props): React.JSX.Element {
  const now = useNow();
  const scroller = useRef<HTMLDivElement>(null);
  const bars = useMemo(() => allDayFor(events, days), [events, days]);
  const blocks = useMemo(() => days.map((d) => timedBlocksForDay(events, d)), [events, days]);
  const todayIndex = days.findIndex((d) => sameDay(d, now));
  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  // Start the day at 07:30, or an hour before now when today is on screen.
  // Re-applied when the all-day row appears (it shrinks the scroll area),
  // until the user scrolls.
  const userScrolled = useRef(false);
  const periodKey = `${days[0]?.getTime()}|${days.length}`;
  useLayoutEffect(() => {
    userScrolled.current = false;
  }, [periodKey]);
  useLayoutEffect(() => {
    if (userScrolled.current || !scroller.current) return;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const min = todayIndex >= 0 ? Math.max(450, nowMin - 60) : 450;
    scroller.current.scrollTop = min * PX_PER_MIN;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey, bars.length > 0]);

  const color = (e: CalEvent) => ({ ['--c' as string]: owners.get(e.accountId)?.color ?? '#888' });

  // --- Creating, moving and resizing with the pointer ---------------------------
  const colsRef = useRef<HTMLDivElement>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  // The handlers read the ref: a fast click's pointerup can come before React re-renders.
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null): void => {
    dragRef.current = d;
    setDragState(d);
  };
  const byId = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  function point(clientX: number, clientY: number): { day: number; min: number; minExact: number } {
    const r = colsRef.current!.getBoundingClientRect();
    const day = Math.max(0, Math.min(days.length - 1, Math.floor(((clientX - r.left) / r.width) * days.length)));
    return { day, min: minutesAt(clientY - r.top, PX_PER_MIN), minExact: (clientY - r.top) / PX_PER_MIN };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const block = target.closest<HTMLElement>('.cal-ev.block');
    const p = point(e.clientX, e.clientY);
    if (block) {
      const ev = byId.get(block.dataset.id ?? '');
      if (!ev?.editable) return; // a plain click opens its card
      const { start, end } = eventTimes(ev);
      const kind = target.closest('.cal-ev-resize') ? 'resize' : 'move';
      setDrag({ kind, ev, start, end, x0: e.clientX, y0: e.clientY, day0: p.day, day: p.day, minDelta: 0, moved: false });
    } else {
      setDrag({ kind: 'create', day: p.day, a: p.min, b: p.min, x0: e.clientX, y0: e.clientY, moved: false });
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no capture (e.g. a synthetic pointer): the drag still works while over the grid
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag) return;
    const moved = drag.moved || isDrag(e.clientX - drag.x0, e.clientY - drag.y0);
    const p = point(e.clientX, e.clientY);
    if (drag.kind === 'create') setDrag({ ...drag, b: p.min, moved });
    else setDrag({ ...drag, day: drag.kind === 'move' ? p.day : drag.day0, minDelta: (e.clientY - drag.y0) / PX_PER_MIN, moved });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>): void {
    const d = dragRef.current;
    setDrag(null);
    if (!d) return;
    if (d.kind === 'create') {
      const r = createRange(days[d.day], d.a, d.moved ? d.b : d.a);
      onCreate(r.start, r.end, e.clientX, e.clientY);
      return;
    }
    if (!d.moved) {
      const el = colsRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(d.ev.id)}"]`);
      if (el) onEvent(d.ev, el);
      return;
    }
    const next = ghostTimes(d);
    if (next.start.getTime() !== d.start.getTime() || next.end.getTime() !== d.end.getTime()) onMove(d.ev, next.start, next.end);
  }

  const ghostTimes = (d: Extract<Drag, { kind: 'move' | 'resize' }>): { start: Date; end: Date } =>
    d.kind === 'move' ? moveBy(d.start, d.end, d.minDelta, d.day - d.day0) : { start: d.start, end: resizeTo(d.start, d.end, d.minDelta) };

  /** The outline drawn while dragging, per day column. */
  function ghost(dayIndex: number): React.JSX.Element | null {
    if (!drag || (!drag.moved && drag.kind !== 'create')) return null;
    let top: number;
    let bottom: number;
    let style: React.CSSProperties = {};
    if (drag.kind === 'create') {
      if (dayIndex !== drag.day || !drag.moved) return null;
      top = Math.min(drag.a, drag.b);
      bottom = Math.max(drag.a, drag.b) + 15;
    } else {
      const { start, end } = ghostTimes(drag);
      const day = days[dayIndex];
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
      if (end <= dayStart || start >= dayEnd) return null;
      top = start <= dayStart ? 0 : start.getHours() * 60 + start.getMinutes();
      bottom = end >= dayEnd ? 1440 : end.getHours() * 60 + end.getMinutes();
      style = color(drag.ev);
    }
    return (
      <div className={`cal-ghost${drag.kind === 'create' ? ' create' : ''}`} style={{ ...style, top: top * PX_PER_MIN, height: Math.max(15, bottom - top) * PX_PER_MIN - 2 }}>
        {drag.kind !== 'create' && <span>{timeFmt.format(ghostTimes(drag).start)}</span>}
      </div>
    );
  }

  return (
    <div className="cal-time">
      <div className="cal-time-head">
        <div className="cal-gutter" />
        <div className="cal-day-heads" style={cols}>
          {days.map((d, i) => (
            <button key={d.getTime()} className={`cal-day-head${i === todayIndex ? ' today' : ''}`} onClick={() => onDay(d)}>
              <span className="wd">{weekdayFmt.format(d)}</span>
              <span className="num">{d.getDate()}</span>
            </button>
          ))}
        </div>
      </div>
      {bars.length > 0 && (
        <div className="cal-allday">
          <div className="cal-gutter" />
          <div className="cal-allday-grid" style={cols}>
            {bars.map((b) => (
              <button
                key={b.event.id}
                className={`${eventClass(b.event)} bar`}
                style={{ ...color(b.event), gridColumn: `${b.startCol + 1} / span ${b.span}`, gridRow: b.row + 1 }}
                onClick={(e) => onEvent(b.event, e.currentTarget)}
                title={b.event.title}
              >
                {b.event.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="cal-scroll"
        ref={scroller}
        onWheel={() => (userScrolled.current = true)}
        onPointerDown={() => (userScrolled.current = true)}
      >
        <div className="cal-hours" style={{ height: 24 * HOUR_PX }}>
          {HOURS.map((h) => (
            <div key={h} className="cal-hour-label" style={{ top: h * HOUR_PX }}>
              {h === 0 ? '' : timeFmt.format(new Date(2000, 0, 1, h))}
            </div>
          ))}
        </div>
        <div
          className={`cal-cols${drag?.moved ? ' dragging' : ''}`}
          ref={colsRef}
          style={{ ...cols, height: 24 * HOUR_PX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
        >
          {days.map((d, i) => (
            <div key={d.getTime()} className="cal-col">
              {blocks[i].map((b) => {
                const height = b.height * PX_PER_MIN - 2;
                const { start, end } = eventTimes(b.event);
                const time = `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
                const lifted = drag && drag.kind !== 'create' && drag.moved && drag.ev.id === b.event.id;
                return (
                  <button
                    key={b.event.id}
                    data-id={b.event.id}
                    className={`${eventClass(b.event)} block${height < 34 ? ' short' : ''}${b.event.editable ? ' editable' : ''}${lifted ? ' lifted' : ''}`}
                    style={{
                      ...color(b.event),
                      top: b.top * PX_PER_MIN,
                      height,
                      left: `calc(${(b.col / b.cols) * 100}% + 1px)`,
                      width: `calc(${100 / b.cols}% - 3px)`,
                    }}
                    // Mouse clicks on editable events go through the pointer handlers; keys and read-only events click here.
                    onClick={(e) => (e.detail === 0 || !b.event.editable) && onEvent(b.event, e.currentTarget)}
                    title={`${b.event.title}\n${time}`}
                  >
                    <span className="t">{b.event.title}</span>
                    <span className="h">{height < 34 ? `, ${timeFmt.format(start)}` : time}</span>
                    {b.event.editable && <span className="cal-ev-resize" aria-hidden="true" />}
                  </button>
                );
              })}
              {ghost(i)}
              {i === todayIndex && <div className="cal-now" style={{ top: (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
