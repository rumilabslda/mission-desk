import { useEffect, useMemo, useState } from 'react';
import type { UiSnapshot } from '../../shared/ipc';
import { eventDraftAt, type QuickRequest } from '../../shared/quick';
import type { SendUpdates, WriteError } from '../../shared/types';
import type { Owner } from './calendar/CalendarView';
import { type Choice, ChoiceDialog } from './calendar/ChoiceDialog';
import { distinctColors } from './calendar/colors';
import type { EditorResult } from './calendar/EventEditor';
import { QuickEventCard, QuickTodoCard } from './QuickCards';
import { QuickDial } from './QuickDial';

const CREATE_ERROR: Record<WriteError, string> = {
  'signed-out': 'Signed out of that Google account. Sign in again, then retry.',
  forbidden: "You can't add events to that calendar.",
  offline: "Couldn't reach Google. Check your connection and try again.",
  unsupported: 'This event has to be made in Google Calendar.',
  error: "Couldn't save the event. Try again.",
};

/**
 * The #quick page: the quick actions drawn over the page the user is on
 * (main/views/quick-overlay.ts): the floating button's menu, and the new to-do and new event
 * pop-ups. Saving or cancelling closes it.
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
  if (req.request.kind === 'dial') return <QuickDial key={req.n} request={req.request} />;
  return req.request.kind === 'todo' ? (
    <QuickTodo key={req.n} snap={snap} tag={req.request.tag} />
  ) : (
    <QuickEvent key={req.n} snap={snap} accountId={req.request.accountId} />
  );
}

const close = (): void => window.missiondesk.quickClose();

function QuickTodo({ snap, tag }: { snap: UiSnapshot; tag: { kind: 'space' | 'account'; id: string } | null }): React.JSX.Element {
  function add(text: string, where: string): void {
    const [kind, id] = where.split(':');
    window.missiondesk.todoAdd(text, where ? { kind: kind as 'space' | 'account', id } : undefined);
    window.missiondesk.quickDone('To-do added');
  }
  return (
    <div className="overlay quick-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <QuickTodoCard snap={snap} tag={tag} onAdd={add} onClose={close} />
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
      <div className="overlay quick-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <QuickEventCard seed={seed} accounts={google} owners={owners} saving={saving} onClose={close} onSave={(r) => void save(r)} />
      </div>
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
