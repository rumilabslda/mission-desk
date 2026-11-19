import { useEffect, useMemo, useRef, useState } from 'react';
import type { UiSnapshot } from '../../shared/ipc';
import { eventDraftAt, type QuickRequest } from '../../shared/quick';
import type { SendUpdates, WriteError } from '../../shared/types';
import type { Owner } from './calendar/CalendarView';
import { type Choice, ChoiceDialog } from './calendar/ChoiceDialog';
import { distinctColors } from './calendar/colors';
import { type EditorResult, EventEditor } from './calendar/EventEditor';

const CREATE_ERROR: Record<WriteError, string> = {
  'signed-out': 'Signed out of that Google account. Sign in again, then retry.',
  forbidden: "You can't add events to that calendar.",
  offline: "Couldn't reach Google. Check your connection and try again.",
  unsupported: 'This event has to be made in Google Calendar.',
  error: "Couldn't save the event. Try again.",
};

/**
 * The #quick page: the ⚡ quick actions' pop-ups (new to-do, new event), drawn over the
 * page the user is on (main/views/quick-overlay.ts). Saving or cancelling closes it.
 */
export function QuickEntry(): React.JSX.Element | null {
  const [snap, setSnap] = useState<UiSnapshot | null>(null);
  // Each request gets its own key, so a new one starts from an empty form.
  const [req, setReq] = useState<{ n: number; request: QuickRequest } | null>(null);

  useEffect(() => {
    void window.missiondesk.getSnapshot().then((s) => s && setSnap(s));
    const offSnap = window.missiondesk.onSnapshot(setSnap);
    let n = 0;
    const offReq = window.missiondesk.onQuickRequest((request) => setReq(request ? { n: ++n, request } : null));
    return () => {
      offSnap();
      offReq();
    };
  }, []);

  if (!snap || !req) return null;
  return req.request.kind === 'todo' ? (
    <QuickTodo key={req.n} snap={snap} tag={req.request.tag} />
  ) : (
    <QuickEvent key={req.n} snap={snap} accountId={req.request.accountId} />
  );
}

const close = (): void => window.missiondesk.quickClose();

function QuickTodo({ snap, tag }: { snap: UiSnapshot; tag: { kind: 'space' | 'account'; id: string } | null }): React.JSX.Element {
  const options = [
    ...snap.spaces.map((s) => ({ value: `space:${s.id}`, label: s.name })),
    ...snap.accounts.filter((a) => !a.spaceId).map((a) => ({ value: `account:${a.id}`, label: a.name })),
  ];
  const first = tag ? `${tag.kind}:${tag.id}` : '';
  const [text, setText] = useState('');
  const [where, setWhere] = useState(options.some((o) => o.value === first) ? first : '');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  function add(): void {
    if (!text.trim()) return;
    const [kind, id] = where.split(':');
    window.missiondesk.todoAdd(text, where ? { kind: kind as 'space' | 'account', id } : undefined);
    window.missiondesk.quickDone('To-do added');
  }

  return (
    <div className="overlay quick-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form
        className="quick-todo"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <svg className="quick-todo-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
        <input ref={input} value={text} maxLength={500} placeholder="Add a to-do and press Enter" aria-label="New to-do" onChange={(e) => setText(e.target.value)} />
        <select value={where} onChange={(e) => setWhere(e.target.value)} title="Space">
          <option value="">No space</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}

function QuickEvent({ snap, accountId }: { snap: UiSnapshot; accountId: string | null }): React.JSX.Element | null {
  const google = useMemo(() => snap.accounts.filter((a) => a.service === 'google'), [snap.accounts]);
  const owners = useMemo(() => {
    const colors = distinctColors(google);
    return new Map<string, Owner>(google.map((a) => [a.id, { name: a.name, color: colors.get(a.id) ?? a.color }]));
  }, [google]);
  const [seed] = useState(() => {
    const pick = [accountId, snap.calendarDefaultAccount].find((id) => id && google.some((a) => a.id === id));
    return { accountId: pick ?? google[0]?.id ?? '', draft: eventDraftAt(new Date()) };
  });
  const [ask, setAsk] = useState<((v: SendUpdates | null) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!seed.accountId) return null;

  const askSend = (): Promise<SendUpdates | null> => new Promise((resolve) => setAsk(() => resolve));

  async function save(r: EditorResult): Promise<void> {
    if (saving) return;
    const send = r.draft.guests.length ? await askSend() : 'none';
    setAsk(null);
    if (!send) return;
    setSaving(true);
    setError(null);
    const res = await window.missiondesk.calendarCreate(r.accountId, r.draft, send).catch(() => ({ ok: false as const, error: 'error' as const }));
    setSaving(false);
    // On failure the editor stays open with what was typed.
    if (res.ok) window.missiondesk.quickDone('Event saved');
    else setError(CREATE_ERROR[res.error] ?? CREATE_ERROR.error);
  }

  const choices: Choice<SendUpdates>[] = [
    { label: 'Send', value: 'all', primary: true },
    { label: "Don't send", value: 'none' },
  ];
  return (
    <>
      <EventEditor seed={seed} accounts={google} owners={owners} onClose={close} onSave={(r) => void save(r)} />
      {error && (
        <div className="quick-error" role="alert">
          {error}
        </div>
      )}
      {ask && (
        <ChoiceDialog
          title="Send invitation emails to guests?"
          message="Guests get an email from Google."
          choices={choices}
          onChoose={(v) => ask(v)}
          onCancel={() => ask(null)}
        />
      )}
    </>
  );
}
