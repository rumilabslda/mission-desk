import { useModal } from './modal';
import { useEffect, useState } from 'react';
import type { SpaceNameRequest, UiSnapshot } from '../../shared/ipc';
import { AccountDialog, type DialogState } from './AccountDialog';
import { AddSpaceDialog } from './AddSpaceDialog';
import { CalendarView } from './calendar/CalendarView';
import { SettingsView } from './SettingsView';
import { TodayView } from './TodayView';
import { ClaudeBanner } from './ClaudeBanner';
import { ConnectClaudeDialog } from './ConnectClaudeDialog';
import { GoogleTabStrip } from './GoogleTabStrip';
import { Sidebar } from './Sidebar';
import { SpaceNameDialog } from './SpaceNameDialog';
import { SetupView } from './setup/SetupView';
import { MeetingEndedDialog } from './meetings/MeetingEndedDialog';
import { MeetingsView } from './meetings/MeetingsView';
import { MemoryDialog } from './memory/MemoryDialog';
import { MAX_MEMORY_NOTES } from '../../shared/assistant';
import type { MeetingEndedInfo } from '../../shared/meeting';
import { t } from './i18n';

const EMPTY: UiSnapshot = { accounts: [], activeAccountId: null, googleTabs: {}, claude: { enabled: false, acting: [] }, calendarOpen: false, settingsOpen: false, todayOpen: false, openOnToday: true, messages: [], messagePreviews: true, linksInApp: true, chromeProfiles: [], linkProfiles: {}, userName: '', messageSources: [], update: { mode: 'off', auto: true, state: { kind: 'idle' } }, todos: [], weekStartSetting: 'auto', language: 'system', meetingsOpen: false, meetings: { list: [], live: null, asking: null, barMode: null, localeInstall: null, settings: {}, spaces: {}, engines: [] }, calendarHidden: [], weekStart: 1, spaces: [], sidebarStyle: 'sections', assistant: { open: false, width: 380, model: 'default', effort: 'medium', button: true, mode: 'space', scope: 'all', scopes: [], conversationId: null, conversations: [], working: false, engine: 'claude', configs: {}, memory: {}, skills: [], skillsActive: {}, connections: [] }, settingsSection: null, setupOpen: false };

/** A scope's name for the memory window: the space, "No space" or "All spaces". */
function memoryScopeName(snap: UiSnapshot, scope: string): string {
  if (scope === 'all') return t('common.allSpaces');
  if (scope === 'nospace') return t('common.noSpace');
  return snap.spaces.find((s) => `space:${s.id}` === scope)?.name ?? '';
}

export function App(): React.JSX.Element {
  const [snap, setSnap] = useState<UiSnapshot>(EMPTY);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [spaceName, setSpaceName] = useState<SpaceNameRequest | null>(null);
  const [addSpace, setAddSpace] = useState(false);
  const [ended, setEnded] = useState<MeetingEndedInfo | null>(null);
  const [memoryScope, setMemoryScope] = useState<string | null>(null);
  // Until main's first snapshot arrives nothing is known (no flash of the empty screen before the setup).
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void window.missiondesk.getSnapshot().then((s) => {
      if (s) setSnap(s);
      setLoaded(true);
    });
    const offSnap = window.missiondesk.onSnapshot((s) => {
      setSnap(s);
      setLoaded(true);
    });
    const offEdit = window.missiondesk.onEditRequest((id) => setDialog({ mode: 'edit', accountId: id }));
    const offConnect = window.missiondesk.onOpenConnectClaude(() => setConnectOpen(true));
    const offSpaceName = window.missiondesk.onSpaceNameRequest(setSpaceName);
    const offEnded = window.missiondesk.onMeetingEnded(setEnded);
    const offMemory = window.missiondesk.onOpenMemory(setMemoryScope);
    const offAdd = window.missiondesk.onOpenAddDialog((kind) => (kind === 'space' ? setAddSpace(true) : setDialog({ mode: 'add' })));
    return () => {
      offEnded();
      offMemory();
      offAdd();
      offSnap();
      offEdit();
      offConnect();
      offSpaceName();
    };
  }, []);

  useModal(dialog !== null || connectOpen || spaceName !== null || addSpace || ended !== null || memoryScope !== null);

  const editing = dialog?.mode === 'edit' ? snap.accounts.find((a) => a.id === dialog.accountId) : undefined;

  return (
    <div className="app">
      {/* Under the setup, nothing can be reached (Tab, clicks, screen readers). */}
      <div className="app-shell" inert={snap.setupOpen || undefined}>
        <Sidebar snapshot={snap} onAdd={() => setDialog({ mode: 'add' })} onCreateSpace={(ids) => setSpaceName({ mode: 'create', accountIds: ids })} />
        <main className="content">
          <ClaudeBanner snapshot={snap} />
          <GoogleTabStrip snapshot={snap} />
          {snap.settingsOpen ? <SettingsView snapshot={snap} /> : snap.meetingsOpen ? <MeetingsView key={`${snap.meetingsFocus?.scope}|${snap.meetingsFocus?.id}`} snapshot={snap} /> : snap.todayOpen && snap.accounts.length > 0 ? <TodayView snapshot={snap} /> : snap.calendarOpen && <CalendarView snapshot={snap} />}
          {loaded && snap.accounts.length === 0 && !snap.settingsOpen && !snap.setupOpen && (
            <div className="empty">
              <h1>{t('app.welcome.title')}</h1>
              <p>{t('app.welcome.body')}</p>
              <button className="primary" onClick={() => setDialog({ mode: 'add' })}>
                {t('app.welcome.addFirst')}
              </button>
              <button className="empty-link" onClick={() => window.missiondesk.openSetup()}>
                {t('app.welcome.setup')}
              </button>
            </div>
          )}
        </main>
      </div>
      {snap.setupOpen && (
        <SetupView
          hasAccounts={snap.accounts.length > 0}
          existing={snap.spaces.map((s) => ({ name: s.name, color: snap.accounts.find((x) => x.spaceId === s.id)?.color }))}
          defaultEngine={snap.assistant.defaultEngine}
          userName={snap.userName}
          meetingEngines={snap.meetings.engines}
          meetingEngine={snap.meetings.settings.engine}
        />
      )}
      {ended && <MeetingEndedDialog info={ended} onClose={() => setEnded(null)} />}
      {memoryScope && (
        <MemoryDialog scope={memoryScope} name={memoryScopeName(snap, memoryScope)} notes={snap.assistant.memory[memoryScope] ?? []} max={MAX_MEMORY_NOTES} onClose={() => setMemoryScope(null)} />
      )}
      {connectOpen && <ConnectClaudeDialog onClose={() => setConnectOpen(false)} />}
      {addSpace && <AddSpaceDialog snapshot={snap} onClose={() => setAddSpace(false)} />}
      {spaceName && <SpaceNameDialog request={spaceName} onClose={() => setSpaceName(null)} />}
      {dialog && (dialog.mode === 'add' || editing) && (
        <AccountDialog state={dialog} account={editing} spaces={snap.spaces} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
