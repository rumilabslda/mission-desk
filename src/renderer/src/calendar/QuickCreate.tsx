import { useModal } from '../modal';
import { useLayoutEffect, useRef, useState } from 'react';
import type { AccountView } from '../../../shared/ipc';
import type { EventDraft } from '../../../shared/types';
import type { Owner } from './CalendarView';
import { intlLocale, t } from '../i18n';

const W = 340;
const dayFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' });

export interface QuickSeed {
  x: number;
  y: number;
  allDay: boolean;
  /** ISO instants, or YYYY-MM-DD (end exclusive) when all day. */
  start: string;
  end: string;
}

function whenText(seed: QuickSeed): string {
  if (seed.allDay) return t('calendar.quick.allDayWhen', { day: dayFmt.format(new Date(`${seed.start}T00:00:00`)) });
  const s = new Date(seed.start);
  return `${dayFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(new Date(seed.end))}`;
}

/** Google-style quick create: title, account, Meet; Save, or More options for the full editor. */
export function QuickCreate({
  seed,
  accounts,
  owners,
  defaultAccountId,
  onSave,
  onMore,
  onClose,
}: {
  seed: QuickSeed;
  accounts: AccountView[];
  owners: Map<string, Owner>;
  defaultAccountId?: string;
  onSave(accountId: string, draft: EventDraft): void;
  onMore(accountId: string, draft: EventDraft): void;
  onClose(): void;
}): React.JSX.Element {
  useModal(); // the floating assistant and pages stay out of its way
  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState(
    accounts.some((a) => a.id === defaultAccountId) ? defaultAccountId! : (accounts[0]?.id ?? ''),
  );
  const [meet, setMeet] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const [pos, setPos] = useState({ left: -9999, top: 0 });

  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 220;
    const left = Math.max(8, Math.min(window.innerWidth - W - 8, seed.x + 12));
    const top = Math.max(8, Math.min(window.innerHeight - h - 8, seed.y - 20));
    setPos({ left, top });
  }, [seed]);

  const draft = (): EventDraft => ({
    calendarId: 'primary',
    title: title.trim(),
    allDay: seed.allDay,
    start: seed.start,
    end: seed.end,
    location: '',
    description: '',
    guests: [],
    meet,
  });

  return (
    <div className="cal-card-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        ref={ref}
        className="cal-card cal-quick"
        style={{ ...pos, width: W }}
        onSubmit={(e) => {
          e.preventDefault();
          if (accountId) onSave(accountId, draft());
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <input className="cal-quick-title" autoFocus placeholder={t('calendar.editor.addTitle')} value={title} maxLength={1024} onChange={(e) => setTitle(e.target.value)} />
        <div className="cal-card-when">{whenText(seed)}</div>
        <label className="cal-field-row">
          <span className="dot" style={{ background: owners.get(accountId)?.color ?? '#888' }} />
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="cal-field-row cal-check-row">
          <input type="checkbox" checked={meet} onChange={(e) => setMeet(e.target.checked)} /> {t('calendar.quick.addMeet')}
        </label>
        <div className="cal-card-actions">
          <button type="button" className="cal-btn" onClick={() => accountId && onMore(accountId, draft())}>
            {t('calendar.quick.moreOptions')}
          </button>
          <button type="submit" className="primary" disabled={!accountId}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
