import { useModal } from '../modal';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Reply } from '../../../shared/types';
import type { OpenCard, Owner } from './CalendarView';
import { addDays, sameDay } from './dates';
import { eventTimes } from './layout';
import { intlLocale, type MessageKey, t } from '../i18n';

const CARD_W = 360;
const dayFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' });

function whenText(card: OpenCard): string {
  const e = card.event;
  const { start, end } = eventTimes(e);
  if (e.allDay) {
    const last = addDays(end, -1);
    return sameDay(start, last) ? dayFmt.format(start) : `${dayFmt.format(start)} – ${dayFmt.format(last)}`;
  }
  if (sameDay(start, end) || (end.getHours() === 0 && end.getMinutes() === 0 && sameDay(start, addDays(end, -1)))) {
    return `${dayFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }
  return `${dayFmt.format(start)}, ${timeFmt.format(start)} – ${dayFmt.format(end)}, ${timeFmt.format(end)}`;
}

const RESPONSE: Record<string, MessageKey | undefined> = {
  needsAction: 'calendar.card.notReplied',
  tentative: 'calendar.card.repliedMaybe',
};

export function EventCard({
  card,
  owner,
  onClose,
  onEdit,
  onDelete,
  onRespond,
}: {
  card: OpenCard;
  owner?: Owner;
  onClose(): void;
  onEdit(): void;
  onDelete(): void;
  onRespond(reply: Reply): void;
}): React.JSX.Element {
  useModal(); // the floating assistant and pages stay out of its way
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: 0 });
  const e = card.event;

  // Beside the event, inside the window.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 200;
    const { innerWidth: W, innerHeight: H } = window;
    const r = card.rect;
    let left = r.right + 8;
    if (left + CARD_W > W - 8) left = r.left - CARD_W - 8;
    if (left < 8) left = Math.max(8, Math.min(W - CARD_W - 8, r.left));
    const top = Math.max(8, Math.min(H - h - 8, r.top));
    setPos({ left, top });
  }, [card]);

  const open = (url?: string): void => {
    if (!url) return;
    window.missiondesk.openCalendarLink(e.accountId, url);
    onClose();
  };

  return (
    <div className="cal-card-backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="cal-card" ref={ref} style={{ ...pos, width: CARD_W }} role="dialog" aria-label={e.title}>
        <div className="cal-card-tools">
          {e.editable && (
            <>
              <button aria-label={t('calendar.card.edit')} title={t('common.edit')} onClick={onEdit}>
                ✏️
              </button>
              <button aria-label={t('calendar.card.delete')} title={t('common.delete')} onClick={onDelete}>
                🗑
              </button>
            </>
          )}
          <button className="cal-card-close" aria-label={t('common.close')} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cal-card-row">
          <span className="sq" style={{ background: owner?.color ?? '#888' }} />
          <div>
            <div className="cal-card-title">{e.title}</div>
            <div className="cal-card-when">{whenText(card)}</div>
          </div>
        </div>
        {e.location && <div className="cal-card-line">📍 {e.location}</div>}
        <div className="cal-card-line">
          <span className="dot" style={{ background: owner?.color ?? '#888' }} /> {owner?.name ?? t('calendar.card.account')}
        </div>
        {e.invited ? (
          <div className="cal-card-line cal-rsvp">
            <span>{t('calendar.card.going')}</span>
            {(
              [
                ['accepted', 'calendar.card.yes'],
                ['declined', 'calendar.card.no'],
                ['tentative', 'calendar.card.maybe'],
              ] as const
            ).map(([value, label]) => (
              <button key={value} className={e.response === value ? 'on' : ''} onClick={() => onRespond(value)}>
                {t(label)}
              </button>
            ))}
          </div>
        ) : (
          RESPONSE[e.response] && <div className="cal-card-line muted">{t(RESPONSE[e.response]!)}</div>
        )}
        <div className="cal-card-actions">
          {e.meetUrl && (
            <button className="primary" onClick={() => open(e.meetUrl)}>
              {t('calendar.card.joinMeet')}
            </button>
          )}
          {e.openUrl && (
            <button className="cal-btn" onClick={() => open(e.openUrl)}>
              {owner ? t('calendar.card.openIn', { name: owner.name }) : t('calendar.card.openInAccount')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
