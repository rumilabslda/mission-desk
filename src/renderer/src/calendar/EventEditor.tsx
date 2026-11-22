import { useModal } from '../modal';
import { useEffect, useMemo, useState } from 'react';
import type { AccountView } from '../../../shared/ipc';
import type { EventDraft, WritableCalendar } from '../../../shared/types';
import type { Owner } from './CalendarView';
import { draftTimes, editorFields, type EditorFields } from './drag';
import { t } from '../i18n';

const EMAIL = /^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/;

export interface EditorSeed {
  accountId: string;
  draft: EventDraft;
  /** Set when editing an existing event. */
  eventId?: string;
  /** The guests the event had when opened (to know if invitations change). */
  originalGuests?: string[];
}

export interface EditorResult {
  accountId: string;
  draft: EventDraft;
  eventId?: string;
  /** Editing only: the calendar the user moved the event to (same account). */
  toCalendarId?: string;
  guestsChanged: boolean;
}

/** The full event editor (create or edit), over the calendar. */
export function EventEditor({
  seed,
  accounts,
  owners,
  onSave,
  onClose,
}: {
  seed: EditorSeed;
  accounts: AccountView[];
  owners: Map<string, Owner>;
  onSave(r: EditorResult): void;
  onClose(): void;
}): React.JSX.Element {
  useModal(); // the floating assistant and pages stay out of its way
  const editing = !!seed.eventId;
  const [accountId, setAccountId] = useState(seed.accountId);
  const [title, setTitle] = useState(seed.draft.title);
  const [allDay, setAllDay] = useState(seed.draft.allDay);
  const [fields, setFields] = useState<EditorFields>(() => editorFields(seed.draft.allDay, seed.draft.start, seed.draft.end));
  const [location, setLocation] = useState(seed.draft.location);
  const [description, setDescription] = useState(seed.draft.description);
  const [guests, setGuests] = useState<string[]>(seed.draft.guests);
  const [guestText, setGuestText] = useState('');
  const [meet, setMeet] = useState(seed.draft.meet);
  const [calendars, setCalendars] = useState<WritableCalendar[] | null>(null);
  const [calendarId, setCalendarId] = useState(seed.draft.calendarId);

  // The calendars this account can write to (primary first).
  useEffect(() => {
    let live = true;
    setCalendars(null);
    void window.missiondesk.calendarCalendars(accountId).then((r) => {
      if (!live) return;
      const list = r.ok ? r.calendars : [];
      setCalendars(list);
      setCalendarId((c) => {
        if (c !== 'primary' && list.some((x) => x.id === c)) return c;
        return (c === 'primary' ? list.find((x) => x.primary)?.id : undefined) ?? list[0]?.id ?? c;
      });
    });
    return () => {
      live = false;
    };
  }, [accountId]);

  const times = useMemo(() => draftTimes(allDay, fields), [allDay, fields]);
  const pending = guestText.trim().toLowerCase();
  const pendingOk = !pending || EMAIL.test(pending);
  const valid = !!times && pendingOk && guests.length + (pending ? 1 : 0) <= 100 && calendars !== null && calendars.some((c) => c.id === calendarId);

  function addGuest(): void {
    if (!pending || !EMAIL.test(pending)) return;
    if (!guests.includes(pending)) setGuests([...guests, pending]);
    setGuestText('');
  }

  function save(e: React.FormEvent): void {
    e.preventDefault();
    if (!valid || !times) return;
    const allGuests = pending && !guests.includes(pending) ? [...guests, pending] : guests;
    const original = new Set(seed.originalGuests ?? []);
    const guestsChanged = allGuests.length !== original.size || allGuests.some((g) => !original.has(g));
    const draft: EventDraft = {
      calendarId: editing ? seed.draft.calendarId : calendarId,
      title: title.trim(),
      allDay,
      start: times.start,
      end: times.end,
      location: location.trim(),
      description,
      guests: allGuests,
      meet,
    };
    const moved = editing && calendarId !== seed.draft.calendarId && !!calendars?.some((c) => c.id === calendarId);
    onSave({ accountId, draft, eventId: seed.eventId, guestsChanged, ...(moved ? { toCalendarId: calendarId } : {}) });
  }

  const set = (k: keyof EditorFields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [k]: e.target.value });

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="dialog cal-editor"
        onSubmit={save}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <input className="cal-editor-title" autoFocus placeholder={t('calendar.editor.addTitle')} value={title} maxLength={1024} onChange={(e) => setTitle(e.target.value)} />

        <div className="cal-editor-grid">
          <span>{t('calendar.editor.account')}</span>
          <div className="cal-field-row">
            <span className="dot" style={{ background: owners.get(accountId)?.color ?? '#888' }} />
            <select
              value={accountId}
              disabled={editing}
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
          </div>

          <span>{t('calendar.editor.calendar')}</span>
          <select value={calendarId} disabled={!calendars || calendars.length === 0} onChange={(e) => setCalendarId(e.target.value)}>
            {!calendars && <option value={calendarId}>{t('common.loading')}</option>}
            {calendars?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <span>{t('calendar.editor.when')}</span>
          <div className="cal-when">
            <input type="date" value={fields.startDate} onChange={set('startDate')} />
            {!allDay && <input type="time" step={900} value={fields.startTime} onChange={set('startTime')} />}
            <span>{t('calendar.editor.to')}</span>
            {!allDay && <input type="time" step={900} value={fields.endTime} onChange={set('endTime')} />}
            <input type="date" value={fields.endDate} onChange={set('endDate')} />
            <label className="cal-check-row">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> {t('calendar.editor.allDay')}
            </label>
          </div>
          {!times && <span />}
          {!times && <span className="cal-error">{t('calendar.editor.endBeforeStart')}</span>}

          <span>{t('calendar.editor.guests')}</span>
          <div>
            <div className="cal-guests">
              {guests.map((g) => (
                <span key={g} className="cal-guest">
                  {g}
                  <button type="button" aria-label={t('calendar.editor.removeGuest', { email: g })} onClick={() => setGuests(guests.filter((x) => x !== g))}>
                    ×
                  </button>
                </span>
              ))}
              <input
                placeholder={t('calendar.editor.addGuests')}
                value={guestText}
                onChange={(e) => setGuestText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addGuest();
                  }
                }}
                onBlur={addGuest}
              />
            </div>
            {!pendingOk && <span className="cal-error">{t('calendar.editor.notEmail')}</span>}
          </div>

          <span>{t('calendar.editor.video')}</span>
          <label className="cal-check-row">
            <input type="checkbox" checked={meet} onChange={(e) => setMeet(e.target.checked)} /> {t('calendar.editor.meet')}
          </label>

          <span>{t('calendar.editor.location')}</span>
          <input value={location} maxLength={1024} placeholder={t('calendar.editor.addLocation')} onChange={(e) => setLocation(e.target.value)} />

          <span>{t('calendar.editor.description')}</span>
          <textarea value={description} maxLength={8192} rows={4} placeholder={t('calendar.editor.addDescription')} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="actions">
          <button type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="primary" disabled={!valid}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
