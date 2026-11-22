import { useState } from 'react';
import type { UiSnapshot } from '../../../shared/ipc';
import { DEFAULT_ACTIONS, type MeetingState } from '../../../shared/meeting';
import { intlLocale, type MessageKey, t } from '../i18n';
import { MeetingSection } from './MeetingSection';

const STATE: Record<MeetingState, MessageKey> = {
  transcribing: 'meetings.state.transcribing',
  notRun: 'meetings.state.notRun',
  running: 'meetings.state.running',
  ready: 'meetings.state.ready',
  failed: 'meetings.state.failed',
};
const whenFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Every transcribed meeting, by space; open one to see its summary, draft and transcript. */
export function MeetingsView({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element {
  const m = snapshot.meetings;
  const scopes = [
    ...snapshot.spaces.map((s) => ({ key: `space:${s.id}`, name: s.name })),
    { key: 'nospace', name: t('common.noSpace') },
  ];
  const [scope, setScope] = useState<string>(snapshot.meetingsFocus?.scope ?? '');
  const [open, setOpen] = useState<string | null>(snapshot.meetingsFocus?.id ?? null);
  const items = m.list.filter((x) => !scope || x.scope === scope);
  const nameOf = (key: string): string => scopes.find((s) => s.key === key)?.name ?? '';
  return (
    <div className="mt-page">
      <div className="mt-page-head">
        <h1>{t('meetings.title')}</h1>
        <select className="set-select" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">{t('meetings.page.allSpaces')}</option>
          {scopes.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {items.length === 0 && <p className="mt-muted">{t('meetings.page.empty')}</p>}
      <ul className="mt-list">
        {items.map((x) => (
          <li key={x.id} className={open === x.id ? 'open' : undefined}>
            <button type="button" className="mt-row" onClick={() => setOpen(open === x.id ? null : x.id)}>
              <span className="mt-row-title">{x.title}</span>
              <span className="mt-row-meta">
                {nameOf(x.scope)} · {whenFmt.format(new Date(x.startedAt))} · {t('meetings.page.minutes', { minutes: String(x.minutes) })}
              </span>
              <span className={`td-meeting-state ${x.state}`}>{t(STATE[x.state])}</span>
            </button>
            {open === x.id && <MeetingSection item={x} todos={snapshot.todos} spaceName={nameOf(x.scope)} defaults={m.spaces[x.scope]?.actions ?? DEFAULT_ACTIONS} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
