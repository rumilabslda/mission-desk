import type { EngineStatus, LiveMeeting, Meeting, MeetingAction, MeetingEndedInfo, MeetingGlobalSettings, MeetingListItem, SpaceMeetingSettings } from './meeting';
import type { LanguageSetting, Locale } from './i18n/locales';
import type { AssistantEffort, AssistantEvent, AssistantModel, ClaudeStatus, MemoryNote } from './assistant';
import type { Skill, SkillDraft, SkillSource } from './skills';
import type { DialAction, FabToastShown, QuickRequest } from './quick';
import type { ChatMessage, ConversationMeta } from './assistant-history';
import type { AssistantMode } from './assistant-scope';
import type { AssistantEngine, ScopeConfig } from './assistant-engines';
import type { MessageView } from './messages';
import type { UpdateMode, UpdateState } from './updates';
import type { SetupPlan } from './setup';
import type { DragRef, DropZone } from './spaces';
import type { Account, AccountIcon, CalendarData, CalendarRange, Todo, EditableEvent, EventDraft, Reply, SendUpdates, ServiceId, SidebarStyle, Space, UnreadCount, ViewKind, WritableCalendar, WriteError, WriteResult, WriteScope } from './types';

export interface AccountView extends Account {
  unread: UnreadCount;
  hibernated: boolean;
  /** What the sidebar draws: an image, the service logo, or the letter. */
  icon: AccountIcon;
}

export interface GoogleTab {
  id: ViewKind; // 'main' is shown as "Gmail"
  title: string;
}

export interface UiSnapshot {
  accounts: AccountView[];
  activeAccountId: string | null;
  /** Tabbed accounts' tabs; `offsite`: the host of the page on screen when it left the service (a sign-in elsewhere). */
  googleTabs: Record<string, { tabs: GoogleTab[]; active: ViewKind; offsite?: string }>;
  claude: { enabled: boolean; acting: string[] };
  /** The "All calendars" view is on screen (no account page is). */
  calendarOpen: boolean;
  /** The Home page (Today in code) is on screen. */
  todayOpen: boolean;
  openOnToday: boolean;
  /** Home's message list: the latest notification of each conversation, newest first. */
  messages: MessageView[];
  /** Show the start of each message on Home (Settings → General). */
  messagePreviews: boolean;
  /** Accounts that sent a notification this session (their apps' notifications are on). */
  messageSources: string[];
  /** New versions: how this copy updates, the background-check setting, and where it stands. */
  update: { mode: UpdateMode; auto: boolean; state: UpdateState };
  todos: Todo[];
  /** The Settings page is on screen (no account page is). */
  settingsOpen: boolean;
  /** The floating assistant (open, width, model, effort, whether its button shows). */
  assistant: {
    open: boolean;
    width: number;
    model: AssistantModel;
    effort: AssistantEffort;
    button: boolean;
    /** The assistant spaces use unless they chose their own (set by the setup; none: Claude). */
    defaultEngine?: AssistantEngine;
    /** One assistant per space (each sees only its space) or one for everything. */
    mode: AssistantMode;
    /** The scope on screen ('space:<id>', 'nospace' or 'all') and the ones to pick from. */
    scope: string;
    scopes: { key: string; name: string }[];
    /** The conversation on screen (null: a new chat), and the scope's history. */
    conversationId: string | null;
    conversations: ConversationMeta[];
    working: boolean;
    /** The scope on screen's assistant, and every listed scope's (Settings → Assistant). */
    engine: AssistantEngine;
    configs: Record<string, ScopeConfig>;
    /** Each scope's notes, kept apart (Settings → Assistant shows them under their own space). */
    memory: Record<string, MemoryNote[]>;
    /** The skills library, and which skills are on in each scope. */
    skills: Skill[];
    skillsActive: Record<string, string[]>;
  };
  /** The section Settings opens on, when it was opened for one. */
  settingsSection: string | null;
  /** The first-run setup is on screen. */
  setupOpen: boolean;
  /** The Google account last used to create an event. */
  calendarDefaultAccount?: string;
  /** The week-start choice in Settings ('auto' = from the Mac). */
  weekStartSetting: 0 | 1 | 'auto';
  /** The language choice in Settings ('system' = the Mac's). */
  language: LanguageSetting;
  /** The meetings page is on screen; `meetingsFocus`: the space and meeting it opened on. */
  meetingsOpen: boolean;
  meetingsFocus?: { scope?: string; id?: string };
  /** Meeting transcription: the meetings (no transcripts), the live one, and the settings. */
  meetings: {
    list: MeetingListItem[];
    live: LiveMeeting | null;
    /** The Ask bar's question (a meeting started in an Ask space, or a second call). */
    asking: { scope: string; title: string; switchTo: boolean } | null;
    /** What the bar is showing: the Ask question or the live controls (null: hidden). */
    barMode: 'ask' | 'live' | null;
    /** An Apple language being downloaded from the bar or Settings. */
    localeInstall: { locale: string; fraction: number } | null;
    settings: MeetingGlobalSettings;
    /** Per scope ('space:<id>', 'nospace'), with the default filled in. */
    spaces: Record<string, SpaceMeetingSettings>;
    engines: EngineStatus[];
  };
  /** Google accounts hidden in that view. */
  calendarHidden: string[];
  /** 1 = Monday, 0 = Sunday (from the Mac's settings). */
  weekStart: 0 | 1;
  /** Account groups in the sidebar (members are contiguous in `accounts`). */
  spaces: Space[];
  sidebarStyle: SidebarStyle;
  /** The space shown in the "Folders with panel" overlay, if open. */
  panelSpaceId?: string | null;
}

/** Main asks the UI for a space name: to create a space, or to rename one. */
export type SpaceNameRequest = { mode: 'create'; accountIds: string[] } | { mode: 'rename'; spaceId: string; name: string };

export interface NewAccountInput {
  service: ServiceId;
  name: string;
  color: string;
  /** A custom app's address (required for 'custom'). */
  url?: string;
  /** Put the new account straight into an existing space, or into a new one. */
  space?: { id: string } | { newName: string };
}

export interface UiApi {
  getSnapshot(): Promise<UiSnapshot>;
  onSnapshot(cb: (s: UiSnapshot) => void): () => void;
  /** Main asks the UI to open the edit dialog for an account. */
  onEditRequest(cb: (accountId: string) => void): () => void;
  selectAccount(id: string): void;
  addAccount(input: NewAccountInput): Promise<string>;
  updateAccount(
    id: string,
    patch: Partial<Pick<Account, 'name' | 'color' | 'muted' | 'hibernateWhenIdle' | 'iconMode' | 'iconSourceAccountId' | 'claudeAccess'>>,
  ): void;
  reorder(ids: string[]): void;
  showAccountMenu(id: string): void;
  selectGoogleTab(accountId: string, tab: ViewKind): void;
  closeGoogleTab(accountId: string, tab: `extra:${number}`): void;
  setModalOpen(open: boolean): void;
  /** Stop Claude acting in one account, or everywhere. */
  stopClaude(accountId?: string): void;
  getClaudeConnectInfo(): Promise<ClaudeConnectInfo>;
  setClaudeEnabled(on: boolean): Promise<ClaudeConnectInfo>;
  /** Main asks the UI to open the Connect Claude dialog. */
  onOpenConnectClaude(cb: () => void): () => void;
  /** Shows the "All calendars" view. */
  openCalendar(): void;
  /** Events of every visible Google account in the range. */
  loadCalendar(range: CalendarRange, force: boolean): Promise<CalendarData>;
  /** Opens an event or Meet link in that account (validated in main). */
  openCalendarLink(accountId: string, url: string): void;
  /** Joins a meeting: Meet in the account's Meet tab; Zoom/Teams in their app when installed; else the browser. */
  joinMeeting(accountId: string, url: string): void;
  setCalendarHidden(accountId: string, hidden: boolean): void;
  /** Main asks the calendar to reload (View → Reload). */
  onCalendarReload(cb: () => void): () => void;
  createSpace(name: string, accountIds: string[]): void;
  renameSpace(id: string, name: string): void;
  /** Applies a sidebar drop; resolves with the accounts to group when a new space must be named first. */
  dropInSidebar(drag: DragRef, target: DragRef, zone: DropZone): Promise<{ create: [string, string] } | null>;
  showSpaceMenu(id: string): void;
  /** The + button: a menu with Add app… and Add space…. */
  showAddMenu(): void;
  /** The ⚡ button: one-click actions for the current space (Meet link, event, to-do, assistant). */
  showActionsMenu(): void;
  /** A quick action just finished (Meet link copied, to-do added, event saved): the ⚡ button shows a tick. */
  onActionDone(cb: (message: string) => void): () => void;
  /** The quick-entry pop-up (#quick page): what to show, or null once it closed. */
  onQuickRequest(cb: (request: QuickRequest | null) => void): () => void;
  /** The quick-entry pop-up closes (Esc, Cancel, a click outside). */
  quickClose(): void;
  /** The floating button's menu: one of its actions was picked. */
  quickPick(action: DialAction): void;
  /** The floating button's page: a confirmation to show beside it, or null to clear it. */
  onFabToast(cb: (toast: FabToastShown | null) => void): () => void;
  /** The quick-entry pop-up saved: it closes and the ⚡ button confirms with `message`. */
  quickDone(message: string): void;
  /** Opens or closes a space in the Folders style (remembered). */
  setSpaceOpen(id: string, open: boolean): void;
  /** Main asks the UI to open the Add app or Add space dialog. */
  onOpenAddDialog(cb: (kind: 'app' | 'space') => void): () => void;
  /** "Folders with panel": shows the space's panel next to the sidebar, `top` px from the window top. */
  openSpacePanel(id: string, top: number): void;
  closeSpacePanel(): void;
  onSpaceNameRequest(cb: (r: SpaceNameRequest) => void): () => void;
  // --- Calendar editing ---
  calendarCalendars(accountId: string): Promise<{ ok: true; calendars: WritableCalendar[] } | { ok: false; error: WriteError }>;
  calendarGetEvent(accountId: string, calendarId: string, eventId: string): Promise<{ ok: true; event: EditableEvent } | { ok: false; error: WriteError }>;
  calendarCreate(accountId: string, draft: EventDraft, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarUpdate(accountId: string, eventId: string, draft: EventDraft, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarMove(accountId: string, calendarId: string, eventId: string, start: string, end: string, allDay: boolean, scope: WriteScope): Promise<WriteResult>;
  calendarDelete(accountId: string, calendarId: string, eventId: string, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarRespond(accountId: string, calendarId: string, eventId: string, reply: Reply): Promise<WriteResult>;
  calendarChangeCalendar(accountId: string, fromCalendarId: string, eventId: string, toCalendarId: string): Promise<WriteResult>;
  // --- Today ---
  openToday(): void;
  setOpenOnToday(on: boolean): void;
  /** Opens the conversation of a line in Home's message list. */
  openMessage(key: string): void;
  dismissMessage(key: string): void;
  clearMessages(): void;
  setMessagePreviews(on: boolean): void;
  checkForUpdates(): void;
  installUpdate(): void;
  setAutoUpdate(on: boolean): void;
  todoAdd(text: string, tag?: Todo['tag']): void;
  todoUpdate(id: string, patch: { text?: string; done?: boolean; tag?: Todo['tag'] | null }): void;
  todoRemove(id: string): void;
  todosClearDone(): void;
  // --- Assistant ---
  toggleAssistant(open?: boolean): void;
  /** Opens an http(s)/mailto link from an assistant answer in the default browser. */
  openExternal(url: string): void;
  /** Sends in the conversation on screen (creating it); resolves with its id before any answer. */
  assistantSend(text: string, target: { scope: string; conversationId: string | null }): Promise<string>;
  assistantConversation(id: string): Promise<{ id: string; scope: string; title: string; messages: ChatMessage[]; working: boolean } | null>;
  assistantOpenConversation(id: string): void;
  assistantDeleteConversation(id: string): void;
  assistantSetScope(scope: string): void;
  setAssistantMode(mode: AssistantMode): void;
  setAssistantScopeConfig(scope: string, patch: Partial<ScopeConfig>): void;
  assistantMemoryAdd(scope: string, text: string): void;
  assistantMemoryUpdate(scope: string, id: string, text: string): void;
  assistantMemoryRemove(scope: string, id: string): void;
  skillFetch(url: string): Promise<{ ok: true; url: string; draft: SkillDraft } | { ok: false; error: string }>;
  /** `draft` is null for a catalogue skill (its text comes from Mission Desk). */
  skillAdd(draft: SkillDraft | null, source: SkillSource, scopes: string[]): void;
  skillUpdate(id: string, patch: Partial<SkillDraft>): void;
  skillRemove(id: string): void;
  skillSetActive(id: string, scope: string, on: boolean): void;
  assistantStop(): void;
  assistantNewChat(): void;
  assistantSetModel(model: AssistantModel, effort: AssistantEffort): void;
  assistantSetWidth(width: number): void;
  /** Is Claude Code installed and signed in? (Setup steps before any chat.) */
  assistantStatus(): Promise<ClaudeStatus>;
  /** Runs `claude auth login` (it opens the browser); resolves when it ends, with the new status. */
  assistantSignIn(): Promise<ClaudeStatus>;
  /** Stops a sign-in that is waiting for the browser. */
  assistantSignInCancel(): void;
  // Integrations (Settings → Integrations)
  claudeIntegrationStatus(): Promise<ClaudeStatus>;
  codexStatus(): Promise<ClaudeStatus>;
  /** Runs `codex login` (it opens the browser); resolves when it ends, with the new status. */
  codexSignIn(): Promise<ClaudeStatus>;
  codexSignInCancel(): void;
  openRouterStatus(): Promise<{ connected: boolean }>;
  /** Checks the key with OpenRouter and saves it encrypted (it never comes back to the UI). */
  openRouterConnect(key: string): Promise<{ connected: boolean; error?: string }>;
  openRouterDisconnect(): void;
  /** OpenRouter's models that can use tools. */
  openRouterModels(): Promise<{ id: string; name: string }[]>;
  /** Opens the assistant and asks it something (Home's "Brief me"). */
  assistantAsk(text: string): void;
  onAssistantAsk(cb: (text: string) => void): () => void;
  /** Show or hide the floating assistant button. */
  setAssistantButton(on: boolean): void;
  /** The floating button is being dragged ('start') or was dropped ('end'). */
  assistantFabDrag(phase: 'start' | 'end'): void;
  /** The chat window's edges are being dragged ('start', which edges) or were let go ('end'). */
  assistantChatResize(phase: 'start' | 'end', edges?: { x?: 'left' | 'right'; y?: 'top' | 'bottom' }): void;
  onAssistantEvent(cb: (e: { conversationId: string; event: AssistantEvent }) => void): () => void;
  // --- Settings ---
  /** Opens Settings, on a section when given ('assistant', 'integrations'…). */
  openSettings(section?: string): void;
  /** The first-run setup (also from Settings → General). */
  openSetup(): void;
  skipSetup(): void;
  /** Creates the spaces and apps chosen in the setup; resolves with how many apps were added. */
  finishSetup(plan: SetupPlan): Promise<number>;
  closeSettings(): void;
  getAppInfo(): Promise<AppInfo>;
  /** Picks a custom image for the account (file dialog in main). */
  chooseAccountImage(id: string): void;
  /** Asks for confirmation in main, then removes the account. */
  removeAccount(id: string): void;
  moveToSpace(accountId: string, spaceId: string | null): void;
  setSpaceAlwaysOpen(id: string, on: boolean): void;
  setSpaceShareGoogle(id: string, on: boolean): void;
  setSpaceGoogleAccount(id: string, accountId: string): void;
  ungroupSpace(id: string): void;
  setSidebarStyle(style: SidebarStyle): void;
  setWeekStart(v: 0 | 1 | 'auto'): void;
  setSpaceMeetings(scope: string, s: SpaceMeetingSettings): void;
  setMeetingGlobal(patch: Partial<MeetingGlobalSettings>): void;
  /** The transcription bar. */
  meetingAnswer(yes: boolean, never: boolean): void;
  meetingPause(): void;
  meetingResume(): void;
  meetingStop(): void;
  meetingSetLanguage(locale: string): void;
  meetingCopyNotice(): void;
  meetingInstallLocale(locale: string): void;
  /** Runs a meeting's chosen actions through its space's assistant. */
  meetingRun(scope: string, id: string, actions: MeetingAction[]): void;
  onMeetingEnded(cb: (info: MeetingEndedInfo) => void): () => void;
  /** A meeting with its transcript (only from its own scope). */
  meetingGet(scope: string, id: string): Promise<Meeting | null>;
  /** Asks first (in main), then deletes. */
  meetingDelete(scope: string, id: string): void;
  /** Opens the follow-up e-mail as a new message in the space's mail account. */
  meetingOpenDraft(scope: string, id: string): void;
  meetingCopySummary(scope: string, id: string): void;
  /** Saves a proposed memory note (after the usual confirmation). */
  meetingSaveNote(scope: string, id: string, index: number): void;
  /** Creates the proposed follow-up event (after the usual confirmation). */
  meetingCreateEvent(scope: string, id: string): void;
  /** Transcription models: download (with progress in the snapshot), cancel, delete (main asks first). */
  modelDownload(id: 'whisper' | 'parakeet'): void;
  modelCancel(id: 'whisper' | 'parakeet'): void;
  modelDelete(id: 'whisper' | 'parakeet'): void;
  /** Apple's transcription languages (supported, and installed on this Mac). */
  meetingCapabilities(): Promise<{ apple: { supported: string[]; installed: string[] } } | null>;
  appleLocaleRemove(locale: string): void;
  /** The operating system (process.platform). */
  platform: string;
  /** The meetings page, optionally on one space and one meeting. */
  openMeetings(scope?: string, id?: string): void;
  /** The hidden capture page only: main asks it to record a meeting view (tab audio) and the microphone. */
  onCaptureStart(cb: (o: { callSourceId: string | null }) => void): () => void;
  onCaptureStop(cb: () => void): () => void;
  capturePcm(ch: 'me' | 'call', pcm: Int16Array): void;
  captureState(s: { me: boolean; call: boolean; error?: string }): void;
  /** Changes the interface language; every Mission Desk page reloads in it. */
  setLanguage(v: LanguageSetting): void;
  /** The interface language and the locale for dates, read once when the page loads. */
  locale: { locale: Locale; format: string; system: Locale } | null;
  showDataFolder(): void;
  showClaudeLog(): void;
}

export interface AppInfo {
  dataFolder: string;
  version: string;
}

export interface ClaudeConnectInfo {
  enabled: boolean;
  /** Command to add Mission Desk to Claude Code. */
  claudeCode: string;
  /** Snippet for Claude Desktop's claude_desktop_config.json. */
  desktopJson: string;
  /** Set when turning the switch on failed. */
  error?: string;
}

export const IPC = {
  getSnapshot: 'ui:get-snapshot',
  snapshot: 'ui:snapshot',
  editRequest: 'ui:edit-request',
  selectAccount: 'ui:select-account',
  addAccount: 'ui:add-account',
  updateAccount: 'ui:update-account',
  reorder: 'ui:reorder',
  accountMenu: 'ui:account-menu',
  selectGoogleTab: 'ui:select-google-tab',
  closeGoogleTab: 'ui:close-google-tab',
  setModalOpen: 'ui:set-modal-open',
  stopClaude: 'ui:stop-claude',
  getClaudeConnectInfo: 'ui:get-claude-connect-info',
  setClaudeEnabled: 'ui:set-claude-enabled',
  openConnectClaude: 'ui:open-connect-claude',
  openCalendar: 'ui:open-calendar',
  loadCalendar: 'ui:load-calendar',
  openCalendarLink: 'ui:open-calendar-link',
  joinMeeting: 'ui:join-meeting',
  setCalendarHidden: 'ui:set-calendar-hidden',
  calendarReload: 'ui:calendar-reload',
  createSpace: 'ui:create-space',
  renameSpace: 'ui:rename-space',
  dropInSidebar: 'ui:drop-in-sidebar',
  spaceMenu: 'ui:space-menu',
  addMenu: 'ui:add-menu',
  actionsMenu: 'ui:actions-menu',
  actionDone: 'ui:action-done',
  quickRequest: 'ui:quick-request',
  quickClose: 'ui:quick-close',
  quickPick: 'ui:quick-pick',
  fabToast: 'ui:fab-toast',
  quickDone: 'ui:quick-done',
  setSpaceOpen: 'ui:set-space-open',
  calendarCalendars: 'ui:calendar-calendars',
  calendarGetEvent: 'ui:calendar-get-event',
  calendarCreate: 'ui:calendar-create',
  calendarUpdate: 'ui:calendar-update',
  calendarMove: 'ui:calendar-move',
  calendarDelete: 'ui:calendar-delete',
  calendarRespond: 'ui:calendar-respond',
  calendarChangeCalendar: 'ui:calendar-change-calendar',
  openToday: 'ui:open-today',
  setOpenOnToday: 'ui:set-open-on-today',
  openMessage: 'ui:open-message',
  dismissMessage: 'ui:dismiss-message',
  clearMessages: 'ui:clear-messages',
  setMessagePreviews: 'ui:set-message-previews',
  checkForUpdates: 'ui:check-for-updates',
  installUpdate: 'ui:install-update',
  setAutoUpdate: 'ui:set-auto-update',
  todoAdd: 'ui:todo-add',
  todoUpdate: 'ui:todo-update',
  todoRemove: 'ui:todo-remove',
  todosClearDone: 'ui:todos-clear-done',
  toggleAssistant: 'ui:toggle-assistant',
  openExternal: 'ui:open-external',
  assistantSend: 'ui:assistant-send',
  assistantStop: 'ui:assistant-stop',
  assistantNewChat: 'ui:assistant-new-chat',
  assistantSetModel: 'ui:assistant-set-model',
  assistantSetWidth: 'ui:assistant-set-width',
  assistantEvent: 'ui:assistant-event',
  assistantStatus: 'ui:assistant-status',
  assistantConversation: 'ui:assistant-conversation',
  assistantOpenConversation: 'ui:assistant-open-conversation',
  assistantDeleteConversation: 'ui:assistant-delete-conversation',
  assistantSetScope: 'ui:assistant-set-scope',
  setAssistantMode: 'ui:set-assistant-mode',
  setAssistantScopeConfig: 'ui:set-assistant-scope-config',
  assistantMemoryAdd: 'ui:assistant-memory-add',
  assistantMemoryUpdate: 'ui:assistant-memory-update',
  assistantMemoryRemove: 'ui:assistant-memory-remove',
  skillFetch: 'ui:skill-fetch',
  skillAdd: 'ui:skill-add',
  skillUpdate: 'ui:skill-update',
  skillRemove: 'ui:skill-remove',
  skillSetActive: 'ui:skill-set-active',
  assistantSignIn: 'ui:assistant-sign-in',
  assistantSignInCancel: 'ui:assistant-sign-in-cancel',
  claudeIntegrationStatus: 'ui:claude-integration-status',
  codexStatus: 'ui:codex-status',
  codexSignIn: 'ui:codex-sign-in',
  codexSignInCancel: 'ui:codex-sign-in-cancel',
  openRouterStatus: 'ui:openrouter-status',
  openRouterConnect: 'ui:openrouter-connect',
  openRouterDisconnect: 'ui:openrouter-disconnect',
  openRouterModels: 'ui:openrouter-models',
  assistantAsk: 'ui:assistant-ask',
  assistantAskEvent: 'ui:assistant-ask-event',
  setAssistantButton: 'ui:set-assistant-button',
  assistantFabDrag: 'ui:assistant-fab-drag',
  assistantChatResize: 'ui:assistant-chat-resize',
  openSettings: 'ui:open-settings',
  openSetup: 'ui:open-setup',
  skipSetup: 'ui:skip-setup',
  finishSetup: 'ui:finish-setup',
  closeSettings: 'ui:close-settings',
  getAppInfo: 'ui:get-app-info',
  chooseAccountImage: 'ui:choose-account-image',
  removeAccount: 'ui:remove-account',
  moveToSpace: 'ui:move-to-space',
  setSpaceAlwaysOpen: 'ui:set-space-always-open',
  setSpaceShareGoogle: 'ui:set-space-share-google',
  setSpaceGoogleAccount: 'ui:set-space-google-account',
  ungroupSpace: 'ui:ungroup-space',
  setSidebarStyle: 'ui:set-sidebar-style',
  setWeekStart: 'ui:set-week-start',
  setLanguage: 'ui:set-language',
  setSpaceMeetings: 'ui:set-space-meetings',
  meetingAnswer: 'ui:meeting-answer',
  meetingPause: 'ui:meeting-pause',
  meetingResume: 'ui:meeting-resume',
  meetingStop: 'ui:meeting-stop',
  meetingSetLanguage: 'ui:meeting-set-language',
  meetingCopyNotice: 'ui:meeting-copy-notice',
  meetingInstallLocale: 'ui:meeting-install-locale',
  meetingRun: 'ui:meeting-run',
  meetingEnded: 'ui:meeting-ended',
  meetingGet: 'ui:meeting-get',
  meetingDelete: 'ui:meeting-delete',
  meetingOpenDraft: 'ui:meeting-open-draft',
  meetingCopySummary: 'ui:meeting-copy-summary',
  meetingSaveNote: 'ui:meeting-save-note',
  meetingCreateEvent: 'ui:meeting-create-event',
  openMeetings: 'ui:open-meetings',
  modelDownload: 'ui:model-download',
  modelCancel: 'ui:model-cancel',
  modelDelete: 'ui:model-delete',
  meetingCapabilities: 'ui:meeting-capabilities',
  appleLocaleRemove: 'ui:apple-locale-remove',
  setMeetingGlobal: 'ui:set-meeting-global',
  getLocale: 'ui:get-locale',
  showDataFolder: 'ui:show-data-folder',
  showClaudeLog: 'ui:show-claude-log',
  openAddDialog: 'ui:open-add-dialog',
  openSpacePanel: 'ui:open-space-panel',
  closeSpacePanel: 'ui:close-space-panel',
  spaceNameRequest: 'ui:space-name-request',
} as const;

export const ACCOUNT_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'];
