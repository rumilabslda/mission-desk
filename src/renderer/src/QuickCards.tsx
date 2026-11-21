import { useEffect, useMemo, useRef, useState } from 'react';
import type { AccountView, UiSnapshot } from '../../shared/ipc';
import type { EventDraft, WritableCalendar } from '../../shared/types';
import type { Owner } from './calendar/CalendarView';
import { draftTimes } from './calendar/drag';
import type { EditorResult } from './calendar/EventEditor';

// The quick actions' pop-ups (#quick page): a new to-do and a new event, made for a few seconds'
// typing. The calendar keeps its full editor; the rarely used fields here sit under "More options".

const EMAIL = /^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/;
const isMac = navigator.platform.toLowerCase().includes('mac');
const pad = (n: number): string => String(n).padStart(2, '0');
const dateField = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeField = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const minutesOf = (t: string): number | null => {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const Icon = ({ d }: { d: React.ReactNode }): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const TODO_ICON = (
  <>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>
);
const EVENT_ICON = (
  <>
    <rect x="4" y="5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </>
);
const VIDEO_ICON = (
  <>
    <rect x="3" y="6" width="12" height="12" rx="2.5" />
    <path d="m15 10.5 5-3v9l-5-3" />
  </>
);
const PEOPLE_ICON = (
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4" />
  </>
);

function Head({ icon, tone, title, children }: { icon: React.ReactNode; tone: 'todo' | 'event'; title: string; children?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="qk-head">
      <span className={`qk-icon ${tone}`}>
        <Icon d={icon} />
      </span>
      <span className="qk-kind">{title}</span>
      <span className="qk-head-side">{children}</span>
    </div>
  );
}

const Keys = ({ k }: { k: string }): React.JSX.Element => <kbd className="qk-kbd">{k}</kbd>;

/** A new to-do: the text, and the space it belongs to as chips. */
export function QuickTodoCard({
  snap,
  tag,
  onAdd,
  onClose,
}: {
  snap: UiSnapshot;
  tag: { kind: 'space' | 'account'; id: string } | null;
  onAdd(text: string, where: string): void;
  onClose(): void;
}): React.JSX.Element {
  const color = (key: string): string | undefined => {
    const [kind, id] = key.split(':');
    return kind === 'account' ? snap.accounts.find((a) => a.id === id)?.color : snap.accounts.find((a) => a.spaceId === id)?.color;
  };
  const options = [
    ...snap.spaces.map((s) => ({ value: `space:${s.id}`, label: s.name })),
    ...snap.accounts.filter((a) => !a.spaceId).map((a) => ({ value: `account:${a.id}`, label: a.name })),
  ];
  const first = tag ? `${tag.kind}:${tag.id}` : '';
  const [text, setText] = useState('');
  const [where, setWhere] = useState(options.some((o) => o.value === first) ? first : '');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const ready = text.trim().length > 0;

  return (
    <form
      className="qk"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onAdd(text, where);
      }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <Head icon={TODO_ICON} tone="todo" title="New to-do" />
      <input ref={input} className="qk-title" value={text} maxLength={500} placeholder="What needs doing?" aria-label="New to-do" onChange={(e) => setText(e.target.value)} />
      {options.length > 0 && (
        <div className="qk-chips" role="radiogroup" aria-label="Space">
          {[{ value: '', label: 'No space' }, ...options].map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={where === o.value}
              className={`qk-chip${where === o.value ? ' on' : ''}`}
              onClick={() => {
                setWhere(o.value);
                input.current?.focus();
              }}
            >
              {o.value && <span className="qk-dot" style={{ background: color(o.value) ?? '#888' }} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="qk-foot">
        <span className="qk-hint">
          <Keys k="↵" /> to add · <Keys k="esc" /> to close
        </span>
        <button type="button" className="qk-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="qk-primary" disabled={!ready}>
          Add to-do
        </button>
      </div>
    </form>
  );
}

const DURATIONS = [15, 30, 60, 120];
const durationLabel = (m: number): string => (m < 60 ? `${m} min` : `${m / 60} h`);

/** A new event: title, day and time (with quick lengths), Meet, guests; the rest under "More options". */
export function QuickEventCard({
  seed,
  accounts,
  owners,
  saving,
  onSave,
  onClose,
}: {
  seed: { accountId: string; draft: EventDraft };
  accounts: AccountView[];
  owners: Map<string, Owner>;
  saving: boolean;
  onSave(r: EditorResult): void;
  onClose(): void;
}): React.JSX.Element {
  const start0 = new Date(seed.draft.start);
  const [accountId, setAccountId] = useState(seed.accountId);
  const [title, setTitle] = useState(seed.draft.title);
  const [date, setDate] = useState(dateField(start0));
  const [time, setTime] = useState(timeField(start0));
  // The length, not the end: changing the start keeps it, and a meeting may run past midnight.
  const [minutes, setMinutes] = useState(Math.max(15, Math.round((Date.parse(seed.draft.end) - start0.getTime()) / 60_000)));
  const [allDay, setAllDay] = useState(false);
  const [meet, setMeet] = useState(seed.draft.meet);
  const [guests, setGuests] = useState<string[]>([]);
  const [guestText, setGuestText] = useState('');
  const [more, setMore] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [calendars, setCalendars] = useState<WritableCalendar[] | null>(null);
  const [calendarId, setCalendarId] = useState(seed.draft.calendarId);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  // The calendars this account can write to (primary first), as the full editor does.
  useEffect(() => {
    let live = true;
    setCalendars(null);
    void window.missiondesk.calendarCalendars(accountId).then((r) => {
      if (!live) return;
      const list = r.ok ? r.calendars : [];
      setCalendars(list);
      setCalendarId((c) => (c !== 'primary' && list.some((x) => x.id === c) ? c : (list.find((x) => x.primary)?.id ?? list[0]?.id ?? c)));
    });
    return () => {
      live = false;
    };
  }, [accountId]);

  const startMin = minutesOf(time);
  const endTime = startMin === null ? '' : `${pad(Math.floor(((startMin + minutes) % 1440) / 60))}:${pad((startMin + minutes) % 60)}`;
  const times = useMemo(() => {
    if (allDay) return draftTimes(true, { startDate: date, startTime: '09:00', endDate: date, endTime: '10:00' });
    const t = draftTimes(false, { startDate: date, startTime: time, endDate: date, endTime: '23:59' });
    if (!t) return null;
    return { start: t.start, end: new Date(Date.parse(t.start) + minutes * 60_000).toISOString() };
  }, [allDay, date, time, minutes]);

  const pending = guestText.trim().toLowerCase();
  const pendingOk = !pending || EMAIL.test(pending);
  const valid = !!times && pendingOk && guests.length + (pending ? 1 : 0) <= 100 && calendars !== null && calendars.some((c) => c.id === calendarId);

  function addGuest(): void {
    if (!pending || !EMAIL.test(pending)) return;
    if (!guests.includes(pending)) setGuests([...guests, pending]);
    setGuestText('');
  }

  function save(e?: React.FormEvent): void {
    e?.preventDefault();
    if (!valid || !times || saving) return;
    const allGuests = pending && !guests.includes(pending) ? [...guests, pending] : guests;
    onSave({
      accountId,
      draft: { calendarId, title: title.trim(), allDay, start: times.start, end: times.end, location: location.trim(), description, guests: allGuests, meet },
      guestsChanged: allGuests.length > 0,
    });
  }

  const today = dateField(new Date());
  const tomorrow = dateField(new Date(Date.now() + 86_400_000));
  const dayWord = date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : null;

  return (
    <form
      className="qk qk-event"
      onSubmit={save}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
      }}
    >
      <Head icon={EVENT_ICON} tone="event" title="New event">
        <label className="qk-account" title="Account">
          <span className="qk-dot" style={{ background: owners.get(accountId)?.color ?? '#888' }} />
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setCalendarId('primary'); // never keep the previous account's calendar
            }}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </Head>

      <input ref={titleRef} className="qk-title" placeholder="Add a title" value={title} maxLength={1024} aria-label="Title" onChange={(e) => setTitle(e.target.value)} />

      <div className="qk-when">
        <label className="qk-field qk-date">
          {dayWord && <span className="qk-dayword">{dayWord}</span>}
          <input type="date" value={date} aria-label="Day" onChange={(e) => setDate(e.target.value)} />
        </label>
        {!allDay && (
          <>
            <input className="qk-field" type="time" step={300} value={time} aria-label="Starts" onChange={(e) => setTime(e.target.value)} />
            <span className="qk-to">–</span>
            <input
              className="qk-field"
              type="time"
              step={300}
              value={endTime}
              aria-label="Ends"
              onChange={(e) => {
                const end = minutesOf(e.target.value);
                if (end === null || startMin === null) return;
                setMinutes(((end - startMin + 1440) % 1440) || 1440); // past midnight: the next day
              }}
            />
          </>
        )}
      </div>
      <div className="qk-chips">
        {!allDay &&
          DURATIONS.map((m) => (
            <button key={m} type="button" className={`qk-chip${minutes === m ? ' on' : ''}`} onClick={() => setMinutes(m)}>
              {durationLabel(m)}
            </button>
          ))}
        <button type="button" className={`qk-chip${allDay ? ' on' : ''}`} aria-pressed={allDay} onClick={() => setAllDay(!allDay)}>
          All day
        </button>
        <span className="qk-sep" />
        <button type="button" className={`qk-chip qk-toggle${meet ? ' on' : ''}`} aria-pressed={meet} onClick={() => setMeet(!meet)}>
          <Icon d={VIDEO_ICON} />
          Google Meet
        </button>
      </div>

      <div className={`qk-guests${pendingOk ? '' : ' bad'}`}>
        <Icon d={PEOPLE_ICON} />
        {guests.map((g) => (
          <span key={g} className="qk-guest">
            {g}
            <button type="button" aria-label={`Remove ${g}`} onClick={() => setGuests(guests.filter((x) => x !== g))}>
              ×
            </button>
          </span>
        ))}
        <input
          placeholder={guests.length ? 'Add another' : 'Add guests by email'}
          value={guestText}
          aria-label="Guests"
          onChange={(e) => setGuestText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              if (!pending) return; // an empty field: Enter saves
              e.preventDefault();
              addGuest();
            }
            if (e.key === 'Backspace' && !guestText && guests.length) setGuests(guests.slice(0, -1));
          }}
          onBlur={addGuest}
        />
      </div>
      {!pendingOk && <span className="qk-error">That isn't an email address.</span>}

      {more ? (
        <div className="qk-more">
          <label>
            <span>Calendar</span>
            <select value={calendarId} disabled={!calendars || calendars.length === 0} onChange={(e) => setCalendarId(e.target.value)}>
              {!calendars && <option value={calendarId}>Loading…</option>}
              {calendars?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Location</span>
            <input value={location} maxLength={1024} placeholder="Add a place" onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label>
            <span>Notes</span>
            <textarea value={description} maxLength={8192} rows={3} placeholder="Add a description" onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
      ) : (
        <button type="button" className="qk-more-link" onClick={() => setMore(true)}>
          More options: calendar, place, notes
        </button>
      )}

      <div className="qk-foot">
        <span className="qk-hint">
          <Keys k={isMac ? '⌘↵' : 'Ctrl+↵'} /> to save · <Keys k="esc" /> to close
        </span>
        <button type="button" className="qk-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="qk-primary" disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Save event'}
        </button>
      </div>
    </form>
  );
}
