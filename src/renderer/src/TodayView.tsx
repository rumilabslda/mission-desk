import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AccountView, UiSnapshot } from '../../shared/ipc';
import { agendaView, greeting, localDay, todayView } from '../../shared/today';
import type { CalendarData, Todo } from '../../shared/types';
import { RecentMeetings } from './home/RecentMeetings';
import { splitWaiting } from './home/waiting';
import { Agenda } from './home/Agenda';
import { Messages } from './home/Messages';
import { distinctColors } from './calendar/colors';
import { intlLocale, t } from './i18n';

const dateFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
const dayShort = new Intl.DateTimeFormat(intlLocale(), { weekday: 'short' });

/** Asks the assistant panel to run a request (it shows the message and opens itself). */
export const askAssistant = (text: string): void => window.missiondesk.assistantAsk(text);

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function TodayView({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element {
  const now = useNow();
  const today = localDay(now);
  const [data, setData] = useState<CalendarData | null>(null);
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelEdit = useRef(false);

  const google = useMemo(() => snapshot.accounts.filter((a) => a.service === 'google'), [snapshot.accounts]);
  const colors = useMemo(() => distinctColors(google), [google]);
  const byId = useMemo(() => new Map(snapshot.accounts.map((a) => [a.id, a])), [snapshot.accounts]);
  const spaces = useMemo(() => new Map(snapshot.spaces.map((s) => [s.id, s])), [snapshot.spaces]);

  // Today's and tomorrow's events (all Google accounts, the unified calendar's data).
  const hiddenKey = snapshot.calendarHidden.join(',');
  const requestRef = useRef(0);
  const load = useCallback(
    (force: boolean) => {
      const req = ++requestRef.current; // only the newest answer counts (e.g. one started before midnight)
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      void window.missiondesk
        .loadCalendar({ start: s.toISOString(), end: e.toISOString() }, force)
        .then((d) => req === requestRef.current && setData(d))
        .catch(() => undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, hiddenKey],
  );
  useEffect(() => {
    if (google.length) load(false);
    const timer = setInterval(() => google.length && load(true), 5 * 60_000);
    return () => clearInterval(timer);
  }, [load, google.length]);

  const events = useMemo(
    () => (data?.events ?? []).filter((e) => byId.has(e.accountId) && !snapshot.calendarHidden.includes(e.accountId)),
    [data, byId, snapshot.calendarHidden],
  );
  const agenda = useMemo(() => agendaView(events, now), [events, now]);
  const meetingsLeft = agenda.current.length + (agenda.next ? 1 : 0) + agenda.upcoming.filter((e) => !e.free).length;

  const view = todayView(snapshot.todos, today);
  const tagLabel = (tag?: Todo['tag']): string | null => {
    if (!tag) return null;
    return tag.kind === 'space' ? (spaces.get(tag.id)?.name ?? null) : (byId.get(tag.id)?.name ?? null);
  };
  const tagColor = (tag?: Todo['tag']): string | undefined => {
    if (!tag) return undefined;
    if (tag.kind === 'account') return byId.get(tag.id)?.color;
    return snapshot.accounts.find((a) => a.spaceId === tag.id)?.color;
  };
  const tagOptions = [
    ...snapshot.spaces.map((s) => ({ value: `space:${s.id}`, label: s.name })),
    ...snapshot.accounts.filter((a) => !a.spaceId).map((a) => ({ value: `account:${a.id}`, label: a.name })),
  ];

  function add(): void {
    if (!text.trim()) return;
    const [kind, id] = tag.split(':');
    window.missiondesk.todoAdd(text, tag ? { kind: kind as 'space' | 'account', id } : undefined);
    setText('');
    inputRef.current?.focus();
  }

  // Unread, per space then loose accounts.
  const unreadGroups = useMemo(() => {
    const count = (a: AccountView): number => (typeof a.unread === 'number' ? a.unread : a.unread === 'dot' ? 1 : 0);
    const groups: { key: string; name: string; total: number; accounts: AccountView[] }[] = [];
    for (const s of snapshot.spaces) {
      const members = snapshot.accounts.filter((a) => a.spaceId === s.id && count(a) > 0 && !a.muted);
      if (members.length) groups.push({ key: `space:${s.id}`, name: s.name, total: members.reduce((n, a) => n + count(a), 0), accounts: members });
    }
    for (const a of snapshot.accounts.filter((x) => !x.spaceId && count(x) > 0 && !x.muted)) groups.push({ key: `account:${a.id}`, name: a.name, total: count(a), accounts: [a] });
    return groups;
  }, [snapshot.accounts, snapshot.spaces]);
  const totalUnread = unreadGroups.reduce((n, g) => n + g.total, 0);
  // "Brief me" runs on the "All spaces" assistant: it needs one, and at least one app it may read.
  const briefEngine = snapshot.assistant.configs.all?.engine ?? snapshot.assistant.defaultEngine ?? 'claude';
  const briefing = briefEngine !== 'off' && snapshot.accounts.some((a) => (a.claudeAccess ?? 'off') !== 'off');

  return (
    <div className="td-page">
      <header className="td-head">
        <div>
          <h1>{greeting(now)}</h1>
          <p className="td-date">{dateFmt.format(now)}</p>
        </div>
        <div className="td-head-side">
          <p className="td-summary">
            {t('home.today.meetingsLeft', { count: meetingsLeft })} · {t('home.today.todos', { count: view.open.length })} ·{' '}
            {t('home.today.unread', { count: totalUnread })}
          </p>
          {/* The one assistant shortcut worth a place here; the floating button does the rest. */}
          {briefing && (
            <button className="td-brief" onClick={() => askAssistant('/brief')} title={t('home.today.briefMeTitle')}>
              ✦ {t('home.today.briefMe')}
            </button>
          )}
        </div>
      </header>

      <div className="td-cols">
        <Agenda
          events={events}
          status={(data?.status ?? []).filter((x) => !snapshot.calendarHidden.includes(x.accountId))}
          loaded={data !== null}
          accounts={byId}
          hasGoogle={google.length > 0}
          colors={colors}
          now={now}
        />

        <div className="td-right">
          <Messages snapshot={snapshot} now={now} />

          <RecentMeetings items={snapshot.meetings.list} />

          <section className="td-card">
            <h2>{t('home.todo.title')}</h2>
            <div className="td-add">
              <input
                ref={inputRef}
                value={text}
                maxLength={500}
                placeholder={t('home.todo.addPlaceholder')}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
              />
              <select value={tag} onChange={(e) => setTag(e.target.value)} title={t('home.todo.space')}>
                <option value="">{t('common.noSpace')}</option>
                {tagOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <ul className="td-todos">
              {[...splitWaiting(view.open).mine, ...splitWaiting(view.open).waiting].map((todo, i, all) => (
                <li key={todo.id} className={`td-todo${todo.waitingOn ? ' waiting' : ''}${todo.waitingOn && !all[i - 1]?.waitingOn ? ' first-waiting' : ''}`} data-waiting-label={todo.waitingOn && !all[i - 1]?.waitingOn ? t('meetings.action.waitingOn') : undefined}>
                  <input type="checkbox" checked={false} onChange={() => window.missiondesk.todoUpdate(todo.id, { done: true })} />
                  {editing === todo.id ? (
                    <input
                      className="td-edit"
                      autoFocus
                      defaultValue={todo.text}
                      maxLength={500}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!cancelEdit.current && v && v !== todo.text) window.missiondesk.todoUpdate(todo.id, { text: v });
                        cancelEdit.current = false;
                        setEditing(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit.current = true;
                        if ((e.key === 'Enter' && !e.nativeEvent.isComposing) || e.key === 'Escape') (e.target as HTMLInputElement).blur();
                      }}
                    />
                  ) : (
                    <span className="td-text" onDoubleClick={() => setEditing(todo.id)}>
                      {todo.waitingOn && <span className="td-who">{todo.waitingOn}</span>}
                      {todo.text}
                    </span>
                  )}
                  {tagLabel(todo.tag) && (
                    <span className="td-tag" style={{ ['--c' as string]: tagColor(todo.tag) ?? '#888' }}>
                      {tagLabel(todo.tag)}
                    </span>
                  )}
                  {todo.carried && <span className="td-carried">{t('home.todo.carriedFrom', { day: dayShort.format(new Date(`${todo.day}T12:00:00`)) })}</span>}
                  <button className="td-del" aria-label={t('common.delete')} onClick={() => window.missiondesk.todoRemove(todo.id)}>
                    ×
                  </button>
                </li>
              ))}
              {view.done.map((todo) => (
                <li key={todo.id} className="td-todo done">
                  <input type="checkbox" checked onChange={() => window.missiondesk.todoUpdate(todo.id, { done: false })} />
                  <span className="td-text">{todo.text}</span>
                  {tagLabel(todo.tag) && (
                    <span className="td-tag" style={{ ['--c' as string]: tagColor(todo.tag) ?? '#888' }}>
                      {tagLabel(todo.tag)}
                    </span>
                  )}
                  <button className="td-del" aria-label={t('common.delete')} onClick={() => window.missiondesk.todoRemove(todo.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {view.open.length === 0 && view.done.length === 0 && <p className="td-muted">{t('home.todo.empty')}</p>}
            {view.done.length > 0 && (
              <button className="td-link" onClick={() => window.missiondesk.todosClearDone()}>
                {t('home.todo.clearDone')}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
