import type { CalendarRange } from '../../../shared/types';

export type CalView = 'day' | 'week' | 'month';

// Local-time arithmetic only (setDate, never +24h), so DST weeks stay correct.

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

export function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const day = startOfDay(d);
  const back = (day.getDay() - weekStart + 7) % 7;
  return addDays(day, -back);
}

export function visibleDays(view: CalView, anchor: Date, weekStart: 0 | 1): Date[] {
  if (view === 'day') return [startOfDay(anchor)];
  const first = view === 'week' ? startOfWeek(anchor, weekStart) : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1), weekStart);
  const count = view === 'week' ? 7 : 42;
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

export function rangeOf(days: Date[]): CalendarRange {
  return { start: startOfDay(days[0]).toISOString(), end: addDays(startOfDay(days[days.length - 1]), 1).toISOString() };
}

export function step(view: CalView, anchor: Date, delta: 1 | -1): Date {
  if (view === 'day') return addDays(startOfDay(anchor), delta);
  if (view === 'week') return addDays(startOfDay(anchor), 7 * delta);
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function title(view: CalView, anchor: Date, weekStart: 0 | 1, locale?: string): string {
  if (view === 'day') {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(anchor);
  }
  if (view === 'month') return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(anchor);
  const days = visibleDays('week', anchor, weekStart);
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return fmt.formatRange(days[0], days[6]);
}
