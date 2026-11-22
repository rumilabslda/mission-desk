import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import type { AccountCalendarStatus, CalEvent, CalendarData, EditableEvent, EventDraft, Reply, SendUpdates, WriteResult, WriteScope } from '../../../shared/types';
import { type Choice, ChoiceDialog } from './ChoiceDialog';
import { type EditorResult, type EditorSeed, EventEditor } from './EventEditor';
import { type QuickSeed, QuickCreate } from './QuickCreate';
import { Toast, type ToastState } from './Toast';
import { distinctColors } from './colors';
import { addDays, type CalView, dayKey, rangeOf, startOfDay, step, title, visibleDays } from './dates';
import { EventCard } from './EventCard';
import { DEFAULT_ACTIONS } from '../../../shared/meeting';
import { MiniMonth } from './MiniMonth';
import { MonthGrid } from './MonthGrid';
import { TimeGrid } from './TimeGrid';
import { intlLocale, type MessageKey, t } from '../i18n';

const REFRESH_MS = 5 * 60_000;
const STALE_MS = 60_000;

export interface OpenCard {
  event: CalEvent;
  rect: DOMRect;
}

export interface Owner {
  name: string;
  color: string;
}

const STATUS_TEXT: Record<Exclude<AccountCalendarStatus['state'], 'ok'>, MessageKey> = {
  'signed-out': 'calendar.accounts.signedOut',
  error: 'calendar.accounts.error',
  offline: 'calendar.accounts.offline',
};

const VIEW_LABEL: Record<CalView, MessageKey> = { day: 'calendar.view.day', week: 'calendar.view.week', month: 'calendar.view.month' };

function AccountList({
  accounts,
  owners,
  hidden,
  status,
}: {
  accounts: AccountView[];
  owners: Map<string, Owner>;
  hidden: Set<string>;
  status: Map<string, AccountCalendarStatus['state']>;
}): React.JSX.Element {
  return (
    <div className="cal-accounts">
      <div className="cal-side-title">{t('calendar.accounts.title')}</div>
      {accounts.map((a) => {
        const state = status.get(a.id);
        const on = !hidden.has(a.id);
        return (
          <div key={a.id} className="cal-account">
            <label title={on ? t('calendar.accounts.hide', { name: a.name }) : t('calendar.accounts.show', { name: a.name })}>
              <input type="checkbox" checked={on} onChange={(e) => window.missiondesk.setCalendarHidden(a.id, !e.target.checked)} />
              <span className="cal-check" style={{ ['--c' as string]: owners.get(a.id)?.color ?? a.color }} aria-hidden="true" />
              <span className="cal-account-name">{a.name}</span>
            </label>
            {on && state && state !== 'ok' && (
              <button className={`cal-account-status ${state}`} onClick={() => window.missiondesk.selectAccount(a.id)}>
                {t(STATUS_TEXT[state])}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarView({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element {
  const [view, setView] = useState<CalView>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<OpenCard | null>(null);
  const [quick, setQuick] = useState<QuickSeed | null>(null);
  const [editor, setEditor] = useState<EditorSeed | null>(null);
  const [choice, setChoice] = useState<{ title: string; message?: string; choices: Choice<unknown>[]; resolve(v: unknown): void } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  // Times shown for events just dragged, until the reload confirms them.
  const [moved, setMoved] = useState<Map<string, { start: string; end: string }>>(new Map());
  const editing = useRef<{ event: CalEvent; full: EditableEvent } | null>(null);
  const weekStart = snapshot.weekStart;

  const google = useMemo(() => snapshot.accounts.filter((a) => a.service === 'google'), [snapshot.accounts]);
  const hidden = useMemo(() => new Set(snapshot.calendarHidden), [snapshot.calendarHidden]);
  const owners = useMemo(() => {
    const colors = distinctColors(google);
    return new Map<string, Owner>(google.map((a) => [a.id, { name: a.name, color: colors.get(a.id) ?? a.color }]));
  }, [google]);
  const days = useMemo(() => visibleDays(view, anchor, weekStart), [view, anchor, weekStart]);
  const range = useMemo(() => rangeOf(days), [days]);
  const rangeKey = `${range.start}|${range.end}`;

  const seq = useRef(0);
  const lastLoad = useRef(0);
  const load = useCallback(
    (force: boolean) => {
      const mine = ++seq.current;
      setLoading(true);
      window.missiondesk
        .loadCalendar(range, force)
        .then((d) => {
          if (mine !== seq.current) return; // the user moved on to another range
          setData(d);
          setMoved(new Map());
          lastLoad.current = Date.now();
        })
        .catch(() => undefined)
        .finally(() => {
          if (mine === seq.current) setLoading(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rangeKey],
  );

  // Async flows (saves, Undo, Try again) must reload the period on screen *now*, not the one they started on.
  const loadRef = useRef(load);
  loadRef.current = load;

  const hiddenKey = snapshot.calendarHidden.join(',');
  const googleKey = google.map((a) => a.id).join(',');
  useEffect(() => load(false), [load, hiddenKey, googleKey]);

  useEffect(() => {
    const timer = setInterval(() => load(true), REFRESH_MS);
    const onFocus = (): void => {
      if (Date.now() - lastLoad.current > STALE_MS) load(true);
    };
    window.addEventListener('focus', onFocus);
    const off = window.missiondesk.onCalendarReload(() => load(true));
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      off();
    };
  }, [load]);

  const go = useCallback((delta: 1 | -1) => setAnchor((a) => step(view, a, delta)), [view]);
  const today = useCallback(() => setAnchor(startOfDay(new Date())), []);
  const openDay = useCallback((d: Date) => {
    setAnchor(startOfDay(d));
    setView('day');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (document.querySelector('.overlay') || quick) return; // a dialog or the quick card is open
      if (card) {
        if (e.key === 'Escape') setCard(null);
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 't') today();
      else if (k === 'd') setView('day');
      else if (k === 'w') setView('week');
      else if (k === 'm') setView('month');
      else if (k === 'j' || e.key === 'ArrowRight') go(1);
      else if (k === 'k' || e.key === 'ArrowLeft') go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, quick, go, today]);

  const events = useMemo(
    () =>
      (data?.events ?? [])
        .filter((e) => owners.has(e.accountId) && !hidden.has(e.accountId))
        .map((e) => (moved.has(e.id) ? { ...e, ...moved.get(e.id)! } : e)),
    [data, owners, hidden, moved],
  );
  const status = useMemo(() => new Map((data?.status ?? []).map((s) => [s.accountId, s.state])), [data]);
  const onEvent = useCallback((event: CalEvent, el: HTMLElement) => setCard({ event, rect: el.getBoundingClientRect() }), []);

  // --- Editing -----------------------------------------------------------------
  const ask = <T,>(title: string, message: string | undefined, choices: Choice<T>[]): Promise<T | null> =>
    new Promise((resolve) => setChoice({ title, message, choices: choices as Choice<unknown>[], resolve: resolve as (v: unknown) => void }));
  const answer = (v: unknown): void => {
    choice?.resolve(v);
    setChoice(null);
  };

  const openInGoogle = (ev: CalEvent): void => {
    if (ev.openUrl) window.missiondesk.openCalendarLink(ev.accountId, ev.openUrl);
  };

  const ERROR_TEXT: Record<string, string> = {
    'signed-out': t('calendar.error.signedOut'),
    forbidden: t('calendar.error.forbidden'),
    offline: t('calendar.error.offline'),
    unsupported: t('calendar.error.unsupported'),
    error: t('calendar.error.generic'),
  };

  /** A write that can't throw: a rejected call counts as a plain error. */
  const call = <T,>(p: Promise<T>): Promise<T | { ok: false; error: 'error' }> => p.catch(() => ({ ok: false as const, error: 'error' as const }));

  /** After a write: reload, and on failure say so with Try again / Open in Google Calendar. */
  function settle(r: WriteResult, success: ToastState | null, retry?: () => void, ev?: CalEvent): boolean {
    loadRef.current(true);
    if (r.ok) {
      if (success) setToast(success);
      return true;
    }
    const actions: ToastState['actions'] = [];
    if (retry && r.error !== 'unsupported' && r.error !== 'forbidden') actions.push({ label: t('calendar.toast.tryAgain'), run: retry });
    if (ev?.openUrl) actions.push({ label: t('calendar.toast.openInGoogle'), run: () => openInGoogle(ev) });
    setToast({ message: ERROR_TEXT[r.error] ?? ERROR_TEXT.error, actions, error: true });
    return false;
  }

  /** Repeating events: this one, all, or "this and following" (done in Google Calendar). */
  async function scopeFor(ev: CalEvent, question: MessageKey): Promise<WriteScope | null> {
    if (!ev.recurring) return 'this';
    const s = await ask<WriteScope | 'following'>(t(question), undefined, [
      { label: t('calendar.scope.this'), value: 'this', primary: true },
      { label: t('calendar.scope.all'), value: 'all' },
      { label: t('calendar.scope.following'), value: 'following' },
    ]);
    if (s === 'following') {
      openInGoogle(ev);
      return null;
    }
    return s;
  }

  const askSend = (title: string): Promise<SendUpdates | null> =>
    ask<SendUpdates>(title, t('calendar.send.message'), [
      { label: t('calendar.send.send'), value: 'all', primary: true },
      { label: t('calendar.send.dontSend'), value: 'none' },
    ]);

  async function commitCreate(accountId: string, draft: EventDraft, send: SendUpdates): Promise<void> {
    const r = await call(window.missiondesk.calendarCreate(accountId, draft, send));
    settle(r, { message: t('calendar.toast.created') }, () => void commitCreate(accountId, draft, send));
  }

  /** Quick card Save (the editor asks its own questions before closing). */
  async function create(accountId: string, draft: EventDraft): Promise<void> {
    const send = draft.guests.length ? await askSend(t('calendar.send.inviteTitle')) : 'none';
    if (send) await commitCreate(accountId, draft, send);
  }

  async function commitEdit(res: EditorResult, current: { event: CalEvent; full: EditableEvent }, scope: WriteScope, send: SendUpdates): Promise<void> {
    const r = await call(window.missiondesk.calendarUpdate(res.accountId, res.eventId!, res.draft, scope, send));
    if (!settle(r, { message: t('calendar.toast.saved') }, () => void commitEdit(res, current, scope, send), current.event)) return;
    if (!res.toCalendarId) return;
    if (current.event.recurring && scope === 'this') {
      setToast({ message: t('calendar.toast.occurrenceCantMove') });
      return;
    }
    const id = scope === 'all' && current.full.seriesId ? current.full.seriesId : res.eventId!;
    const m = await call(window.missiondesk.calendarChangeCalendar(res.accountId, res.draft.calendarId, id, res.toCalendarId));
    settle(m, { message: t('calendar.toast.savedMoved') }, undefined, current.event);
  }

  /** Editor Save: questions first (the editor stays open if one is cancelled), then the write. */
  async function saveEditor(res: EditorResult): Promise<void> {
    if (!res.eventId) {
      const send = res.draft.guests.length ? await askSend(t('calendar.send.inviteTitle')) : 'none';
      if (!send) return;
      setEditor(null);
      return commitCreate(res.accountId, res.draft, send);
    }
    const current = editing.current;
    if (!current) return;
    const scope = await scopeFor(current.event, 'calendar.scope.editTitle');
    if (!scope) return;
    const send = res.draft.guests.length || current.full.guests.length ? await askSend(t('calendar.send.updateTitle')) : 'none';
    if (!send) return;
    editing.current = null;
    setEditor(null);
    await commitEdit(res, current, scope, send);
  }

  async function editEvent(ev: CalEvent): Promise<void> {
    setCard(null);
    const r = await call(window.missiondesk.calendarGetEvent(ev.accountId, ev.calendarId, ev.eventId));
    if (!r.ok) return void settle(r, null, () => void editEvent(ev), ev);
    editing.current = { event: ev, full: r.event };
    const { eventId, seriesId: _s, meetUrl: _m, editable: _e, ...draft } = r.event;
    setEditor({ accountId: ev.accountId, draft, eventId, originalGuests: r.event.guests });
  }

  async function moveEvent(ev: CalEvent, start: Date, end: Date): Promise<void> {
    const scope = await scopeFor(ev, 'calendar.scope.moveTitle');
    if (!scope) return;
    const before = { start: ev.start, end: ev.end };
    const after = { start: start.toISOString(), end: end.toISOString() };
    setMoved((m) => new Map(m).set(ev.id, after));
    const r = await call(window.missiondesk.calendarMove(ev.accountId, ev.calendarId, ev.eventId, after.start, after.end, false, scope));
    if (!r.ok) setMoved((m) => new Map(m).set(ev.id, before));
    const undo = async (): Promise<void> => {
      setMoved((m) => new Map(m).set(ev.id, before));
      const u = await call(window.missiondesk.calendarMove(ev.accountId, ev.calendarId, ev.eventId, before.start, before.end, false, scope));
      settle(u, null, undefined, ev);
    };
    // A whole series' occurrences get new ids once it moves, so only single moves can be undone here.
    const done: ToastState = scope === 'all' ? { message: t('calendar.toast.seriesMoved') } : { message: t('calendar.toast.moved'), actions: [{ label: t('calendar.toast.undo'), run: () => void undo() }] };
    settle(r, done, () => void moveEvent(ev, start, end), ev);
  }

  async function deleteEvent(ev: CalEvent): Promise<void> {
    setCard(null);
    const scope = await scopeFor(ev, 'calendar.scope.deleteTitle');
    if (!scope) return;
    const full = await call(window.missiondesk.calendarGetEvent(ev.accountId, ev.calendarId, ev.eventId));
    const hasGuests = full.ok && full.event.guests.length > 0;
    let send: SendUpdates | null = 'none';
    if (hasGuests) {
      send = await ask<SendUpdates>(t('calendar.delete.guestsTitle'), t('calendar.delete.guestsMessage'), [
        { label: t('calendar.delete.notify'), value: 'all', primary: true },
        { label: t('calendar.delete.dontNotify'), value: 'none', danger: true },
      ]);
    } else if (!ev.recurring) {
      send = await ask<SendUpdates>(t('calendar.delete.title'), ev.title, [{ label: t('common.delete'), value: 'none', danger: true }]);
    }
    if (!send) return;
    const r = await call(window.missiondesk.calendarDelete(ev.accountId, ev.calendarId, ev.eventId, scope, send));
    settle(r, { message: t('calendar.toast.deleted') }, () => void deleteEvent(ev), ev);
  }

  async function respond(ev: CalEvent, reply: Reply): Promise<void> {
    setCard(null);
    const r = await call(window.missiondesk.calendarRespond(ev.accountId, ev.calendarId, ev.eventId, reply));
    settle(r, { message: t(reply === 'accepted' ? 'calendar.toast.going' : reply === 'declined' ? 'calendar.toast.notGoing' : 'calendar.toast.maybe') }, () => void respond(ev, reply), ev);
  }

  function newEventNow(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() < 30 ? 30 : 60);
    const end = new Date(start.getTime() + 60 * 60_000);
    const accountId = google.some((a) => a.id === snapshot.calendarDefaultAccount) ? snapshot.calendarDefaultAccount! : google[0].id;
    setEditor({
      accountId,
      draft: { calendarId: 'primary', title: '', allDay: false, start: start.toISOString(), end: end.toISOString(), location: '', description: '', guests: [], meet: false },
    });
  }

  if (google.length === 0) {
    return (
      <div className="cal cal-empty">
        <p>{t('calendar.empty')}</p>
      </div>
    );
  }

  return (
    <div className="cal">
      <header className="cal-toolbar">
        <button className="cal-btn" onClick={today} title={t('calendar.toolbar.todayTip')}>
          {t('common.today')}
        </button>
        <div className="cal-nav">
          <button className="cal-icon-btn" onClick={() => go(-1)} title={t('calendar.toolbar.previousTip')} aria-label={t('calendar.toolbar.previous')}>
            ‹
          </button>
          <button className="cal-icon-btn" onClick={() => go(1)} title={t('calendar.toolbar.nextTip')} aria-label={t('common.next')}>
            ›
          </button>
        </div>
        <h1 className="cal-title">{title(view, anchor, weekStart, intlLocale())}</h1>
        <button className="cal-btn cal-create" onClick={newEventNow} title={t('calendar.toolbar.createTip')}>
          {t('calendar.toolbar.create')}
        </button>
        {loading && <span className="cal-spinner" aria-label={t('calendar.toolbar.loading')} />}
        <div className="cal-views" role="tablist">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)} title={`${v[0].toUpperCase()}`}>
              {t(VIEW_LABEL[v])}
            </button>
          ))}
        </div>
      </header>
      <div className="cal-body">
        <aside className="cal-side">
          <MiniMonth anchor={anchor} weekStart={weekStart} selected={days} onPick={(d) => setAnchor(startOfDay(d))} />
          <AccountList accounts={google} owners={owners} hidden={hidden} status={status} />
        </aside>
        <section className="cal-main">
          {!data && loading ? (
            <div className="cal-loading">{t('calendar.loadingCalendars')}</div>
          ) : view === 'month' ? (
            <MonthGrid
              days={days}
              month={anchor.getMonth()}
              events={events}
              owners={owners}
              onEvent={onEvent}
              onDay={openDay}
              onCreateDay={(d, x, y) => setQuick({ x, y, allDay: true, start: dayKey(d), end: dayKey(addDays(d, 1)) })}
            />
          ) : (
            <TimeGrid
              key={view}
              days={days}
              events={events}
              owners={owners}
              onEvent={onEvent}
              onDay={openDay}
              onCreate={(start, end, x, y) => setQuick({ x, y, allDay: false, start: start.toISOString(), end: end.toISOString() })}
              onMove={(ev, start, end) => void moveEvent(ev, start, end)}
            />
          )}
        </section>
      </div>
      {card && (
        <EventCard
          card={card}
          owner={owners.get(card.event.accountId)}
          onClose={() => setCard(null)}
          onEdit={() => void editEvent(card.event)}
          onDelete={() => void deleteEvent(card.event)}
          onRespond={(reply) => void respond(card.event, reply)}
          meeting={(() => {
            const item = snapshot.meetings.list.find((x) => x.event?.accountId === card.event.accountId && x.event.eventId === card.event.id);
            if (!item) return undefined;
            const space = snapshot.spaces.find((s) => `space:${s.id}` === item.scope);
            return { item, todos: snapshot.todos, spaceName: space?.name ?? t('common.noSpace'), defaults: snapshot.meetings.spaces[item.scope]?.actions ?? DEFAULT_ACTIONS };
          })()}
        />
      )}
      {quick && (
        <QuickCreate
          seed={quick}
          accounts={google}
          owners={owners}
          defaultAccountId={snapshot.calendarDefaultAccount}
          onClose={() => setQuick(null)}
          onSave={(accountId, draft) => {
            setQuick(null);
            void create(accountId, draft);
          }}
          onMore={(accountId, draft) => {
            setQuick(null);
            setEditor({ accountId, draft });
          }}
        />
      )}
      {editor && (
        <EventEditor
          seed={editor}
          accounts={google}
          owners={owners}
          onClose={() => {
            editing.current = null;
            setEditor(null);
          }}
          onSave={(r) => void saveEditor(r)}
        />
      )}
      {choice && <ChoiceDialog title={choice.title} message={choice.message} choices={choice.choices} onChoose={answer} onCancel={() => answer(null)} />}
      {toast && <Toast toast={toast} onClose={closeToast} />}
    </div>
  );
}
