import { app, type BrowserWindow, clipboard, dialog, ipcMain, Menu, net, Notification, safeStorage, session, shell, systemPreferences, type WebContents, webContents, type WebContentsView } from 'electron';
import { capturePage, type CaptureHost, type CaptureState, createCaptureHost } from './meetings/capture-host';
import { createMeetingStore } from './meetings/store';
import { createTranscriber, type Transcriber } from './meetings/transcriber';
import { createOrchestrator } from './meetings/orchestrator';
import { createDetector } from './meetings/detector';
import { type Ask, createOneShot } from './meetings/one-shot';
import { createMeetingRunner } from './meetings/run';
import { meetingsHost } from './meetings/assistant-host';
import { applyRetention, spacesLeftEmpty } from './meetings/lifecycle';
import { createModelManager, type Manifest, type ModelId } from './meetings/models';
import MODEL_MANIFEST from './meetings/model-manifest.json';
import { createMeetingOverlay } from './views/meeting-overlay';
import { barTarget, meetingBarBounds } from './views/meeting-bar-bounds';
import { composeUrl } from '../shared/compose-url';
import { eventsOfScope, matchEvent } from '../shared/meeting-detect';
import { PROVIDER_NAME } from '../shared/meetings';
import { PROBE_RELIABLE } from '../shared/meeting-probes';
import { cleanName } from '../shared/meeting-speakers';
import { createUpdater } from './updates/updater';
import { createConnections } from './assistant/connections';
import { openRouterKeyName, sessionEnvFor } from './assistant/connection-env';
import { type ClaudeAccount } from '../shared/claude-accounts';
import { connectionEnv, connectionTarget, type ConnectionTarget, isBuiltinId, parseAuthInfo } from '../shared/connections';
import { DEFAULT_ACTIONS, type EngineId, type EngineStatus, type Meeting, type MeetingAction, type MeetingEndedInfo, meetingLocale, type MeetingGlobalSettings, type SpaceMeetingSettings, spaceMeetingSettings } from '../shared/meeting';
import { type LanguageSetting, type Locale, type MessageKey, resolveLocale, setLocale, t } from '../shared/i18n';
import { updateMode } from '../shared/updates';
import { addMessage, closeMessage, type Feed, messageViews, removeMessage, trimToUnread } from '../shared/messages';
import { createOpenRouterSession } from './assistant/openrouter-session';
import { type InProcessTools, inProcessTools } from './assistant/inprocess-tools';
import { checkOpenRouterKey, type OpenRouterModel, toolModels } from './assistant/openrouter-account';
import { createCodexSession } from './assistant/codex-session';
import { createSecrets } from './assistant/secrets';
import type { AccountView, AppInfo, ClaudeConnectInfo, GoogleTab, NewAccountInput, UiSnapshot } from '../shared/ipc';
import { IPC } from '../shared/ipc';
import { CLAUDE_BANNER_HEIGHT } from '../shared/layout';
import { type Account, type Todo, type CalendarData, type CalendarRange, type EditableEvent, type EventDraft, type Reply, type SendUpdates, type WritableCalendar, type WriteError, type WriteResult, type WriteScope, type SubApp, type ViewKind, kindToSubApp, subAppToKind } from '../shared/types';
import { effectiveWeekStart, weekStartFrom } from '../shared/week-start';
import type { DialAction } from '../shared/quick';
import { actionContext, applyDrop, assignSpace, type DragRef, type DropZone, googleAccountFor, moveWithinContainer, ungroupSpace } from '../shared/spaces';
import type { SidebarStyle, UnreadCount } from '../shared/types';
import { createCalendarFetcher } from './calendar/fetcher';
import { CALENDAR_ORIGIN } from './calendar/google-api';
import { isAllowedCalendarLink } from './calendar/normalize';
import { createCalendarService } from './calendar/service';
import { createCalendarWriter } from './calendar/writer';
import { createTodoStore } from './todos/store';
import { createMemoryStore } from './assistant/memory';
import { createSkillsStore } from './assistant/skills-store';
import { expandSkillCommand, MAX_INSTRUCTIONS, parseSkillMd, SKILL_CATALOG, type SkillDraft, type SkillSource, skillFetchUrl } from '../shared/skills';
import { messagesInScope, todosInScope, todoTagFor } from './assistant/scope-data';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { type AssistantEffort, type AssistantModel, expandCommand, isAssistantEffort, isAssistantModel } from '../shared/assistant';
import { cleanEnv } from './assistant/claude-code';
import { type AssistantSession, createClaudeCodeSession } from './assistant/engine';
import { findClaude } from './assistant/locate';
import { checkClaude, type ClaudeStatus, outputOf } from './assistant/setup';
import { type Conversation, createConversationStore } from './assistant/conversations';
import { type AssistantMode, accountsInScope, scopeList, scopeOfAccount } from '../shared/assistant-scope';
import { type AssistantEngine, isEngine, type ScopeConfig, scopeConfig } from '../shared/assistant-engines';
import type { ChatMessage } from '../shared/assistant-history';
import { type AssistantOverlay, createAssistantOverlay } from './views/assistant-overlay';
import { execFile } from 'node:child_process';
import { assistantPrompt } from './assistant/prompt';
import { assistantTools, confirmSummary } from './assistant/tools';
import { ssoGroups } from '../shared/sso';
import { sidebarStyleOf } from '../shared/spaces';
import { type CookieStore, createGoogleSync, type SyncCookie } from './sso/google-sync';
import type { Store } from './accounts/store';
import { AVATAR_VERSION, createAvatarCache, isFresh } from './avatars/cache';
import { loadCustomImage } from './avatars/custom-image';
import { fetchIcon } from './avatars/fetch-icon';
import { resolveIcon } from './avatars/resolve-icon';
import { emailFromGmailTitle, iconCandidates, type PageIdentity } from './avatars/sources';
import { SERVICE_IPC } from '../shared/service-ipc';
import { backgroundKinds, IDLE_MS, STAGGER_MS, startupPlan, viewPolicy } from './hibernation/policy';
import { createHibernationScheduler } from './hibernation/scheduler';
import { isHomeHost } from './accounts/services';
import { chainStep, isNotionSamlHandoff, isSafeExternal, type LinkDecision, type RedirectChain, routeLink, routePopup, routeRedirect, signInFor } from './links/router';
import { accountIdForShortcut } from './menu/shortcuts';
import { registerNotificationBridge } from './notifications/bridge';
import { createUnreadTracker, dockBadgeText } from './unread/aggregator';
import { errorPageUrl } from './views/error-page';
import { createViewRegistry } from './views/registry';
import { accountSession, clearAccountData } from './views/session';
import { createViewManager, type ViewManager } from './views/view-manager';
import { createSpacePanel } from './views/space-panel';
import { createQuickOverlay, type QuickOverlay } from './views/quick-overlay';
import { type ClaudeIntegration, createClaudeIntegration } from './claude/electron-host';
import { opensOnToday } from '../shared/today';
import { baseName, existingSpace, needsSetup, spaceColours, uniqueName, type SetupApp, type SetupPlan } from '../shared/setup';
import { ACCOUNT_COLORS } from '../shared/ipc';
import { cliLookup, codexCandidates, lookupResult } from './platform';
import { meetingProvider, nativeJoinUrl } from '../shared/meetings';
import { parseUnreadCount } from './ipc-validation';
import { unreadSourceMatches } from '../shared/page-unread';
import { hasTab, hasTabs, mainIsMail, SERVICE_TABS } from '../shared/tabs';
import { customHomeHosts, learnSite } from '../shared/custom-site';
import { bridgeEnv, buildMcpServer, defaultSocketPath, startSocketServer } from './claude/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface AppController {
  snapshot(): UiSnapshot;
  start(): void;
  selectAccount(id: string): void;
  selectByShortcut(n: number): void;
  move(id: string, delta: -1 | 1): void;
  addAccount(input: NewAccountInput): string;
  updateAccount(
    id: string,
    patch: Partial<Pick<Account, 'name' | 'color' | 'muted' | 'hibernateWhenIdle' | 'iconMode' | 'iconSourceAccountId' | 'claudeAccess'>>,
  ): void;
  reorder(ids: string[]): void;
  setModalOpen(open: boolean): void;
  selectGoogleTab(accountId: string, tab: ViewKind): void;
  closeGoogleTab(accountId: string, tab: `extra:${number}`): void;
  showAccountMenu(id: string): void;
  activeWebContents(): WebContents | null;
  layout(): void;
  /** Stop Claude acting in one account, or everywhere. */
  stopClaude(accountId?: string): void;
  /** Makes a Google Meet with the space's Google account and copies its link (the active account's space by default). */
  copyMeetingLink(from?: { spaceId: string }): Promise<void>;
  /** Runs one Claude tool call in a dev session (inspection only; the MCP server makes its own sessions). */
  claudeCall: ReturnType<ClaudeIntegration['session']>['call'];
  claudeConnectInfo(): ClaudeConnectInfo;
  /** The master switch: opens or closes the private socket Claude connects to. */
  setClaudeEnabled(on: boolean): Promise<ClaudeConnectInfo>;
  shutdown(): Promise<void>;
  /** Shows the "All calendars" view instead of an account. */
  openCalendar(): void;
  isCalendarOpen(): boolean;
  calendarCalendars(accountId: string): Promise<{ ok: true; calendars: WritableCalendar[] } | { ok: false; error: WriteError }>;
  calendarGetEvent(accountId: string, calendarId: string, eventId: string): Promise<{ ok: true; event: EditableEvent } | { ok: false; error: WriteError }>;
  calendarCreate(accountId: string, draft: EventDraft, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarUpdate(accountId: string, eventId: string, draft: EventDraft, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarMove(accountId: string, calendarId: string, eventId: string, start: string, end: string, allDay: boolean, scope: WriteScope): Promise<WriteResult>;
  calendarDelete(accountId: string, calendarId: string, eventId: string, scope: WriteScope, sendUpdates: SendUpdates): Promise<WriteResult>;
  calendarRespond(accountId: string, calendarId: string, eventId: string, reply: Reply): Promise<WriteResult>;
  calendarChangeCalendar(accountId: string, fromCalendarId: string, eventId: string, toCalendarId: string): Promise<WriteResult>;
  openToday(): void;
  setOpenOnToday(on: boolean): void;
  openMessage(key: string): void;
  dismissMessage(key: string): void;
  clearMessages(): void;
  setMessagePreviews(on: boolean): void;
  checkForUpdates(): void;
  /** Brings the window forward on Settings → About (where updates are). */
  showUpdates(): void;
  installUpdate(): void;
  setAutoUpdate(on: boolean): void;
  todoAdd(text: string, tag?: Todo['tag']): void;
  todoUpdate(id: string, patch: { text?: string; done?: boolean; tag?: Todo['tag'] | null }): void;
  todoRemove(id: string): void;
  todosClearDone(): void;
  toggleAssistant(open?: boolean): void;
  openExternalLink(url: string): void;
  assistantSend(text: string, target?: { scope: string; conversationId: string | null }): string;
  assistantConversation(id: string): { id: string; scope: string; title: string; messages: ChatMessage[]; working: boolean } | null;
  assistantOpenConversation(id: string): void;
  assistantDeleteConversation(id: string): void;
  assistantSetScope(scope: string): void;
  setAssistantMode(mode: AssistantMode): void;
  setAssistantScopeConfig(scope: string, patch: Partial<ScopeConfig>): void;
  assistantMemoryAdd(scope: string, text: string): void;
  assistantMemoryUpdate(scope: string, id: string, text: string): void;
  assistantMemoryRemove(scope: string, id: string): void;
  skillFetch(url: string): Promise<{ ok: true; url: string; draft: SkillDraft } | { ok: false; error: string }>;
  skillAdd(draft: SkillDraft | null, source: SkillSource, scopes: string[]): void;
  skillUpdate(id: string, patch: Partial<SkillDraft>): void;
  skillRemove(id: string): void;
  skillSetActive(id: string, scope: string, on: boolean): void;
  assistantStop(): void;
  assistantNewChat(): void;
  assistantSetModel(model: AssistantModel, effort: AssistantEffort): void;
  assistantSetWidth(width: number): void;
  assistantStatus(): Promise<ClaudeStatus>;
  assistantSignIn(): Promise<ClaudeStatus>;
  assistantSignInCancel(): void;
  claudeIntegrationStatus(): Promise<ClaudeStatus>;
  codexStatus(): Promise<ClaudeStatus>;
  codexSignIn(): Promise<ClaudeStatus>;
  codexSignInCancel(): void;
  openRouterStatus(): { connected: boolean };
  openRouterConnect(key: string): Promise<{ connected: boolean; error?: string }>;
  openRouterDisconnect(): void;
  openRouterModels(): Promise<OpenRouterModel[]>;
  assistantAsk(text: string): void;
  setAssistantButton(on: boolean): void;
  assistantFabDrag(phase: 'start' | 'end'): void;
  assistantChatResize(phase: 'start' | 'end', edges?: { x?: 'left' | 'right'; y?: 'top' | 'bottom' }): void;
  /** The floating assistant's pages (they may use the UI's IPC). */
  assistantWebContents(): WebContents[];
  /** The Settings page (replaces the account pages, like All calendars). */
  openSettings(section?: string): void;
  openSetup(): void;
  skipSetup(): void;
  finishSetup(plan: SetupPlan): number;
  closeSettings(): void;
  isSettingsOpen(): boolean;
  appInfo(): AppInfo;
  chooseAccountImage(id: string): void;
  /** Asks for confirmation, then removes the account and its data. */
  removeAccountById(id: string): void;
  moveToSpace(accountId: string, spaceId: string | null): void;
  setSpaceAlwaysOpen(id: string, on: boolean): void;
  setSpaceShareGoogle(id: string, on: boolean): void;
  setSpaceGoogleAccount(id: string, accountId: string): void;
  ungroupSpace(id: string): void;
  setWeekStart(v: 0 | 1 | 'auto'): void;
  setSpaceMeetings(scope: string, s: SpaceMeetingSettings): void;
  /** Brings the main window up with that scope's memory. */
  openMemory(scope: string): void;
  /** Who is signed in to this Mac's Claude Code and to each added account. */
  claudeAccountsInfo(): Promise<{ mac: { loggedIn: boolean; email?: string; org?: string; plan?: string } | null; accounts: (ClaudeAccount & { loggedIn: boolean })[] }>;
  /** Adds an account and runs its sign-in (the browser opens); a failed sign-in leaves nothing. */
  claudeAccountAdd(name: string): Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  claudeAccountSignIn(id: string): Promise<{ ok: true } | { ok: false; error: string }>;
  claudeAccountCancel(): void;
  /** Asks first; signs the account out and deletes its folder. Spaces using it stop until they choose another. */
  claudeAccountRemove(id: string): void;
  setMeetingGlobal(patch: Partial<MeetingGlobalSettings>): void;
  /** The transcription bar: the Ask answer, pause, resume, stop and the meeting's language. */
  meetingAnswer(yes: boolean, never: boolean): void;
  meetingPause(): void;
  meetingResume(): void;
  meetingStop(): void;
  meetingSetLanguage(locale: string): void;
  meetingCopyNotice(): void;
  meetingInstallLocale(locale: string): void;
  meetingBarWebContents(): WebContents | null;
  meetingRun(scope: string, id: string, actions: MeetingAction[]): void;
  meetingGet(scope: string, id: string): Meeting | null;
  meetingDelete(scope: string, id: string): void;
  meetingOpenDraft(scope: string, id: string): void;
  meetingCopySummary(scope: string, id: string): void;
  meetingSaveNote(scope: string, id: string, index: number): void;
  meetingCreateEvent(scope: string, id: string): void;
  openMeetings(scope?: string, id?: string): void;
  modelDownload(id: ModelId): void;
  modelCancel(id: ModelId): void;
  modelDelete(id: ModelId): void;
  meetingCapabilities(): Promise<{ apple: { supported: string[]; installed: string[] } } | null>;
  appleLocaleRemove(locale: string): void;
  /** The recorder (the hidden capture page and its audio). */
  captureHost(): CaptureHost;
  /** Listens to the recorder's audio frames and state. */
  onCapture(pcm: (ch: 'me' | 'call', data: Int16Array) => void, state: (s: CaptureState) => void): () => void;
  /** Changes the interface language: the menus are rebuilt and every Mission Desk page reloads in it. */
  setLanguage(v: LanguageSetting): void;
  /** The interface language and the locale for dates (each page reads it when it loads). */
  localeInfo(): { locale: Locale; format: string; system: Locale };
  /** How to rebuild the app menu (set once by index.ts). */
  setMenuBuilder(build: () => void): void;
  showDataFolder(): void;
  showClaudeLog(): void;
  loadCalendar(range: CalendarRange, force: boolean): Promise<CalendarData>;
  /** Opens a calendar event or Meet link inside that Google account. */
  openCalendarLink(accountId: string, url: string): void;
  joinMeeting(accountId: string, url: string): void;
  setCalendarHidden(accountId: string, hidden: boolean): void;
  createSpace(name: string, accountIds: string[]): void;
  renameSpace(id: string, name: string): void;
  dropInSidebar(drag: DragRef, target: DragRef, zone: DropZone): { create: [string, string] } | null;
  showSpaceMenu(id: string): void;
  showAddMenu(): void;
  /** The ⚡ button's menu of one-click actions for the current space. */
  showActionsMenu(): void;
  /** One of the floating button's quick actions was picked. */
  quickPick(action: DialAction): void;
  /** A pop-up over the current page for a new event, with the current space's Google account. */
  newEvent(): void;
  /** A pop-up over the current page for a new to-do, tagged with the current space. */
  newTodo(): void;
  quickClose(): void;
  /** The pop-up saved: it closes and the ⚡ button confirms with `message`. */
  quickDone(message: string): void;
  quickWebContents(): WebContents | null;
  sidebarStyle(): SidebarStyle;
  setSidebarStyle(style: SidebarStyle): void;
  setSpaceOpen(id: string, open: boolean): void;
  openSpacePanel(id: string, top: number): void;
  closeSpacePanel(): void;
  /** The overlay panel's web contents (it may read the snapshot and select accounts). */
  spacePanelWebContents(): WebContents | null;
}

export interface ControllerDeps {
  win: BrowserWindow;
  store: Store;
  preloadPath: string;
  /** The UI page's preload (for the "Folders with panel" overlay). */
  uiPreloadPath: string;
}

export function createAppController({ win, store, preloadPath, uiPreloadPath }: ControllerDeps): AppController {
  // The interface language: Settings' choice, else the Mac's first language Mission Desk has.
  let localeNow = resolveLocale(store.state().language, app.getPreferredSystemLanguages());
  setLocale(localeNow.locale, localeNow.format);
  let rebuildMenu = (): void => {};
  // Meeting recording: the hidden capture page. Only it may use the microphone among Mission Desk's own pages.
  const capturePcmCbs = new Set<(ch: 'me' | 'call', data: Int16Array) => void>();
  const captureStateCbs = new Set<(s: CaptureState) => void>();
  const capture = createCaptureHost({
    createPage: () => capturePage(uiPreloadPath),
    onPcm: (ch, data) => capturePcmCbs.forEach((cb) => cb(ch, data)),
    onState: (s) => captureStateCbs.forEach((cb) => cb(s)),
  });
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission !== 'media' || (!!wc && capture.isCapturePage(wc))));
  session.defaultSession.setPermissionCheckHandler((wc, permission) => permission !== 'media' || (!!wc && capture.isCapturePage(wc)));
  const registry = createViewRegistry<WebContentsView>();
  /** Pages Claude asked to load: a redirect off the service is cancelled, never opened in the browser (it could carry data out). */
  const assistantLoads = new WeakMap<WebContents, string>();
  const assistantNavigation = new WeakSet<WebContents>();
  let quitting = false;
  app.on('before-quit', () => (quitting = true));
  // "Folders with panel" overlay; created once the controller exists (it pushes snapshots).
  let spacePanel: ReturnType<typeof createSpacePanel> | undefined;
  let quick: QuickOverlay | undefined;
  function account(id: string): Account | undefined {
    return store.state().accounts.find((a) => a.id === id);
  }

  // --- Account icons (company logo, else person photo, else the letter) ----
  const avatars = createAvatarCache(app.getPath('userData'));
  const identities = new Map<string, PageIdentity>();
  const fetching = new Set<string>();

  function updateIdentity(accountId: string, patch: Partial<PageIdentity>): void {
    const a = account(accountId);
    if (!a) return;
    const current = identities.get(accountId) ?? { service: a.service };
    const next = { ...current, ...patch, service: a.service };
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    identities.set(accountId, next);
    void refreshIcon(a, next);
  }

  async function refreshIcon(a: Account, identity: PageIdentity): Promise<void> {
    const candidates = iconCandidates(identity);
    if (candidates.length === 0 || fetching.has(a.id) || isFresh(avatars.get(a.id), candidates, Date.now())) return;
    fetching.add(a.id);
    try {
      const dataUrl = await fetchIcon(candidates, accountSession(a.id, a.service));
      if (!account(a.id)) return; // removed meanwhile
      avatars.set(a.id, { dataUrl, sourceUrl: candidates.join('|'), fetchedAt: Date.now(), version: AVATAR_VERSION });
      push();
    } finally {
      fetching.delete(a.id);
    }
  }

  const iconContext = {
    image: (key: string) => avatars.get(key)?.dataUrl ?? null,
    account,
  };

  async function chooseCustomImage(a: Account): Promise<void> {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: t('main.icon.chooseTitle', { name: a.name }),
      properties: ['openFile'],
      filters: [{ name: t('main.icon.imagesFilter'), extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp', 'tiff'] }],
    });
    if (canceled || !filePaths[0] || !account(a.id)) return;
    const dataUrl = loadCustomImage(filePaths[0]);
    if (!dataUrl) {
      void dialog.showMessageBox(win, { type: 'warning', message: t('main.icon.openFailed'), detail: t('main.icon.openFailedDetail') });
      return;
    }
    avatars.set(`custom:${a.id}`, { dataUrl, sourceUrl: 'custom', fetchedAt: Date.now(), version: AVATAR_VERSION });
    controller.updateAccount(a.id, { iconMode: 'custom' });
  }

  ipcMain.on(SERVICE_IPC.identity, (e, payload: { photoUrl?: unknown; companyIconUrl?: unknown }) => {
    const owner = registry.accountFor(e.sender.id);
    if (!owner || owner.kind !== 'main') return;
    const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length < 2048 ? v : undefined);
    updateIdentity(owner.accountId, { photoUrl: str(payload?.photoUrl), companyIconUrl: str(payload?.companyIconUrl) });
  });

  ipcMain.on(SERVICE_IPC.unread, (e, count: unknown) => {
    const owner = registry.accountFor(e.sender.id);
    const n = parseUnreadCount(count);
    const svc = owner && account(owner.accountId)?.service;
    if (!owner || !svc || n === null) return;
    if (!unreadSourceMatches(svc, owner.kind, e.senderFrame?.url ?? '')) return; // e.g. Outlook's view on a Teams page
    if (unread.set(owner.accountId, owner.kind, n)) push();
  });

  // The private socket Claude's bridge connects to; open only while the switch is on.
  let socketServer: { close(): Promise<void> } | null = null;
  let socketError: string | undefined;
  const socketPath = (): string =>
    (!app.isPackaged && process.env.MISSIONDESK_SOCKET) || defaultSocketPath(app.getPath('userData'));

  function claudeConnectInfo(): ClaudeConnectInfo {
    const exe = app.getPath('exe');
    const bridge = path.join(__dirname, 'mcp-bridge.js');
    const env = bridgeEnv(socketPath(), os.homedir());
    const envFlags = Object.entries(env).map(([k, v]) => `-e ${k}=${v}`).join(' ');
    return {
      enabled: !!store.state().claudeEnabled,
      claudeCode: `claude mcp add missiondesk ${envFlags} -- "${exe}" "${bridge}"`,
      desktopJson: JSON.stringify({ mcpServers: { missiondesk: { command: exe, args: [bridge], env } } }, null, 2),
      ...(socketError ? { error: socketError } : {}),
    };
  }

  async function setClaudeEnabled(on: boolean): Promise<ClaudeConnectInfo> {
    store.setClaudeEnabled(on);
    socketError = undefined;
    if (on && !socketServer) {
      try {
        socketServer = await startSocketServer(socketPath(), () => claude.session().call);
      } catch (e) {
        socketError = t('main.claude.socketError', { error: (e as Error).message });
        store.setClaudeEnabled(false);
      }
    }
    if (!on && socketServer) {
      await socketServer.close();
      socketServer = null;
      claude.stop();
    }
    push();
    return claudeConnectInfo();
  }

  const unread = createUnreadTracker();
  const hibernated = new Set<string>(); // account ids whose main view is hibernated
  const extras = new Map<string, { kind: `extra:${number}`; title: string }[]>();
  let nextExtra = 1;

  const key = (accountId: string, kind: ViewKind): string => `${accountId}|${kind}`;
  const idleMs =
    !app.isPackaged && Number(process.env.MISSIONDESK_IDLE_MS) > 0 ? Number(process.env.MISSIONDESK_IDLE_MS) : IDLE_MS;
  const scheduler = createHibernationScheduler({
    idleMs,
    onHibernate(k) {
      const [accountId, kind] = k.split('|') as [string, ViewKind];
      viewManager.hibernate(accountId, kind);
      if (kind === 'main') {
        hibernated.add(accountId);
        push();
      }
    },
  });

  const viewManager: ViewManager = createViewManager(win, {
    registry,
    preloadPath,
    isHomeUrl: (a, url) => isHomeUrl(account(a.id) ?? a, url),
    onViewCreated: (a, kind, view) => {
      scheduler.register(key(a.id, kind), viewPolicy(a, kind));
      wireView(a, kind, view);
      assistantOverlay?.raise(); // the floating assistant stays above every page
    },
    onVisibilityChanged: (accountId, kind, visible) => {
      scheduler.setVisible(key(accountId, kind), visible);
      if (meetingsOn) setImmediate(placeMeetingBar);
    },
    // A page closed itself: an extra tab closes like a browser tab; an app's own page comes back
    // where it was (it would otherwise stay blank until a restart).
    onViewGone: (a, kind, onScreen) => {
      // Next tick: when the window itself is closing, its pages go first and nothing must reopen.
      if (meetingsOn) detector.viewGone(a.id, kind);
      setImmediate(() => {
        if (quitting || win.isDestroyed()) return;
        scheduler.unregister(key(a.id, kind));
        if (kind.startsWith('extra:')) {
          controller.closeGoogleTab(a.id, kind as `extra:${number}`);
          const current = account(a.id);
          if (current && onScreen && !viewManager.current()) show(current, activeKind(current)); // back to the tab it came from
          return;
        }
        const current = account(a.id);
        if (current && onScreen && !viewManager.current()) viewManager.show(current, kind);
        push();
      });
    },
    topInset: (accountId) => (claude.acting().includes(accountId) ? CLAUDE_BANNER_HEIGHT : 0),
  });

  // --- Claude control (MCP) ---------------------------------------------------
  const claude: ClaudeIntegration = createClaudeIntegration({
    win,
    userData: app.getPath('userData'),
    accounts: () => store.state().accounts,
    account,
    ensure: (a, kind, url) => {
      const view = viewManager.ensure(a, kind, url);
      if (url) assistantLoads.set(view.webContents, url); // its redirects never leave the app
      return view;
    },
    extraKinds: (id) => (extras.get(id) ?? []).map((t) => t.kind),
    currentKind: (id) => (viewManager.current()?.accountId === id ? viewManager.current()!.kind : null),
    inCall: (id, kind) => inCall.has(key(id, kind)),
    show: (id, kind) => {
      claudeShowing = true; // Claude bringing a page on screen must not switch the assistant's space
      try {
        if (tabbed(id)) controller.selectGoogleTab(id, kind);
        else controller.selectAccount(id);
      } finally {
        claudeShowing = false;
      }
    },
    openExtra: (a, url) => {
      const tab = addExtraTab(a, url, false);
      const view = registry.get(a.id, tab);
      if (view) assistantLoads.set(view.webContents, url); // its redirects never leave the app
      return tab;
    },
    unread: (id) => unread.get(id),
    onChange: () => {
      viewManager.layout();
      push();
    },
    // A peeked page is drawn on top for the capture; the floating assistant goes back above it.
    peek: (id, kind, fn) => viewManager.peek(id, kind, fn).finally(() => assistantOverlay?.raise()),
  });
  const devSession = claude.session(); // for claudeCall (dev inspection)

  // --- All calendars ------------------------------------------------------------
  let calendarOpen = false;
  let settingsOpen = false;
  let settingsSection: string | null = null; // the section Settings opens on (e.g. Assistant from the chat)
  // The first-run setup is on screen. Known from the start, so the first snapshot already says so
  // (no flash of the empty screen before it).
  let setupOpen = needsSetup(store.state());
  // New versions, from the GitHub releases (only in an installed app).
  let updateNotice: Notification | null = null;
  const updates = createUpdater({
    mode: updateMode(process.platform, process.env, app.isPackaged),
    logFile: path.join(app.getPath('userData'), 'updates.log'),
    enabled: () => store.state().autoUpdate !== false,
    onChange: (st) => {
      // Once, when it's ready: the page views cover the window, so a native notification says so.
      if (st.kind === 'ready' && Notification.isSupported()) {
        // Kept, so its click still works later (a collected notification loses its handler).
        updateNotice = new Notification({ title: t('main.updates.readyTitle', { version: st.version }), body: t('main.updates.readyBody') });
        updateNotice.on('click', () => controller.showUpdates());
        updateNotice.show();
      }
      push();
    },
  });

  // Home's message list (memory only), the unread counts it was last trimmed against, and the
  // accounts that sent a notification this session (Home's hint about mail notifications).
  let messages: Feed = [];
  const lastUnread = new Map<string, UnreadCount>();
  const notified = new Set<string>();
  // A burst of notifications (an app reconnecting) makes one update, not one each.
  let pushQueued = false;
  function pushSoon(): void {
    if (pushQueued) return;
    pushQueued = true;
    setTimeout(() => {
      pushQueued = false;
      push();
    }, 100);
  }
  let todayOpen = false;
  let meetingsOpen = false;
  let meetingsFocus: { scope?: string; id?: string } | undefined;
  const todos = createTodoStore(path.join(app.getPath('userData'), 'todos.json'));
  // The assistant's notes, kept apart per space (one space's assistant never sees another's).
  const memory = createMemoryStore(path.join(app.getPath('userData'), 'assistant', 'memory.json'));
  // The skills library; each skill is on per scope, and a scope's assistant sees only its own.
  const skills = createSkillsStore(path.join(app.getPath('userData'), 'assistant', 'skills.json'));
  const macWeekStart = ((): 0 | 1 => {
    try {
      return weekStartFrom(systemPreferences.getUserDefault('AppleFirstWeekday', 'dictionary'));
    } catch {
      return 1;
    }
  })();
  const calendarFetcher = createCalendarFetcher({
      async fetch(accountId, url, headers, signal, init) {
        const res = await accountSession(accountId, 'google').fetch(url, {
          headers,
          signal,
          credentials: 'include',
          cache: 'no-store',
          ...(init ? { method: init.method, body: init.body } : {}),
        });
        return { status: res.status, text: () => res.text() };
      },
      async cookie(accountId) {
        const cookies = await accountSession(accountId, 'google').cookies.get({ url: CALENDAR_ORIGIN });
        return (cookies.find((c) => c.name === 'SAPISID') ?? cookies.find((c) => c.name === '__Secure-3PAPISID'))?.value ?? null;
      },
      now: () => Date.now(),
  });
  const calendar = createCalendarService({
    googleAccounts: () => store.state().accounts.filter((a) => a.service === 'google').map((a) => a.id),
    hidden: () => store.state().calendarHidden ?? [],
    fetcher: calendarFetcher,
    now: () => Date.now(),
  });
  const calendarWriter = createCalendarWriter(calendarFetcher);

  // --- Meeting transcription (macOS): detection → orchestrator → helper; text stored per scope ---
  const meetingsOn = process.platform === 'darwin';
  const meetingStore = createMeetingStore(path.join(app.getPath('userData'), 'meetings'));
  const helperPath = app.isPackaged ? path.join(process.resourcesPath, 'md-transcriber') : path.join(app.getAppPath(), 'build', 'bin', 'md-transcriber');
  let transcriber: Transcriber | null = null;
  const transcriberNow = (): Transcriber =>
    (transcriber ??= createTranscriber({ spawn: () => spawn(helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] }), now: () => Date.now() }));
  const meetingScopes = (): string[] => ['nospace', ...(store.state().spaces ?? []).map((sp) => `space:${sp.id}`)];
  const meetingScopeName = (scope: string): string => (scope === 'nospace' ? t('common.noSpace') : ((store.state().spaces ?? []).find((sp) => `space:${sp.id}` === scope)?.name ?? ''));
  const meetingSettingsFor = (scope: string): SpaceMeetingSettings =>
    scope === 'nospace' ? spaceMeetingSettings({ meetings: store.state().meetings?.nospace }) : spaceMeetingSettings((store.state().spaces ?? []).find((sp) => `space:${sp.id}` === scope));
  const orchestrator = createOrchestrator({
    store: meetingStore,
    transcriber: transcriberNow,
    capture,
    onCapture: (pcm, state) => controller.onCapture(pcm, state),
    settingsFor: meetingSettingsFor,
    setSpaceMeetings: (scope, s) => store.setSpaceMeetings(scope, s),
    engineFor: () => {
      const chosen = store.state().meetings?.engine ?? 'apple';
      if (chosen !== 'apple') {
        const dir = models.installed(chosen);
        if (dir) return { engine: chosen, modelDir: dir };
        const reason = t('meetings.engine.missing', { engine: engineName(chosen) });
        if (appleOk) return { engine: 'apple', modelDir: null, fellBack: t('meetings.notice.fellBack', { reason }) };
      }
      if (!appleOk) {
        const other = installedModel();
        if (other) return { ...other, fellBack: t('meetings.engine.needsMacos26') };
      }
      return { engine: 'apple', modelDir: null };
    },
    alternateEngine: () => installedModel(),
    defaultLanguage: () => meetingLocale(localeNow.locale, localeNow.format),
    scopeOf: (accountId) => {
      const a = account(accountId);
      return a ? scopeOfAccount(a, 'space') : null;
    },
    scopes: meetingScopes,
    async matchEvent(accountId, url, at) {
      const a = account(accountId);
      if (!a) return undefined;
      const scope = scopeOfAccount(a, 'space');
      const data = await calendar.load({ start: new Date(at - 12 * 3_600_000).toISOString(), end: new Date(at + 12 * 3_600_000).toISOString() }, false).catch(() => null);
      const ownCalendars = data ? eventsOfScope(data.events, (id) => { const x = account(id); return x ? scopeOfAccount(x, 'space') : null; }, scope) : [];
      const ev = matchEvent(ownCalendars, url, at);
      return ev ? { event: { accountId: ev.accountId, eventId: ev.id, calendarId: ev.calendarId, googleEventId: ev.eventId }, title: ev.title } : undefined;
    },
    titleFor: (provider, accountId) => t('meetings.defaultTitle', { provider: PROVIDER_NAME[provider], account: account(accountId)?.name ?? '' }),
    webContentsOf: (accountId, kind) => registry.get(accountId, kind)?.webContents ?? null,
    probe: (accountId, kind, provider) => {
      const wc = registry.get(accountId, kind)?.webContents;
      if (wc && !wc.isDestroyed()) wc.send(SERVICE_IPC.meetingProbeControl, provider);
    },
    probeReliable: (provider) => PROBE_RELIABLE[provider],
    push: () => push(),
    ended: (m) => {
      push();
      const scopeName = meetingScopeName(m.scope);
      const info: MeetingEndedInfo = {
        scope: m.scope,
        id: m.id,
        title: m.title,
        minutes: Math.max(1, Math.round((Date.parse(m.endedAt ?? m.startedAt) - Date.parse(m.startedAt)) / 60_000)),
        language: m.language,
        spaceName: scopeName,
        defaults: meetingSettingsFor(m.scope).actions ?? DEFAULT_ACTIONS,
        askAvailable: askFor(m.scope) !== null,
      };
      if (!win.isDestroyed()) win.webContents.send(IPC.meetingEnded, info);
    },
    now: () => Date.now(),
  });
  const meetingRunner = createMeetingRunner({
    store: meetingStore,
    askFor: (scope) => askFor(scope),
    notes: (scope) => memory.list(scope).map((n) => n.text),
    async guests(m) {
      const e = m.event;
      const owner = e ? account(e.accountId) : undefined;
      // Only an event of the meeting's own space (never another client's calendar).
      if (!e?.calendarId || !e.googleEventId || !owner || owner.service !== 'google' || scopeOfAccount(owner, 'space') !== m.scope) return [];
      const r = await calendarWriter.getEvent(e.accountId, e.calendarId, e.googleEventId).catch(() => null);
      return r?.ok ? r.event.guests : [];
    },
    myName: () => 'Me',
    addTodo: (text, tag, extra) => void todos.add(text, tag, extra),
    tagFor: (scope) => todoTagFor(scope),
    saveActions: (scope, actions) => store.setSpaceMeetings(scope, { ...meetingSettingsFor(scope), actions }),
    progress: (m, state, message) => {
      const space = meetingScopeName(m.scope);
      if (state === 'busy') assistantOverlay?.toast({ state: 'busy', title: t('meetings.run.busy', { title: m.title }) });
      else if (state === 'error') assistantOverlay?.toast({ state: 'error', title: t('meetings.run.failed', { title: m.title, reason: message ?? '' }) });
      else {
        assistantOverlay?.toast({ state: 'done', title: t('meetings.run.done', { space, title: m.title }) });
        if (!win.isFocused()) new Notification({ title: t('meetings.run.done', { space, title: m.title }) }).show();
      }
    },
    push: () => push(),
  });
  let localeInstall: { locale: string; fraction: number } | null = null;
  const models = createModelManager({ dir: path.join(app.getPath('userData'), 'models'), fetch: ((u: string, init?: RequestInit) => net.fetch(String(u), init)) as typeof fetch, manifest: MODEL_MANIFEST as Manifest });
  /** Apple's engine needs macOS 26. */
  const appleOk = meetingsOn && Number(process.getSystemVersion().split('.')[0]) >= 26;
  const engineName = (id: EngineId): string => t(id === 'apple' ? 'meetings.engine.apple' : id === 'whisper' ? 'meetings.engine.whisper' : 'meetings.engine.parakeet');
  const installedModel = (): { engine: EngineId; modelDir: string } | null => {
    for (const id of ['whisper', 'parakeet'] as const) {
      const dir = models.installed(id);
      if (dir) return { engine: id, modelDir: dir };
    }
    return null;
  };
  const engineStatuses = (): EngineStatus[] => [
    { id: 'apple', state: appleOk ? 'ready' : 'unavailable', bytes: 0, ...(appleOk ? {} : { reason: t('meetings.engine.needsMacos26') }) },
    models.status('whisper'),
    models.status('parakeet'),
  ];
  let modalOpen = false;
  let prunedFor: string | null = null;
  let lastBarMode: 'ask' | 'live' | null = null;
  const meetingBar = createMeetingOverlay(win, { uiPreloadPath });
  /** The bar follows the live (or asking) meeting's view: on it while it's on screen, hidden otherwise. */
  const currentBarTarget = () => barTarget(orchestrator.liveView(), orchestrator.asking(), (accountId, kind) => !!registry.get(accountId, kind)?.getVisible());
  function placeMeetingBar(): void {
    if (!meetingsOn) return;
    const target = modalOpen ? null : currentBarTarget();
    // The bar's content follows where it is (Ask over the asking call, controls over the live one).
    if ((target?.mode ?? null) !== lastBarMode) {
      lastBarMode = target?.mode ?? null;
      pushSoon();
    }
    const view = target ? registry.get(target.accountId, target.kind) : undefined;
    if (!target || !view) return meetingBar.place(null);
    const lines = target.mode === 'live' && orchestrator.live()?.notice ? 2 : 1;
    meetingBar.place(meetingBarBounds(view.getBounds(), lines));
  }
  /**
   * A space removed by a change (ungrouped, or its last app moved or removed) takes its meetings with
   * it: asks first when it has any. True: go ahead.
   */
  function confirmMeetingsLoss(accountsAfter: { spaceId?: string }[]): boolean {
    const lost = spacesLeftEmpty(store.state().spaces ?? [], accountsAfter)
      .map((sp) => ({ sp, n: meetingStore.count(`space:${sp.id}`) }))
      .filter((x) => x.n > 0);
    if (!lost.length) return true;
    const count = lost.reduce((n, x) => n + x.n, 0);
    const r = dialog.showMessageBoxSync(win, {
      type: 'warning',
      message: t('meetings.deleteWithSpace.title', { space: lost.map((x) => x.sp.name).join(', ') }),
      detail: t('meetings.deleteWithSpace.detail', { count }),
      buttons: [t('common.delete'), t('common.cancel')],
      defaultId: 1,
      cancelId: 1,
    });
    return r === 0;
  }
  // Transcripts older than the chosen period go (summaries stay): at start, then daily.
  const retention = (): void => void applyRetention(meetingStore, store.state().meetings?.retentionDays);
  if (meetingsOn) {
    retention();
    setInterval(retention, 24 * 3_600_000).unref?.();
  }
  const detector = createDetector({
    onStart: (m) => void orchestrator.start(m),
    onEnd: (accountId, kind, key) => void orchestrator.end(accountId, kind, key),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  });
  if (meetingsOn) orchestrator.recover();
  ipcMain.on(SERVICE_IPC.meetingProbe, (e, r: unknown) => {
    const owner = registry.accountFor(e.sender.id);
    if (!owner || typeof r !== 'object' || r === null) return;
    const o = r as { speaking?: unknown; muted?: unknown };
    const speaking = Array.isArray(o.speaking) ? o.speaking.filter((x): x is string => typeof x === 'string').map(cleanName).filter((x): x is string => !!x).slice(0, 20) : [];
    orchestrator.onProbe(owner.accountId, owner.kind, { speaking, muted: typeof o.muted === 'boolean' ? o.muted : null });
  });
  const isGoogleAccount = (id: string): boolean => account(id)?.service === 'google';
  const tabbed = (id: string): boolean => { const a = account(id); return !!a && hasTabs(a.service); };
  const NOT_ALLOWED = { ok: false, error: 'error' } as const;
  const MEET_ERRORS: Record<WriteError, MessageKey> = {
    'signed-out': 'main.meet.errorSignedOut',
    offline: 'main.meet.errorOffline',
    forbidden: 'main.meet.errorForbidden',
    unsupported: 'main.meet.errorUnsupported',
    error: 'main.meet.errorGeneric',
  };
  /**
   * A quick action finished: a tick on the ⚡ button, and a toast beside the floating button.
   * False when the floating button isn't there to show it.
   */
  function actionDone(message: string, detail?: string): boolean {
    if (!win.webContents.isDestroyed()) win.webContents.send(IPC.actionDone, message);
    return assistantOverlay?.toast({ state: 'done', title: message, ...(detail ? { detail } : {}) }) ?? false;
  }

  let meetBusy = false;
  async function copyMeetingLink(from?: { spaceId: string }): Promise<void> {
    if (meetBusy) return; // a second press while one is on its way
    const st = store.state();
    const activeId = st.activeAccountId && account(st.activeAccountId) ? st.activeAccountId : undefined;
    const source = from ?? (activeId ? { accountId: activeId } : undefined);
    const id = source ? googleAccountFor(st.accounts, st.spaces ?? [], source) : null;
    // Beside the floating button when it's on screen, else a system notification.
    const tell = (title: string, body: string): void => {
      if (Notification.isSupported()) new Notification({ title, body, silent: true }).show();
    };
    const fail = (body: string): void => {
      if (!assistantOverlay?.toast({ state: 'error', title: t('main.meet.noLink'), detail: body })) tell(t('main.meet.noLink'), body);
    };
    if (!id) return fail(t('main.meet.noGoogle'));
    meetBusy = true;
    assistantOverlay?.toast({ state: 'busy', title: t('main.meet.creating') });
    try {
      let url = '';
      const r = await calendarWrite(id, async () => {
        const m = await calendarWriter.quickMeet(id);
        if (!m.ok) return m;
        url = m.url;
        return { ok: true };
      });
      if (r.ok) {
        clipboard.writeText(url);
        const paste = process.platform === 'darwin' ? '⌘V' : 'Ctrl+V';
        const copied = t('main.meet.copied');
        if (!actionDone(copied, t('main.meet.copiedDetail', { link: url.replace(/^https:\/\//, ''), keys: paste }))) tell(copied, t('main.meet.copiedBody', { url, keys: paste }));
      } else fail(t(MEET_ERRORS[r.error]));
    } catch {
      fail(t(MEET_ERRORS.error));
    } finally {
      meetBusy = false;
    }
  }

  /** Runs a write for a Google account, then drops its cached ranges so the view reloads fresh. */
  async function calendarWrite(accountId: string, fn: () => Promise<WriteResult>): Promise<WriteResult> {
    if (!isGoogleAccount(accountId)) return NOT_ALLOWED;
    const r = await fn();
    if (r.ok) calendar.invalidate(accountId); // on failure keep the cache: the view can still show the last update
    return r;
  }

  // --- Shared Google sign-in per space ---------------------------------------
  const NO_STORE: CookieStore = { get: async () => [], set: async () => {}, remove: async () => {}, onChanged: () => () => {} };
  function cookieStore(accountId: string): CookieStore {
    const a = account(accountId);
    if (!a) return NO_STORE; // removed: never recreate its profile
    const cookies = accountSession(a.id, a.service).cookies;
    const url = (c: { domain: string; path: string }): string => `https://${c.domain.replace(/^\./, '')}${c.path || '/'}`;
    const toSync = (c: Electron.Cookie): SyncCookie => ({
      name: c.name,
      value: c.value,
      domain: c.domain ?? '',
      path: c.path ?? '/',
      secure: !!c.secure,
      httpOnly: !!c.httpOnly,
      hostOnly: !!c.hostOnly,
      session: !!c.session,
      expirationDate: c.expirationDate,
      sameSite: c.sameSite,
    });
    return {
      get: async () => (await cookies.get({})).map(toSync),
      set: (c) =>
        cookies.set({
          url: url(c),
          name: c.name,
          value: c.value,
          ...(c.hostOnly ? {} : { domain: c.domain }),
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          ...(c.session || c.expirationDate === undefined ? {} : { expirationDate: c.expirationDate }),
          sameSite: c.sameSite as Electron.CookiesSetDetails['sameSite'],
        }),
      remove: (c) => cookies.remove(url(c), c.name),
      onChanged(cb) {
        const listener = (_e: Electron.Event, c: Electron.Cookie, cause: string, removed: boolean): void => cb(toSync(c), cause, removed);
        cookies.on('changed', listener);
        return () => cookies.off('changed', listener);
      },
    };
  }
  const googleSync = createGoogleSync({ store: cookieStore, alive: (id) => !!account(id) });
  const syncGoogle = (): void => {
    const s = store.state();
    void googleSync.update(ssoGroups(s.accounts, s.spaces ?? []));
  };

  // --- Assistant (the user's own Claude Code, with Mission Desk's tools) -----------
  let assistantOpen = false;
  const ASSISTANT_MIN = 320;
  const ASSISTANT_MAX = 1200;
  const assistantWidth = (): number => Math.max(ASSISTANT_MIN, Math.min(ASSISTANT_MAX, store.state().assistant?.width ?? 380));
  const assistantModel = (): AssistantModel => {
    const m = store.state().assistant?.model;
    return isAssistantModel(m) ? m : 'default';
  };
  const assistantEffort = (): AssistantEffort => {
    const e = store.state().assistant?.effort;
    return isAssistantEffort(e) ? e : 'medium';
  };
  let claudePath: Promise<string | null> | null = null;

  // Per space (default) or one for everything; each scope has its conversations, its own private
  // socket and token, and tools that see only its accounts.
  const secrets = createSecrets(path.join(app.getPath('userData'), 'secrets'), safeStorage);
  const assistantMode = (): AssistantMode => (store.state().assistant?.mode === 'all' ? 'all' : 'space');
  /** A scope's assistant (engine, model, effort): its own choice, else the defaults. */
  const cfg = (scope: string): ScopeConfig => scopeConfig(store.state().assistant, scope);
  function setScopeConfig(scope: string, patch: Partial<ScopeConfig>): void {
    const prefs = store.state().assistant?.scopes ?? {};
    const before = cfg(scope);
    store.setAssistantPrefs({ scopes: { ...prefs, [scope]: { ...(prefs[scope] ?? {}), ...patch } } });
    const after = cfg(scope);
    const switched = engineKey(after) !== engineKey(before);
    if (switched) currentConv.set(scope, null); // another assistant or connection: a new conversation (contexts don't carry over)
    for (const [id, sess] of sessions) {
      if (conversations.get(id)?.scope !== scope) continue;
      if (switched) {
        sess.close(); // turned off, or another connection: nothing keeps running for this space
        sessions.delete(id);
      } else if (after.model !== before.model || after.effort !== before.effort || after.openrouterModel !== before.openrouterModel || after.codexModel !== before.codexModel) {
        sess.setModel(after.engine === 'openrouter' ? after.openrouterModel : after.engine === 'codex' ? after.codexModel : after.model, after.effort);
      }
    }
  }
  const conversations = createConversationStore(path.join(app.getPath('userData'), 'assistant', 'conversations'));
  let pickedScope: string | null = null; // the scope on screen (follows the account on screen in per-space mode)
  let claudeShowing = false; // Claude, not the user, is bringing a page on screen
  // scope → the conversation on screen; null = a new chat. Absent: the scope's latest conversation.
  const currentConv = new Map<string, string | null>();
  const convOf = (scope: string): string | null => (currentConv.has(scope) ? currentConv.get(scope)! : (conversations.list(scope)[0]?.id ?? null));
  const sessions = new Map<string, AssistantSession>(); // conversation → its running Claude Code
  const servers = new Map<string, Promise<{ close(): Promise<void>; sock: string; token: string }>>();
  const scopes = (): { key: string; name: string }[] => scopeList(store.state().accounts, store.state().spaces ?? [], assistantMode());
  function scopeNow(): string {
    const list = scopes();
    if (pickedScope && list.some((x) => x.key === pickedScope)) return pickedScope;
    const cur = viewManager.current();
    const a = cur && account(cur.accountId);
    const follow = a ? scopeOfAccount(a, assistantMode()) : null;
    return follow && list.some((x) => x.key === follow) ? follow : (list[0]?.key ?? 'all');
  }
  /** The accounts a scope may see at all (Claude access is checked on top). */
  const inScope = (scope: string) => (a: { spaceId?: string }): boolean =>
    scope === 'all' || (scope === 'nospace' ? !a.spaceId : scope === `space:${a.spaceId}`);
  const onScreenConv = (): string | null => convOf(scopeNow());
  function scopeLine(scope: string): string {
    const name = scopes().find((x) => x.key === scope)?.name ?? scope;
    const names = accountsInScope(store.state().accounts, scope).map((a) => a.name);
    if (scope === 'all') return `You work across all the user's spaces. Shared accounts: ${names.join(', ') || 'none yet'}.`;
    return `You are the assistant for the space "${name}" only. You can see only its accounts: ${names.join(', ') || 'none shared yet'}. Never refer to other spaces or clients.`;
  }
  /**
   * A scope's notes or skills changed: its idle sessions end quietly, so the next message starts
   * again (same conversation) with the new instructions. A busy one gets them on its next start.
   */
  function refreshInstructions(scope?: string): void {
    for (const [id, sess] of sessions) {
      if ((scope === undefined || conversations.get(id)?.scope === scope) && !sess.busy()) {
        sess.release();
        sessions.delete(id);
      }
    }
  }
  /** Ends idle Claude Code processes that are no longer on screen (each resumes its conversation later). */
  function releaseIdle(): void {
    const keep = onScreenConv();
    for (const [id, sess] of sessions) {
      if (id !== keep && !sess.busy()) {
        sess.release();
        sessions.delete(id);
      }
    }
  }
  /** Looks for Claude Code again after it wasn't found (it may have been installed meanwhile). */
  const lookUpClaude = (): Promise<string | null> =>
    (claudePath ??= findClaude({
      exists: (p) => fs.existsSync(p),
      home: os.homedir(),
      shell: () =>
        new Promise((resolve) => {
          const look = cliLookup('claude', process.platform, process.env.SHELL);
          const child = spawn(look.cmd, look.args, { env: cleanEnv(process.env) });
          const timer = setTimeout(() => (child.kill(), resolve(null)), 5000);
          let out = '';
          child.stdout.on('data', (b: Buffer) => (out += b.toString()));
          child.on('error', () => (clearTimeout(timer), resolve(null)));
          child.on('exit', (code) => (clearTimeout(timer), resolve(code === 0 ? lookupResult(out, process.platform) : null)));
        }),
    }));
  const sharedGoogle = (): Account[] => store.state().accounts.filter((a) => a.service === 'google' && (a.claudeAccess ?? 'off') !== 'off');

  async function screenContext(): Promise<Record<string, unknown>> {
    if (settingsOpen) return { screen: 'Mission Desk settings' };
      if (calendarOpen) return { screen: 'The unified calendar (all Google accounts)' };
      const cur = viewManager.current();
      const a = cur && account(cur.accountId);
      if (!cur || !a) return { screen: 'Nothing open' };
      if ((a.claudeAccess ?? 'off') === 'off') return { screen: 'An account the user has not shared with Claude', service: a.service };
      const wc = registry.get(cur.accountId, cur.kind)?.webContents;
      let selection = '';
      try {
        selection = String((await wc?.executeJavaScriptInIsolatedWorld(1001, [{ code: 'String(window.getSelection() || "").slice(0, 4000)' }])) ?? '');
      } catch {
        // no selection available
      }
      const space = a.spaceId ? store.state().spaces?.find((sp) => sp.id === a.spaceId)?.name : undefined;
      return {
        account: a.name,
        service: a.service,
        ...(space ? { space } : {}),
        tab: mainIsMail(a.service) && cur.kind === 'main' ? 'mail' : cur.kind,
        title: wc?.getTitle() ?? '',
        url: wc?.getURL() ?? '',
        ...(selection.trim() ? { selected_text: `<untrusted_page_content>${selection}</untrusted_page_content>` } : {}),
      };
  }

  /** The assistant tools of one scope: only its accounts are visible. */
  const toolHostFor = (scope: string) => {
    const ok = inScope(scope);
    return {
      async context() {
        const cur = viewManager.current();
        const a = cur && account(cur.accountId);
        if (a && !ok(a)) return { now: new Date().toString(), screen: "An account outside this assistant's space" };
        return toolHost.context();
      },
      googleAccounts: () => toolHost.googleAccounts().filter((g) => ok(account(g.id) ?? {})),
      async loadEvents(range: CalendarRange) {
        const data = await toolHost.loadEvents(range);
        const keep = (id: string): boolean => ok(account(id) ?? { spaceId: '\u0000' });
        return { events: data.events.filter((e) => keep(e.accountId)), status: data.status.filter((x) => keep(x.accountId)) };
      },
      // By account id (names can repeat across spaces).
      unread: () => toolHost.unreadRows().filter((u) => ok(account(u.id) ?? { spaceId: '\u0000' })).map(({ id: _id, ...row }) => row),
      confirmCreate: toolHost.confirmCreate,
      async createEvent(accountId: string, draft: EventDraft, notify: boolean) {
        const a = account(accountId);
        if (!a || !ok(a)) return { ok: false, error: 'forbidden' } as WriteResult;
        return toolHost.createEvent(accountId, draft, notify);
      },
      // Home's data and the notes, cut to this scope: a space's assistant sees only that space.
      recentMessages() {
        const spaceNames = new Map((store.state().spaces ?? []).map((sp) => [sp.id, sp.name]));
        return messagesInScope(messages, store.state().accounts, scope).map(({ message: m, account: a }) => ({
          account: a.name,
          // Space names only for the assistant that already sees every space.
          ...(scope === 'all' && a.spaceId && spaceNames.get(a.spaceId) ? { space: spaceNames.get(a.spaceId)! } : {}),
          title: m.title,
          body: m.body,
          count: m.count,
          at: m.at,
        }));
      },
      todos: () => todosInScope(todos.list(), store.state().accounts, scope),
      addTodo(text: string) {
        const t = todos.add(text, todoTagFor(scope));
        if (t) push();
        return t;
      },
      completeTodo(id: string) {
        const t = todosInScope(todos.list(), store.state().accounts, scope).find((x) => x.id === id && !x.done);
        if (!t) return false;
        todos.update(t.id, { done: true });
        push();
        return true;
      },
      memory: () => memory.list(scope),
      ...meetingsHost(meetingStore, scope),
      async confirmMemory(action: 'remember' | 'forget', note: string) {
        const where = scopes().find((x) => x.key === scope)?.name ?? t('main.assistant.thisSpace');
        if (win.isMinimized()) win.restore();
        win.show();
        const r = await dialog.showMessageBox(win, {
          type: 'question',
          message: action === 'remember' ? t('main.assistant.rememberTitle', { where }) : t('main.assistant.forgetTitle', { where }),
          detail: action === 'remember' ? t('main.assistant.rememberDetail', { note, where }) : t('main.assistant.forgetDetail', { note }),
          buttons: [action === 'remember' ? t('main.assistant.remember') : t('main.assistant.forget'), t('common.cancel')],
          defaultId: 1, // Enter cancels: saving needs a deliberate click
          cancelId: 1,
        });
        return r.response === 0;
      },
      remember(text: string) {
        const r = memory.add(scope, text);
        if (r && r !== 'full') push();
        return r;
      },
      forget(id: string) {
        const done = memory.remove(scope, id);
        if (done) push();
        return done;
      },
      skills: () => skills.activeFor(scope),
      async confirmSkill(draft: SkillDraft) {
        const where = scopes().find((x) => x.key === scope)?.name ?? t('main.assistant.thisSpace');
        if (win.isMinimized()) win.restore();
        win.show();
        const body = draft.instructions.length > 1200 ? `${draft.instructions.slice(0, 1200)}…` : draft.instructions;
        const r = await dialog.showMessageBox(win, {
          type: 'question',
          message: t('main.assistant.saveSkillTitle', { name: draft.name, where }),
          detail: t(draft.mode === 'always' ? 'main.assistant.saveSkillDetailAlways' : 'main.assistant.saveSkillDetailFits', { description: draft.description, instructions: body, where }),
          buttons: [t('common.save'), t('common.cancel')],
          defaultId: 1,
          cancelId: 1,
        });
        return r.response === 0;
      },
      saveSkill(draft: SkillDraft) {
        const r = skills.add(draft, { kind: 'custom' }, [scope]);
        if (r && r !== 'full') push();
        return r;
      },
    };
  };

  const toolHost = {
    async context() {
      const now = { now: new Date().toString() };
      return { ...now, ...(await screenContext()) };
    },
    googleAccounts: () => sharedGoogle().map((a) => ({ id: a.id, name: a.name, act: a.claudeAccess === 'act' })),
    // Every shared calendar, including ones hidden in the unified view (they still have meetings).
    loadEvents: (range: CalendarRange) => calendar.load(range, false, { includeHidden: true }),
    unread: () => toolHost.unreadRows().map(({ id: _id, ...row }) => row),
    unreadRows: () => {
      const spaces = new Map((store.state().spaces ?? []).map((sp) => [sp.id, sp.name]));
      return store
        .state()
        .accounts.filter((a) => (a.claudeAccess ?? 'off') !== 'off')
        .map((a) => {
          const u = unread.get(a.id);
          return { id: a.id, account: a.name, ...(a.spaceId && spaces.get(a.spaceId) ? { space: spaces.get(a.spaceId)! } : {}), unread: u === 'dot' ? ('some' as const) : u };
        });
    },
    async confirmCreate(text: string, hasGuests: boolean) {
      if (win.isMinimized()) win.restore();
      win.show();
      const r = await dialog.showMessageBox(win, {
        type: 'question',
        message: t('main.assistant.createEventTitle'),
        detail: t('main.assistant.createEventDetail', { event: text }),
        buttons: [t('common.create'), t('common.cancel')],
        defaultId: 1, // Enter cancels: creating needs a deliberate click
        cancelId: 1,
        ...(hasGuests ? { checkboxLabel: t('main.assistant.emailGuests'), checkboxChecked: false } : {}),
      });
      return { create: r.response === 0, notify: hasGuests && r.checkboxChecked };
    },
    async createEvent(accountId: string, draft: EventDraft, notify: boolean) {
      const r = await calendarWriter.create(accountId, draft, notify ? 'all' : 'none');
      if (r.ok) calendar.invalidate(accountId);
      return r;
    },
  };

  /** The scope's private socket (started once), with its own token. */
  function serverFor(scope: string) {
    let srv = servers.get(scope);
    if (!srv) {
      const token = crypto.randomBytes(24).toString('hex');
      const sock = defaultSocketPath(app.getPath('userData'), `assistant-${crypto.createHash('sha256').update(scope).digest('hex').slice(0, 10)}.sock`);
      srv = startSocketServer(sock, () => claude.session({ neverSend: true, only: inScope(scope) }).call, assistantTools(toolHostFor(scope)), token).then((server) => ({
        close: () => server.close(),
        sock,
        token,
      }));
      srv.catch(() => servers.delete(scope)); // try again next time
      servers.set(scope, srv);
    }
    return srv;
  }

  const startingSessions = new Map<string, Promise<AssistantSession>>();
  function sessionFor(conv: Conversation): Promise<AssistantSession> {
    const live = sessions.get(conv.id);
    if (live) return Promise.resolve(live);
    let p = startingSessions.get(conv.id); // two sends at once share one start
    if (!p) {
      p = newSession(conv).finally(() => startingSessions.delete(conv.id));
      startingSessions.set(conv.id, p);
    }
    return p;
  }

  /** The scope's Mission Desk tools in this process (for engines Mission Desk drives itself, like OpenRouter). */
  const inProcess = new Map<string, Promise<InProcessTools>>();
  function inProcessToolsFor(scope: string): Promise<InProcessTools> {
    let t = inProcess.get(scope);
    if (!t) {
      t = inProcessTools(buildMcpServer(claude.session({ neverSend: true, only: inScope(scope) }).call, undefined, assistantTools(toolHostFor(scope))));
      t.catch(() => inProcess.delete(scope));
      inProcess.set(scope, t);
    }
    return t;
  }

  async function engineSession(conv: Conversation): Promise<AssistantSession> {
    const c = cfg(conv.scope);
    conversations.setEngine(conv.id, engineKey(c)); // another assistant or connection than before: its session isn't resumed
    const systemPrompt = (): string => assistantPrompt(new Date(), app.getLocale(), scopeLine(conv.scope), memory.list(conv.scope), skills.activeFor(conv.scope));
    if (c.engine === 'codex') {
      const srv = await serverFor(conv.scope);
      const cwd = path.join(app.getPath('userData'), 'assistant', 'codex'); // empty: no project files for Codex to read
      fs.mkdirSync(cwd, { recursive: true });
      const bridge = path.join(__dirname, 'mcp-bridge.js');
      return createCodexSession(
        {
          spawn: (cmd, args, opts) => spawn(cmd, args, { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }),
          codexPath: lookUpCodex,
          env: envFor(conv.scope, 'codex'),
          cwd,
          mcp: () => ({ command: app.getPath('exe'), args: [bridge], env: { ELECTRON_RUN_AS_NODE: '1', MISSIONDESK_SOCKET: srv.sock, MISSIONDESK_TOKEN: srv.token } }),
          instructions: systemPrompt,
        },
        { model: c.codexModel, effort: c.effort, ...(conv.sessionId ? { resume: conv.sessionId } : {}) },
      );
    }
    if (c.engine === 'openrouter') {
      return createOpenRouterSession(
        { fetch: (u, init) => net.fetch(String(u), init), apiKey: async () => keyFor(conv.scope), tools: () => inProcessToolsFor(conv.scope), systemPrompt, history: conv.messages },
        { model: c.openrouterModel, effort: c.effort },
      );
    }
    const srv = await serverFor(conv.scope);
    const cwd = path.join(app.getPath('userData'), 'assistant');
    fs.mkdirSync(cwd, { recursive: true });
    const bridge = path.join(__dirname, 'mcp-bridge.js');
    return createClaudeCodeSession(
      {
        spawn: (cmd, args, opts) => spawn(cmd, args, { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }),
        claudePath: lookUpClaude,
        env: envFor(conv.scope, 'claude'),
        cwd,
        mcpConfig: () =>
          JSON.stringify({
            mcpServers: { missiondesk: { command: app.getPath('exe'), args: [bridge], env: { ELECTRON_RUN_AS_NODE: '1', MISSIONDESK_SOCKET: srv.sock, MISSIONDESK_TOKEN: srv.token } } },
          }),
        systemPrompt,
      },
      { model: c.model, effort: c.effort, ...(conv.sessionId ? { resume: conv.sessionId } : {}) },
    );
  }

  /**
   * A session with no tools at all, on the scope's own engine and model: for requests whose input is
   * untrusted text (a meeting's transcript), so nothing in it can make the assistant act.
   */
  function toollessSession(scope: string, system: () => string): Promise<AssistantSession> {
    const c = cfg(scope);
    if (c.engine === 'codex') {
      const cwd = path.join(app.getPath('userData'), 'assistant', 'codex-followup');
      fs.mkdirSync(cwd, { recursive: true });
      return Promise.resolve(
        createCodexSession(
          { spawn: (cmd, args, opts) => spawn(cmd, args, { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }), codexPath: lookUpCodex, env: envFor(scope, 'codex'), cwd, mcp: () => null, instructions: system },
          { model: c.codexModel, effort: c.effort },
        ),
      );
    }
    if (c.engine === 'openrouter') {
      return Promise.resolve(
        createOpenRouterSession(
          {
            fetch: (u, init) => net.fetch(String(u), init),
            apiKey: async () => keyFor(scope),
            tools: async () => ({ defs: [], call: async () => ({ text: 'No tools.', isError: true }) }),
            systemPrompt: system,
            history: [],
          },
          { model: c.openrouterModel, effort: c.effort },
        ),
      );
    }
    const cwd = path.join(app.getPath('userData'), 'assistant', 'followup');
    fs.mkdirSync(cwd, { recursive: true });
    return Promise.resolve(
      createClaudeCodeSession(
        { spawn: (cmd, args, opts) => spawn(cmd, args, { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }), claudePath: lookUpClaude, env: envFor(scope, 'claude'), cwd, mcpConfig: () => '{"mcpServers":{}}', systemPrompt: system, ephemeral: true },
        { model: c.model, effort: c.effort },
      ),
    );
  }
  /** One tool-less request on the scope's assistant; null when the scope's assistant is off. */
  const askFor = (scope: string): Ask | null =>
    cfg(scope).engine === 'off' ? null : createOneShot((system) => toollessSession(scope, system), cfg(scope).engine === 'codex' ? (id) => deleteCodexRollout(id, codexHomeFor(scope)) : undefined);
  /** The Codex folder a scope's Codex runs in: an added connection's own, or this Mac's. */
  function codexHomeFor(scope: string): string {
    const target = targetFor(scope);
    return target.kind === 'codex' && 'dir' in target ? target.dir : process.env.CODEX_HOME || path.join(app.getPath('home'), '.codex');
  }
  /** Codex keeps every run in <CODEX_HOME>/sessions: a meeting's follow-up mustn't outlive the meeting there. */
  function deleteCodexRollout(threadId: string | null, home: string): void {
    if (!threadId || !/^[\w-]{8,80}$/.test(threadId)) return;
    const root = path.join(home, 'sessions');
    const walk = (dir: string, depth: number): void => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory() && depth < 4) walk(p, depth + 1);
        else if (e.isFile() && e.name.endsWith('.jsonl') && e.name.includes(threadId)) fs.rmSync(p, { force: true });
      }
    };
    walk(root, 0);
  }

  async function newSession(conv: Conversation): Promise<AssistantSession> {
    const session = await engineSession(conv);
    session.onEvent((e) => {
      if (e.type === 'error' && e.kind === 'not-found') {
        claudePath = null; // look again next time (installed meanwhile)
        codexPath = null;
      }
      conversations.applyEvent(conv.id, e);
      sendAssistant(IPC.assistantEvent, { conversationId: conv.id, event: e });
      if ((e.type === 'done' && !e.isError) || e.type === 'error') {
        if (onScreenConv() !== conv.id) {
          // It finished in the background: end its process; it resumes when reopened.
          session.release();
          sessions.delete(conv.id);
        }
        push();
      }
    });
    sessions.set(conv.id, session);
    return session;
  }

  let assistantOverlay: AssistantOverlay | null = null;
  const sendAssistant = (channel: string, value: unknown): void => {
    const chat = assistantOverlay?.chat();
    if (!chat) return;
    if (chat.isLoading()) chat.once('did-finish-load', () => !chat.isDestroyed() && chat.send(channel, value));
    else chat.send(channel, value);
  };

  function setAssistantOpen(open: boolean): void {
    if (open === assistantOpen) return;
    assistantOpen = open;
    assistantOverlay?.setOpen(open);
    push();
  }

  /** Runs the user's Claude Code with a clean environment (no keys or tokens passed on). */
  const runClaude = (cmd: string, args: string[]): Promise<string> =>
    new Promise((resolve, reject) => {
      execFile(cmd, args, { env: cleanEnv(process.env), timeout: 15_000 }, (err, stdout) => {
        try {
          resolve(outputOf(err, String(stdout)));
        } catch (e) {
          reject(e);
        }
      });
    });
  async function claudeStatus(): Promise<ClaudeStatus> {
    claudePath = null; // look again: it may have been installed meanwhile
    return checkClaude({ find: lookUpClaude, run: runClaude });
  }
  // --- Assistant connections: each added Claude Code or Codex one has its own folder (CLAUDE_CONFIG_DIR /
  // CODEX_HOME), each added OpenRouter one its own key. A space runs on its own, never on another. ---
  const connections = createConnections(app.getPath('userData'));
  const targetFor = (scope: string): ConnectionTarget => {
    const c = cfg(scope);
    return c.engine === 'off' ? { kind: 'missing' } : connectionTarget(c.engine, c.connection, connections.list(), connections.dirOf);
  };
  /** What a conversation's session belongs to: its engine, and the connection when it's an added one. */
  const engineKey = (c: ScopeConfig): string => (c.engine === 'off' || c.connection === '' || isBuiltinId(c.connection) ? c.engine : `${c.engine}:${c.connection}`);
  const connectionMissing = (): Error => new Error(t('assistant.error.connectionMissing'));
  /** The environment for the scope's Claude Code or Codex; a removed connection stops the space. */
  function envFor(scope: string, kind: 'claude' | 'codex'): Record<string, string> {
    const target = targetFor(scope);
    if (target.kind !== kind) throw connectionMissing();
    return sessionEnvFor(kind, kind === 'codex' ? codexEnv() : cleanEnv(process.env), target) as Record<string, string>;
  }
  /** The scope's OpenRouter key: its own connection's. */
  function keyFor(scope: string): string | null {
    const name = openRouterKeyName(targetFor(scope));
    if (name === null) throw connectionMissing();
    return secrets.get(name);
  }
  const openRouterReady = (scope: string): boolean => {
    try {
      return keyFor(scope) !== null;
    } catch {
      return false;
    }
  };
  const claudeTargetOf = (id: string): ConnectionTarget => ({ kind: 'claude', id, dir: connections.dirOf(id) });
  const runClaudeIn = (target: ConnectionTarget, args: string[]): Promise<string> =>
    new Promise((resolve, reject) => {
      void lookUpClaude().then((cmd) => {
        if (!cmd || target.kind !== 'claude') return reject(new Error('not available'));
        execFile(cmd, args, { env: connectionEnv(cleanEnv(process.env), target), timeout: 15_000 }, (err, stdout) => {
          try {
            resolve(outputOf(err, String(stdout)));
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  /** A scope's Claude Code: installed, and signed in with the scope's account. */
  async function claudeStatusFor(scope: string): Promise<ClaudeStatus> {
    const target = targetFor(scope);
    if (target.kind !== 'claude') return { state: 'signed-out' };
    if ('builtin' in target) return claudeStatus();
    const base = await claudeStatus();
    if (base.state === 'not-installed') return base;
    const info = parseAuthInfo(await runClaudeIn(target, ['auth', 'status', '--json']).catch(() => ''));
    return { ...base, state: info?.loggedIn ? 'ready' : 'signed-out' };
  }
  let claudeLogin: { child: ReturnType<typeof spawn>; id: string } | null = null;
  /** Runs Claude Code's own sign-in (it opens the browser) for an account's folder; resolves when it ends. */
  async function claudeSignInTo(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const cmd = await lookUpClaude();
    if (!cmd) return { ok: false, error: t('assistant.error.claudeNotInstalled') };
    claudeLogin?.child.kill();
    const target = claudeTargetOf(id);
    let errText = '';
    await new Promise<void>((resolve) => {
      const child = spawn(cmd, ['auth', 'login', '--claudeai'], { env: connectionEnv(cleanEnv(process.env), target), stdio: ['ignore', 'pipe', 'pipe'] });
      claudeLogin = { child, id };
      child.stderr?.on('data', (b: Buffer) => (errText = (errText + b.toString()).slice(-500)));
      child.stdout?.on('data', () => undefined);
      const timer = setTimeout(() => child.kill(), 10 * 60_000);
      const done = (): void => {
        clearTimeout(timer);
        if (claudeLogin?.child === child) claudeLogin = null;
        resolve();
      };
      child.on('error', done);
      child.on('exit', done);
    });
    const info = parseAuthInfo(await runClaudeIn(target, ['auth', 'status', '--json']).catch(() => ''));
    if (!info?.loggedIn) return { ok: false, error: errText.trim() || t('settings.claudeAccounts.signInFailed') };
    connections.setInfo(id, { ...(info.email ? { email: info.email } : {}), ...(info.org ? { org: info.org } : {}), ...(info.plan ? { plan: info.plan } : {}) });
    return { ok: true };
  }
  // --- OpenAI Codex (the user's own Codex CLI) ---
  let codexPath: Promise<string | null> | null = null;
  const codexEnv = (): Record<string, string> => {
    const env = cleanEnv(process.env);
    delete env.OPENAI_API_KEY; // use the user's own Codex sign-in
    delete env.CODEX_API_KEY;
    return env;
  };
  const lookUpCodex = (): Promise<string | null> =>
    (codexPath ??= (async () => {
      const home = os.homedir();
      for (const c of codexCandidates(home, process.platform)) {
        if (fs.existsSync(c)) return c;
      }
      return new Promise<string | null>((resolve) => {
        const look = cliLookup('codex', process.platform, process.env.SHELL);
        const child = spawn(look.cmd, look.args, { env: codexEnv() });
        const timer = setTimeout(() => (child.kill(), resolve(null)), 5000);
        let out = '';
        child.stdout.on('data', (b: Buffer) => (out += b.toString()));
        child.on('error', () => (clearTimeout(timer), resolve(null)));
        child.on('exit', (code) => (clearTimeout(timer), resolve(code === 0 ? lookupResult(out, process.platform) : null)));
      });
    })());
  /** Codex installed, and signed in in that environment's CODEX_HOME (this Mac's by default). */
  async function codexStatus(env: Record<string, string> = codexEnv()): Promise<ClaudeStatus> {
    codexPath = null; // look again (installed meanwhile)
    const cmd = await lookUpCodex();
    if (!cmd) return { state: 'not-installed' };
    const version = await new Promise<string | undefined>((resolve) =>
      execFile(cmd, ['--version'], { env, timeout: 15_000 }, (_e, out) => resolve(/(\d+\.\d+\.\d+)/.exec(String(out))?.[1])),
    );
    // `codex login status` exits 0 when signed in.
    const signedIn = await new Promise<boolean>((resolve) => execFile(cmd, ['login', 'status'], { env, timeout: 15_000 }, (e) => resolve(!e)));
    return { state: signedIn ? 'ready' : 'signed-out', ...(version ? { version } : {}) };
  }
  /** A scope's Codex: installed, and signed in with the scope's connection. */
  async function codexStatusFor(scope: string): Promise<ClaudeStatus> {
    if (targetFor(scope).kind !== 'codex') return { state: 'signed-out' };
    return codexStatus(envFor(scope, 'codex'));
  }
  let codexSignIn: Promise<ClaudeStatus> | null = null;
  let codexSignInChild: ReturnType<typeof spawn> | null = null;
  /** `codex login` opens the browser for the ChatGPT sign-in and ends when done; one at a time. */
  function codexLogin(env: Record<string, string>): Promise<ClaudeStatus> {
    codexSignIn ??= (async () => {
      const cmd = await lookUpCodex();
      if (!cmd) return { state: 'not-installed' } as ClaudeStatus;
      await new Promise<void>((resolve) => {
        const child = spawn(cmd, ['login'], { env, stdio: 'ignore' });
        codexSignInChild = child;
        const timer = setTimeout(() => child.kill(), 10 * 60_000);
        const done = (): void => {
          clearTimeout(timer);
          if (codexSignInChild === child) codexSignInChild = null;
          resolve();
        };
        child.on('error', done);
        child.on('exit', done);
      });
      return codexStatus(env);
    })().finally(() => (codexSignIn = null));
    return codexSignIn;
  }

  let orModels: { at: number; list: OpenRouterModel[] } | null = null;
  let orModelsLoading: Promise<OpenRouterModel[]> | null = null;
  let signIn: Promise<ClaudeStatus> | null = null;
  let signInChild: ReturnType<typeof spawn> | null = null;

  // Pages that failed to load, retried when the network comes back.
  const failed = new Map<WebContents, string>();
  const signingIn = new WeakMap<WebContents, boolean>();
  const chains = new WeakMap<WebContents, RedirectChain>();
  /** A custom app's own hosts; other services' hosts are fixed (SERVICES). */
  const homeHostsOf = (acct: Account): string[] => (acct.service === 'custom' ? customHomeHosts(acct.url, acct.siteMoves) : []);
  const isHomeUrl = (acct: Account, url: string): boolean => {
    try {
      return isHomeHost(acct.service, new URL(url).hostname, homeHostsOf(acct));
    } catch {
      return false;
    }
  };
  setInterval(() => {
    if (failed.size === 0 || !net.isOnline()) return;
    for (const [wc, url] of failed) if (!wc.isDestroyed()) void wc.loadURL(url);
    failed.clear();
  }, 5000).unref();

  const notifications = registerNotificationBridge({
    registry,
    account,
    onClick: (accountId, kind) => openFromNotification(accountId, kind),
    onMessage(m) {
      notified.add(m.accountId);
      const next = addMessage(messages, m, Date.now());
      if (next !== messages) {
        messages = next;
        pushSoon();
      }
    },
    onMessageGone(sender, id) {
      const next = closeMessage(messages, sender, id);
      if (next.length !== messages.length) {
        messages = next;
        pushSoon();
      }
    },
    onInCall: (accountId, kind, inCall) => inCallChanged(accountId, kind, inCall),
    onScreen(accountId, kind) {
      const cur = viewManager.current();
      return win.isVisible() && !win.isMinimized() && win.isFocused() && cur?.accountId === accountId && cur.kind === kind;
    },
  });

  function openFromNotification(accountId: string, kind: ViewKind): void {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    if (tabbed(accountId)) controller.selectGoogleTab(accountId, kind);
    else controller.selectAccount(accountId);
  }

  // When an app's unread count drops, only as many of its lines as it still has unread stay (apps
  // that report no count keep theirs until read, opened or cleared). Removed or muted: gone.
  function pruneMessages(): void {
    const s = store.state();
    const live = new Set(s.accounts.filter((a) => !a.muted).map((a) => a.id));
    for (const a of s.accounts) {
      const now = unread.get(a.id);
      const before = lastUnread.get(a.id);
      if (before !== undefined) messages = trimToUnread(messages, a.id, before, now);
      lastUnread.set(a.id, now);
    }
    for (const id of [...lastUnread.keys()]) if (!s.accounts.some((a) => a.id === id)) lastUnread.delete(id);
    for (const id of [...notified]) if (!s.accounts.some((a) => a.id === id)) notified.delete(id);
    if (messages.some((m) => !live.has(m.accountId))) messages = messages.filter((m) => live.has(m.accountId));
  }

  const inCall = new Set<string>();
  function inCallChanged(accountId: string, kind: ViewKind, active: boolean): void {
    if (meetingsOn) {
      orchestrator.callChanged(accountId, kind, active); // hung up: silence during the detector's hold
      detector.callChanged(accountId, kind, active, registry.get(accountId, kind)?.webContents.getURL() ?? '');
    }
    if (active) inCall.add(key(accountId, kind));
    else inCall.delete(key(accountId, kind));
    scheduler.setInCall(key(accountId, kind), active);
  }
  const busySubApps = (accountId: string): SubApp[] =>
    (['calendar', 'drive', 'meet', 'teams'] as const).filter((k) => inCall.has(key(accountId, k)));

  function openExternal(url: string): void {
    if (isSafeExternal(url)) void shell.openExternal(url);
  }

  /** Acts on a link decision. Returns true if the original navigation may proceed. */
  function follow(a: Account, decision: LinkDecision): boolean {
    switch (decision.kind) {
      case 'stay':
      case 'auth-popup':
        return true;
      case 'external':
        openExternal(decision.url);
        return false;
      case 'subapp': {
        const kind = subAppToKind(decision.subApp);
        viewManager.ensure(a, kind, decision.url);
        controller.selectGoogleTab(a.id, kind);
        return false;
      }
      case 'extra-tab':
        addExtraTab(a, decision.url, true);
        return false;
    }
  }

  const MAX_EXTRA_TABS = 20;

  function addExtraTab(a: Account, url: string, select: boolean): `extra:${number}` {
    const open = extras.get(a.id) ?? [];
    if (open.length >= MAX_EXTRA_TABS) controller.closeGoogleTab(a.id, open[0].kind); // a page can't open tabs without end
    const kind = `extra:${nextExtra++}` as const;
    extras.set(a.id, [...(extras.get(a.id) ?? []), { kind, title: t('common.loading') }]);
    viewManager.ensure(a, kind, url);
    if (select) controller.selectGoogleTab(a.id, kind);
    else push();
    return kind;
  }

  function wireView(a: Account, kind: ViewKind, view: WebContentsView): void {
    const wc = view.webContents;
    wc.setWindowOpenHandler(({ url, disposition, referrer }) => {
      const current = account(a.id);
      if (!current) return { action: 'deny' };
      const decision = routeLink({
        service: current.service,
        url,
        disposition: 'new-window',
        popup: disposition === 'new-window', // window.open with a size: a popup that talks to its opener
        homeHosts: homeHostsOf(current),
        busySubApps: busySubApps(a.id),
      });
      // A blank popup is filled by whoever opened it: only the service's own page may (not an embedded
      // third-party frame, which could draw a fake sign-in in a window with no address bar). A page
      // that sends no referrer is checked by its opener frame in did-create-window.
      if (decision.kind === 'auth-popup' && (url === '' || url === 'about:blank') && referrer?.url && !isHomeUrl(current, referrer.url)) return { action: 'deny' };
      if (decision.kind === 'auth-popup') {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 520,
            height: 680,
            parent: win,
            webPreferences: { session: accountSession(a.id, a.service), contextIsolation: true, sandbox: true },
          },
        };
      }
      follow(current, decision);
      return { action: 'deny' };
    });
    // A sign-in popup: every navigation in it is checked too (it starts blank for MSAL).
    wc.on('did-create-window', (child, details) => {
      const cwc = child.webContents;
      let childSigningIn = signingIn.get(wc) ?? false;
      const blank = details.url === '' || details.url === 'about:blank';
      // A blank popup must come from the service's own top page (checked again here: the opener frame).
      const opener = cwc.opener;
      const acct0 = account(a.id) ?? a;
      if (blank && (!opener || opener.parent !== null || !isHomeUrl(acct0, opener.url))) {
        child.destroy();
        return;
      }
      const openerHost = ((): string => {
        try {
          return new URL(opener?.url ?? wc.getURL()).host;
        } catch {
          return '';
        }
      })();
      // The popup's title bar shows where it is (it has no address bar); while blank, who opened it.
      const showHost = (): void => {
        try {
          const host = new URL(cwc.getURL()).host;
          child.setTitle(host || openerHost || t('main.popup.signIn'));
        } catch {
          child.setTitle(openerHost || t('main.popup.signIn'));
        }
      };
      showHost();
      child.on('page-title-updated', (e) => {
        e.preventDefault();
        showHost();
      });
      cwc.on('did-navigate', showHost);
      const check = (e: { preventDefault(): void; url: string }): void => {
        const acct = account(a.id);
        if (acct && routePopup(acct.service, e.url, cwc.getURL(), childSigningIn, homeHostsOf(acct)) === 'stay') return;
        e.preventDefault();
        if (acct) openExternal(e.url);
        if (!acct || !/^https?:/.test(cwc.getURL())) child.close(); // nothing of the service was ever shown
      };
      cwc.on('will-navigate', check);
      cwc.on('will-redirect', check);
      cwc.on('did-navigate', (_e, url) => {
        const forUs = signInFor(a.service, url, homeHostsOf(a));
        if (forUs !== null) childSigningIn = forUs;
      });
      cwc.setWindowOpenHandler(({ url }) => {
        openExternal(url);
        return { action: 'deny' };
      });
    });
    wc.on('will-navigate', (e) => {
      const current = account(a.id);
      if (!current) return;
      const decision = routeLink({ service: current.service, url: e.url, disposition: 'navigate', currentUrl: wc.getURL(), signingIn: signingIn.get(wc) ?? false, homeHosts: homeHostsOf(current) });
      if (!follow(current, decision)) {
        e.preventDefault();
      }
    });
    // Server redirects are checked too (an open redirect or an OAuth error page must not land in the app).
    wc.on('did-start-navigation', (details) => {
      if (!details.isMainFrame || details.isSameDocument) return;
      const acct = account(a.id) ?? a;
      // Mission Desk's own first load of a view (not a page's link, not an extra tab) may be redirected by the service.
      const trusted = !details.initiator && !/^https?:/.test(wc.getURL()) && !kind.startsWith('extra:');
      // Notion's SSO hand-off: started by Notion's sign-in page itself (its top frame), toward a SAML
      // request on the identity provider. Only that may start a sign-in chain (this event comes before
      // will-navigate, so the starting frame is checked here).
      const handoff =
        acct.service === 'notion' && !!details.initiator && details.initiator.parent === null && isNotionSamlHandoff(details.url, details.initiator.url);
      if (assistantLoads.get(wc) === details.url) {
        assistantLoads.delete(wc);
        assistantNavigation.add(wc);
      } else assistantNavigation.delete(wc);
      chains.set(wc, chainStep(acct.service, details.url, { signIn: false, trusted }, homeHostsOf(acct), handoff));
    });
    wc.on('will-redirect', (details) => {
      if (!details.isMainFrame) return;
      const acct = account(a.id);
      const chain = chains.get(wc) ?? { signIn: false, trusted: false };
      if (acct && routeRedirect({ service: acct.service, url: details.url, chain, homeHosts: homeHostsOf(acct) }) === 'allow') {
        chains.set(wc, chainStep(acct.service, details.url, chain, homeHostsOf(acct)));
        return;
      }
      details.preventDefault();
      if (acct && !assistantNavigation.has(wc)) openExternal(details.url); // a page Claude opened goes nowhere outside
    });
    wc.on('render-process-gone', (_e, details) => {
      if (details.reason === 'clean-exit') return;
      void wc.loadURL(registry.lastUrl(a.id, kind) ?? wc.getURL());
    });
    wc.on('did-fail-load', (_e, code, _desc, url, isMainFrame) => {
      if (!isMainFrame || code === -3 || !/^https?:/.test(url)) return; // -3: aborted, e.g. by a redirect
      failed.set(wc, url);
      void wc.loadURL(errorPageUrl(url));
    });
    let pageNavigated = false; // the page itself navigated (not only its first load and redirects)
    wc.on('will-navigate', () => (pageNavigated = true));
    if (meetingsOn) {
      wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
        if (isMainFrame) detector.urlChanged(a.id, kind, url);
      });
    }
    wc.on('did-navigate', (_e, url) => {
      if (meetingsOn) detector.urlChanged(a.id, kind, url);
      if (/^https?:/.test(url)) failed.delete(wc);
      // A custom app whose address moved on load to another domain of the same site (notion.so → notion.com).
      const acct = account(a.id);
      if (acct?.service === 'custom' && acct.url && kind === 'main' && !pageNavigated) {
        const moves = learnSite(acct.url, acct.siteMoves, url); // the first load only; then final
        if (moves) store.update(a.id, { siteMoves: moves });
      }
      // Is this view signing in to its own account? (Then its sign-in page may hand over to a company IdP.)
      const forUs = signInFor(a.service, url, homeHostsOf(account(a.id) ?? a));
      const chain = chains.get(wc);
      if (forUs !== null) signingIn.set(wc, forUs);
      else if (isHomeUrl(account(a.id) ?? a, url)) signingIn.delete(wc);
      else if (chain && (chain.signIn || chain.trusted)) signingIn.set(wc, true); // landed on the identity provider
      else signingIn.delete(wc);
      pushIfOffsiteChanged(a.id);
      // Signed out or the session expired: the last Outlook/Teams count no longer holds.
      if (forUs !== null && a.service === 'microsoft' && (kind === 'main' || kind === 'teams') && unread.set(a.id, kind, 0)) push();
    });
    wc.on('destroyed', () => failed.delete(wc));
    if (kind === 'main' && a.service === 'custom') {
      // A custom app's icon: the one its page declares, fetched with its own session.
      wc.on('page-favicon-updated', (_e, favicons) => {
        const acct = account(a.id);
        const url = favicons.find((f) => /^https:\/\//.test(f) && isHomeUrl(acct ?? a, f)) ?? favicons.find((f) => /^https:\/\//.test(f));
        if (acct && url && isHomeUrl(acct, wc.getURL())) void refreshIcon(acct, { service: 'custom', siteUrl: acct.url, faviconUrl: url }).catch(() => undefined);
      });
    }
    if (kind === 'main') {
      wc.on('page-title-updated', (_e, title) => {
        const current = account(a.id);
        if (current?.service === 'google') {
          const email = emailFromGmailTitle(title);
          if (email) updateIdentity(a.id, { email });
        }
        if (current && unread.update(a.id, title, current.service)) push();
      });
    }
    if (kind.startsWith('extra:')) {
      wc.on('page-title-updated', (_e, title) => {
        const list = extras.get(a.id) ?? [];
        const tab = list.find((t) => t.kind === kind);
        if (tab) {
          tab.title = title;
          push();
        }
      });
    }
  }


  function activeKind(a: Account): ViewKind {
    if (!hasTabs(a.service)) return 'main';
    const kind = subAppToKind(store.state().activeGoogleSubApp[a.id] ?? 'mail');
    return hasTab(a.service, kind) ? kind : 'main'; // a tab this service doesn't have

  }

  /** The page on screen in this account left its service (a sign-in elsewhere): its host, shown in the tab strip. */
  function offsiteHost(a: Account, kind: ViewKind): string | undefined {
    const url = registry.get(a.id, kind)?.webContents.getURL() ?? '';
    if (!/^https?:/.test(url) || isHomeUrl(a, url)) return undefined;
    try {
      const u = new URL(url);
      return u.protocol === 'http:' ? `http://${u.host}` : u.host;
    } catch {
      return undefined;
    }
  }
  const lastOffsite = new Map<string, string | undefined>();
  function pushIfOffsiteChanged(accountId: string): void {
    const a = account(accountId);
    if (!a || !hasTabs(a.service)) return;
    const cur = viewManager.current();
    const host = offsiteHost(a, cur?.accountId === a.id ? cur.kind : activeKind(a));
    if (lastOffsite.get(a.id) === host) return;
    lastOffsite.set(a.id, host);
    push();
  }

  function googleTabs(a: Account): { tabs: GoogleTab[]; active: ViewKind; offsite?: string } {
    const tabs: GoogleTab[] = [
      ...(SERVICE_TABS[a.service] ?? []).map((t) => ({ id: t.kind, title: t.title })),
      ...(extras.get(a.id) ?? []).map((t) => ({ id: t.kind, title: t.title })),
    ];
    const current = viewManager.current();
    const active = current?.accountId === a.id ? current.kind : activeKind(a);
    const offsite = offsiteHost(a, active);
    return { tabs, active, ...(offsite ? { offsite } : {}) };
  }

  function snapshot(): UiSnapshot {
    const s = store.state();
    const accounts: AccountView[] = s.accounts.map((a) => ({
      ...a,
      unread: unread.get(a.id),
      hibernated: hibernated.has(a.id),
      icon: resolveIcon(a, iconContext),
    }));
    const tabs: UiSnapshot['googleTabs'] = {};
    for (const a of s.accounts) if (hasTabs(a.service)) tabs[a.id] = googleTabs(a);
    return {
      accounts,
      activeAccountId: s.activeAccountId,
      googleTabs: tabs,
      claude: { enabled: !!s.claudeEnabled, acting: claude.acting() },
      calendarOpen,
      settingsOpen,
      settingsSection,
      setupOpen,
      todayOpen,
      openOnToday: s.openOnToday !== false,
      messages: messageViews(messages, s.homePreviews !== false),
      messagePreviews: s.homePreviews !== false,
      messageSources: [...notified],
      update: { mode: updateMode(process.platform, process.env, app.isPackaged), auto: s.autoUpdate !== false, state: updates.state() },
      todos: todos.list(),
      weekStartSetting: s.weekStart ?? 'auto',
      language: s.language ?? 'system',
      meetingsOpen,
      ...(meetingsFocus ? { meetingsFocus } : {}),
      meetings: {
        list: meetingStore.listAll(meetingScopes(), orchestrator.live()?.id).map((it) => {
          const st = meetingRunner.state(it.id);
          const error = meetingRunner.error(it.id);
          return st ? { ...it, state: st, ...(error ? { error } : {}) } : it;
        }),
        live: orchestrator.live(),
        asking: (() => {
          const q = orchestrator.asking();
          const a = q ? account(q.accountId) : undefined;
          return q && a ? { scope: scopeOfAccount(a, 'space'), title: q.title, switchTo: q.switchTo } : null;
        })(),
        barMode: meetingsOn ? (currentBarTarget()?.mode ?? null) : null,
        localeInstall,
        settings: (({ nospace: _n, ...rest }) => rest)(s.meetings ?? {}),
        spaces: Object.fromEntries([
          ...(s.spaces ?? []).map((sp) => [`space:${sp.id}`, spaceMeetingSettings(sp)] as const),
          ['nospace', spaceMeetingSettings({ meetings: s.meetings?.nospace })] as const,
        ]),
        engines: engineStatuses(),
      },
      spaces: s.spaces ?? [],
      sidebarStyle: sidebarStyleOf(s.sidebarStyle),
      panelSpaceId: spacePanel?.spaceId() ?? null,
      calendarHidden: s.calendarHidden ?? [],
      ...(s.calendarDefaultAccount ? { calendarDefaultAccount: s.calendarDefaultAccount } : {}),
      assistant: (() => {
        const scope = scopeNow();
        const conv = convOf(scope);
        return {
          open: assistantOpen,
          width: assistantWidth(),
          model: cfg(scope).model,
          effort: cfg(scope).effort,
          engine: cfg(scope).engine,
          ...(isEngine(store.state().assistant?.defaultEngine) ? { defaultEngine: store.state().assistant?.defaultEngine as AssistantEngine } : {}),
          configs: Object.fromEntries(scopes().map((x) => [x.key, cfg(x.key)])),
          memory: Object.fromEntries(scopes().map((x) => [x.key, memory.list(x.key)])),
          skills: skills.all(),
          claudeAccounts: connections.list().filter((c) => c.kind === 'claude' && !c.builtin),
          skillsActive: skills.activeMap(),
          button: store.state().assistant?.button !== false,
          mode: assistantMode(),
          scope,
          scopes: scopes(),
          conversationId: conv,
          conversations: conversations.list(scope),
          working: conv ? (sessions.get(conv)?.busy() ?? false) : false,
        };
      })(),
      weekStart: effectiveWeekStart(s.weekStart, macWeekStart),
    };
  }

  /** A space was removed: its conversations move to "All spaces"; its processes and socket end. */
  function reconcileAssistantScopes(): void {
    const ids = new Set((store.state().spaces ?? []).map((sp) => sp.id));
    for (const sc of conversations.scopes()) {
      if (!sc.startsWith('space:') || ids.has(sc.slice(6))) continue;
      for (const [id, sess] of sessions) {
        if (conversations.get(id)?.scope === sc) {
          sess.release();
          sessions.delete(id);
        }
      }
      conversations.reassign(sc, 'all');
      currentConv.delete(sc);
      void servers.get(sc)?.then((x) => x.close()).catch(() => undefined);
      servers.delete(sc);
    }
  }

  function push(): void {
    pruneMessages();
    reconcileAssistantScopes();
    // A deleted space's notes go with it.
    const spaceIds = new Set((store.state().spaces ?? []).map((sp) => sp.id));
    memory.prune((scope) => !scope.startsWith('space:') || spaceIds.has(scope.slice(6)));
    // …and its meetings (asked first, see confirmMeetingsLoss). Never when the settings failed to load:
    // an unreadable accounts.json starts empty, and that must not wipe every space's meetings.
    const spacesKey = [...spaceIds].sort().join(',');
    if (!store.loadWarning() && spacesKey !== prunedFor) {
      prunedFor = spacesKey; // only when the set of spaces changed: pruning lists every folder
      meetingStore.pruneScopes((scope) => !scope.startsWith('space:') || spaceIds.has(scope.slice(6)));
    }
    skills.prune((scope) => !scope.startsWith('space:') || spaceIds.has(scope.slice(6)));
    const panelId = spacePanel?.spaceId();
    if (panelId && !store.state().spaces?.some((s) => s.id === panelId)) spacePanel?.close(); // the space is gone
    const snap = snapshot();
    if (!win.isDestroyed()) win.webContents.send(IPC.snapshot, snap);
    const panelWc = spacePanel?.webContents();
    if (panelWc) panelWc.send(IPC.snapshot, snap);
    for (const wc of assistantOverlay?.webContents() ?? []) if (!wc.isLoading()) wc.send(IPC.snapshot, snap);
    const quickWc = quick?.webContents();
    if (quickWc && !quickWc.isLoading()) quickWc.send(IPC.snapshot, snap);
    const barWc = meetingBar.webContents();
    if (barWc && !barWc.isLoading()) barWc.send(IPC.snapshot, snap);
    placeMeetingBar();
    app.dock?.setBadge(dockBadgeText(store.state().accounts.map((a) => unread.get(a.id))));
    syncGoogle(); // cheap when spaces haven't changed
  }

  function show(a: Account, kind: ViewKind): void {
    setupOpen = false;
    if (!claudeShowing) {
      pickedScope = null; // the assistant follows the space of the account the user opens
      releaseIdle();
    }
    calendarOpen = false;
    settingsOpen = false;
    todayOpen = false;
    meetingsOpen = false;
    spacePanel?.close();
    // Entering an account wakes its background views (Gmail/Slack/WhatsApp, Outlook and Teams) too.
    for (const k of backgroundKinds(a)) if (k !== kind) viewManager.ensure(a, k);
    hibernated.delete(a.id);
    viewManager.show(a, kind);
    push();
  }

  function iconMenu(a: Account): Electron.MenuItemConstructorOptions[] {
    const mode = a.iconMode ?? 'auto';
    const set = (iconMode: Account['iconMode'], iconSourceAccountId?: string) => () =>
      controller.updateAccount(a.id, { iconMode, iconSourceAccountId });
    const others = store
      .state()
      .accounts.filter((o) => o.id !== a.id && o.iconMode !== 'account' && resolveIcon(o, iconContext).kind === 'image')
      .map<Electron.MenuItemConstructorOptions>((o) => ({
        label: t('main.icon.sameAs', { name: o.name }),
        type: 'radio',
        checked: mode === 'account' && a.iconSourceAccountId === o.id,
        click: set('account', o.id),
      }));
    return [
      { label: t('main.icon.auto'), type: 'radio', checked: mode === 'auto', click: set('auto') },
      { label: t('main.icon.service'), type: 'radio', checked: mode === 'service', click: set('service') },
      { label: t('main.icon.letter'), type: 'radio', checked: mode === 'letter', click: set('letter') },
      ...(others.length ? [{ type: 'separator' } as const, ...others] : []),
      { type: 'separator' },
      { label: t('main.icon.chooseImage'), type: 'radio', checked: mode === 'custom', click: () => void chooseCustomImage(a) },
    ];
  }

  async function removeAccount(a: Account): Promise<void> {
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      message: t('main.account.removeTitle', { name: a.name }),
      detail: [
        t('main.account.removeDetail'),
        ...spacesLeftEmpty(store.state().spaces ?? [], store.state().accounts.filter((x) => x.id !== a.id))
          .map((sp) => meetingStore.count(`space:${sp.id}`))
          .filter((n) => n > 0)
          .map((count) => t('meetings.deleteWithSpace.detail', { count })),
      ].join('\n\n'),
      buttons: [t('common.remove'), t('common.cancel')],
      defaultId: 1,
      cancelId: 1,
    });
    if (response !== 0 || !account(a.id)) return;
    const wasActive = store.state().activeAccountId === a.id;
    claude.stop(a.id);
    for (const k of registry.kinds(a.id)) scheduler.unregister(key(a.id, k));
    viewManager.destroyAccount(a.id);
    extras.delete(a.id);
    identities.delete(a.id);
    avatars.remove(a.id);
    avatars.remove(`custom:${a.id}`);
    unread.remove(a.id);
    hibernated.delete(a.id);
    store.remove(a.id);
    await clearAccountData(a.id);
    const next = store.state().accounts[0];
    if (wasActive && next) {
      if (settingsOpen || calendarOpen) {
        store.setActive(next.id); // stay in Settings / the calendar; Done returns to this account
        push();
      } else controller.selectAccount(next.id);
    }
    else push();
  }

  spacePanel = createSpacePanel(win, { uiPreloadPath, onChange: () => push() });
  quick = createQuickOverlay(win, {
    uiPreloadPath,
    // Back to the page under the pop-up (or the UI when Home, the calendar or Settings shows).
    focusBack: () => ((calendarOpen || todayOpen || settingsOpen ? null : controller.activeWebContents()) ?? win.webContents).focus(),
  });
  setTimeout(() => !win.isDestroyed() && quick?.warm(), 3000); // after startup's own work
  assistantOverlay = createAssistantOverlay(win, {
    uiPreloadPath,
    buttonVisible: () => store.state().assistant?.button !== false,
    width: assistantWidth,
    height: () => Math.max(320, Math.min(1600, store.state().assistant?.height ?? 680)),
    setSize: (width, height) => store.setAssistantPrefs({ width: Math.round(width), height: Math.round(height) }),
    place: () => store.state().assistant?.fab,
    setPlace: (place) => store.setAssistantPrefs({ fab: place }),
    focusBack() {
      const c = viewManager.current();
      const wc = c ? registry.get(c.accountId, c.kind)?.webContents : null;
      if (wc && !wc.isDestroyed()) wc.focus();
      else if (!win.isDestroyed()) win.webContents.focus();
    },
  });

  /** Back from the setup to where the user was: their app on screen (or the empty screen). */
  function leaveSetup(): void {
    const st = store.state();
    const id = st.activeAccountId && account(st.activeAccountId) ? st.activeAccountId : st.accounts[0]?.id;
    if (id) controller.selectAccount(id);
    else push();
  }

  const controller: AppController = {
    snapshot,

    start() {
      updates.start();
      if (store.state().claudeEnabled) void setClaudeEnabled(true);
      const plan = startupPlan(store.state());
      if (plan.immediate) {
        controller.selectAccount(plan.immediate);
        // The active tab may be Calendar or Drive; Gmail (Outlook and Teams) must still run for notifications.
        const first = account(plan.immediate);
        if (first) for (const k of backgroundKinds(first)) viewManager.ensure(first, k);
      }
      plan.staggered.forEach((id, i) => {
        setTimeout(() => {
          const a = account(id);
          if (a) for (const k of backgroundKinds(a)) viewManager.ensure(a, k);
        }, (i + 1) * STAGGER_MS);
      });
      // A brand-new Mission Desk opens on the setup; otherwise on Home (Settings → General can turn it off).
      if (needsSetup(store.state())) controller.openSetup();
      else if (opensOnToday(store.state())) controller.openToday();
      else push();
    },

    selectAccount(id) {
      const a = account(id);
      if (!a) return;
      store.setActive(id);
      show(a, activeKind(a));
    },

    addAccount({ space, ...input }) {
      const a = store.add(input, space ? ('id' in space ? { spaceId: space.id } : { newSpace: space.newName }) : undefined);
      controller.selectAccount(a.id);
      return a.id;
    },

    updateAccount(id, patch) {
      if (!account(id)) return;
      const updated = store.update(id, patch);
      if ('claudeAccess' in patch && updated.claudeAccess !== 'act') claude.stop(id);
      if ('hibernateWhenIdle' in patch) {
        if (!updated.hibernateWhenIdle) {
          for (const k of backgroundKinds(updated)) viewManager.ensure(updated, k); // always-on again: wake it now
          hibernated.delete(id);
        }
        for (const k of backgroundKinds(updated)) if (registry.get(id, k)) scheduler.register(key(id, k), viewPolicy(updated, k));
      }
      push();
    },

    reorder(ids) {
      try {
        store.reorder(ids);
      } catch {
        // stale UI order: just resend the truth
      }
      push();
    },

    setModalOpen(open) {
      if (open) spacePanel?.close();
      viewManager.setModalOpen(open);
      modalOpen = open;
      placeMeetingBar();
      assistantOverlay?.setSuppressed(open); // the dialog is in the main UI, under the floating views
    },

    selectGoogleTab(accountId, tab) {
      let a = account(accountId);
      if (!a || !hasTabs(a.service)) return;
      if (!tab.startsWith('extra:') && !hasTab(a.service, tab)) return; // e.g. Drive on a Microsoft account
      const firstTeams = tab === 'teams' && !a.teamsInBackground;
      if (firstTeams) a = store.update(accountId, { teamsInBackground: true }); // from now on Teams runs in the background
      const sub = kindToSubApp(tab);
      if (sub) store.setGoogleSubApp(accountId, sub);
      store.setActive(accountId);
      show(a, tab);
      if (firstTeams) scheduler.register(key(accountId, 'teams'), viewPolicy(a, 'teams'));
    },

    closeGoogleTab(accountId, tab) {
      const a = account(accountId);
      const list = extras.get(accountId) ?? [];
      if (!a || !list.some((t) => t.kind === tab)) return;
      const wasShowing = viewManager.current()?.accountId === accountId && viewManager.current()?.kind === tab;
      extras.set(accountId, list.filter((t) => t.kind !== tab));
      scheduler.unregister(key(accountId, tab));
      viewManager.close(accountId, tab);
      if (wasShowing) show(a, activeKind(a));
      else push();
    },

    move(id, delta) {
      store.moveWithin(id, delta);
      push();
    },

    selectByShortcut(n) {
      const id = accountIdForShortcut(store.state().accounts, n);
      if (id) controller.selectAccount(id);
    },

    showAccountMenu(id) {
      const a = account(id);
      if (!a) return;
      spacePanel?.close(); // the menu may come from the panel; it pops up on the window
      const { accounts, spaces = [] } = store.state();
      const canMove = (delta: -1 | 1): boolean =>
        moveWithinContainer(accounts, spaces, id, delta).map((x) => x.id).join() !== accounts.map((x) => x.id).join();
      const reload = (): void => {
        const kind = viewManager.current()?.accountId === id ? viewManager.current()!.kind : 'main';
        registry.get(id, kind)?.webContents.reload();
      };
      Menu.buildFromTemplate([
        { label: t('main.account.edit'), click: () => win.webContents.send(IPC.editRequest, id) },
        { label: t('main.menu.reload'), click: reload },
        { type: 'separator' },
        {
          label: t('main.account.muteNotifications'),
          type: 'checkbox',
          checked: a.muted,
          click: (item) => controller.updateAccount(id, { muted: item.checked }),
        },
        {
          label: t('main.account.hibernate'),
          type: 'checkbox',
          checked: a.hibernateWhenIdle,
          click: (item) => controller.updateAccount(id, { hibernateWhenIdle: item.checked }),
        },
        { label: t('main.account.icon'), submenu: iconMenu(a) },
        {
          label: t('main.account.claudeAccess'),
          submenu: (
            [
              ['off', t('common.off')],
              ['read', t('main.account.accessRead')],
              ['act', t('main.account.accessAct')],
            ] as const
          ).map(([value, label]) => ({
            label,
            type: 'radio' as const,
            checked: (a.claudeAccess ?? 'off') === value,
            click: () => controller.updateAccount(id, { claudeAccess: value }),
          })),
        },
        { type: 'separator' },
        {
          label: t('main.account.moveToSpace'),
          submenu: [
            ...spaces.map((sp) => ({
              label: sp.name,
              type: 'radio' as const,
              checked: a.spaceId === sp.id,
              click: () => {
                store.moveToSpace(id, sp.id);
                push();
              },
            })),
            ...(spaces.length ? [{ type: 'separator' as const }] : []),
            {
              label: t('common.none'),
              type: 'radio' as const,
              checked: !a.spaceId,
              click: () => {
                store.moveToSpace(id, null);
                push();
              },
            },
            { type: 'separator' as const },
            { label: t('main.account.newSpace'), click: () => win.webContents.send(IPC.spaceNameRequest, { mode: 'create', accountIds: [id] }) },
          ],
        },
        { label: t('main.account.moveUp'), enabled: canMove(-1), click: () => controller.move(id, -1) },
        { label: t('main.account.moveDown'), enabled: canMove(1), click: () => controller.move(id, 1) },
        { type: 'separator' },
        { label: t('main.account.remove'), click: () => void removeAccount(a) },
      ]).popup({ window: win });
    },

    activeWebContents() {
      const c = viewManager.current();
      return c ? (registry.get(c.accountId, c.kind)?.webContents ?? null) : null;
    },

    layout() {
      spacePanel?.close(); // the window moved under it
      viewManager.layout();
      assistantOverlay?.layout();
      quick?.layout();
      placeMeetingBar();
    },

    copyMeetingLink,

    stopClaude(accountId) {
      claude.stop(accountId);
    },

    claudeCall: (tool, args, signal) => devSession.call(tool, args, signal),
    claudeConnectInfo,
    setClaudeEnabled,
    openCalendar() {
      if (!store.state().accounts.some((a) => a.service === 'google')) return;
      calendarOpen = true;
      setupOpen = false;
      settingsOpen = false;
      todayOpen = false;
      meetingsOpen = false;
      spacePanel?.close();
      viewManager.hideAll();
      win.webContents.focus(); // keys (T, D, W, M…) go to the calendar, not the hidden page
      push();
    },

    isCalendarOpen: () => calendarOpen,

    calendarCalendars: (a) => (isGoogleAccount(a) ? calendarWriter.calendars(a) : Promise.resolve(NOT_ALLOWED)),
    calendarGetEvent: (a, c, e) => (isGoogleAccount(a) ? calendarWriter.getEvent(a, c, e) : Promise.resolve(NOT_ALLOWED)),
    async calendarCreate(a, draft, send) {
      const r = await calendarWrite(a, () => calendarWriter.create(a, draft, send));
      if (r.ok) {
        store.setCalendarDefaultAccount(a);
        push();
      }
      return r;
    },
    calendarUpdate: (a, e, draft, scope, send) => calendarWrite(a, () => calendarWriter.update(a, e, draft, scope, send)),
    calendarMove: (a, c, e, start, end, allDay, scope) => calendarWrite(a, () => calendarWriter.moveTimes(a, c, e, start, end, allDay, scope)),
    calendarDelete: (a, c, e, scope, send) => calendarWrite(a, () => calendarWriter.remove(a, c, e, scope, send)),
    calendarRespond: (a, c, e, reply) => calendarWrite(a, () => calendarWriter.respond(a, c, e, reply)),
    calendarChangeCalendar: (a, from, e, to) => calendarWrite(a, () => calendarWriter.changeCalendar(a, from, e, to)),

    toggleAssistant(open) {
      setAssistantOpen(open ?? !assistantOpen);
    },

    async assistantStatus() {
      const engine = cfg(scopeNow()).engine;
      if (engine === 'off') return { state: 'ready' as const }; // the chat says it is off
      if (engine === 'codex') return codexStatusFor(scopeNow());
      if (engine === 'openrouter') return openRouterReady(scopeNow()) ? { state: 'ready' as const } : { state: 'signed-out' as const };
      return claudeStatusFor(scopeNow());
    },

    claudeIntegrationStatus: () => claudeStatus(),
    codexStatus: () => codexStatus(),

    codexSignIn() {
      return codexLogin(codexEnv()); // this Mac's own Codex (setup, Integrations)
    },

    codexSignInCancel() {
      codexSignInChild?.kill();
    },

    openRouterStatus() {
      return { connected: secrets.get('openrouter') !== null };
    },

    async openRouterConnect(key) {
      const r = await checkOpenRouterKey((u, init) => net.fetch(String(u), init), key);
      if (!r.ok) return { connected: secrets.get('openrouter') !== null, error: r.message };
      try {
        secrets.set('openrouter', key);
      } catch (e) {
        return { connected: false, error: (e as Error).message };
      }
      push();
      return { connected: true };
    },

    openRouterDisconnect() {
      secrets.remove('openrouter');
      for (const [id, sess] of sessions) {
        const c = conversations.get(id);
        if (c && cfg(c.scope).engine === 'openrouter') {
          sess.release();
          sessions.delete(id);
        }
      }
      push();
    },

    openRouterModels() {
      const now = Date.now();
      if (orModels && now - orModels.at < 60 * 60_000) return Promise.resolve(orModels.list);
      orModelsLoading ??= (async () => {
        try {
          const res = await net.fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15_000) });
          const list = res.ok ? toolModels(await res.json()) : [];
          if (list.length) orModels = { at: Date.now(), list };
          return list.length ? list : (orModels?.list ?? []);
        } catch {
          return orModels?.list ?? [];
        }
      })().finally(() => (orModelsLoading = null));
      return orModelsLoading;
    },

    assistantSignIn() {
      // A space on an added connection signs in to that connection, never to this Mac's.
      const scope = scopeNow();
      const target = targetFor(scope);
      if (target.kind === 'missing') return Promise.resolve({ state: 'signed-out' } as ClaudeStatus);
      if (target.kind === 'codex') return codexLogin(envFor(scope, 'codex')).then((st) => (push(), st));
      if (target.kind === 'openrouter') return Promise.resolve((openRouterReady(scope) ? { state: 'ready' } : { state: 'signed-out' }) as ClaudeStatus);
      if (!('builtin' in target)) return claudeSignInTo(target.id).then(() => (push(), claudeStatusFor(scope)));
      // `claude auth login` opens the browser and ends when the user has signed in (or gave up).
      signIn ??= (async () => {
        const cmd = await lookUpClaude();
        if (!cmd) return { state: 'not-installed' } as ClaudeStatus;
        await new Promise<void>((resolve) => {
          const child = spawn(cmd, ['auth', 'login'], { env: cleanEnv(process.env), stdio: 'ignore' });
          signInChild = child;
          const timer = setTimeout(() => child.kill(), 10 * 60_000);
          const done = (): void => {
            clearTimeout(timer);
            if (signInChild === child) signInChild = null;
            resolve();
          };
          child.on('error', done);
          child.on('exit', done);
        });
        return claudeStatus();
      })().finally(() => (signIn = null));
      return signIn;
    },

    assistantSignInCancel() {
      claudeLogin?.child.kill();
      signInChild?.kill(); // its promise then resolves with the current status
    },

    assistantAsk(text) {
      pickedScope = 'all';
      currentConv.set('all', null); // a fresh conversation for the brief
      setAssistantOpen(true);
      push(); // also when the chat was already open: it must show "All spaces" before the ask arrives
      sendAssistant(IPC.assistantAskEvent, text); // the chat sends it, so it shows in the conversation
    },

    assistantChatResize(phase, edges) {
      if (phase === 'start' && edges) assistantOverlay?.resizeStart(edges);
      else assistantOverlay?.resizeEnd();
    },

    assistantFabDrag(phase) {
      if (phase === 'start') assistantOverlay?.dragStart();
      else assistantOverlay?.dragEnd();
    },

    setAssistantButton(on) {
      store.setAssistantPrefs({ button: on });
      assistantOverlay?.layout();
      push();
    },

    assistantWebContents: () => assistantOverlay?.webContents() ?? [],

    assistantSend(text, target) {
      setAssistantOpen(true);
      // Where the user is looking (the chat's space and conversation), not wherever main moved since.
      const scope = target && scopes().some((x) => x.key === target.scope) ? target.scope : scopeNow();
      if (cfg(scope).engine === 'off') return ''; // the assistant is off for this space (Settings → Assistant)
      const wanted = target ? target.conversationId : convOf(scope);
      const found = wanted ? conversations.get(wanted) : null;
      const conv = found && found.scope === scope ? found : conversations.create(scope);
      pickedScope = scope;
      currentConv.set(scope, conv.id);
      conversations.addUser(conv.id, text); // what the user typed (a /command stays short in the history)
      releaseIdle();
      push();
      void sessionFor(conv)
        .then((sess) => sess.send(expandSkillCommand(text, skills.activeFor(scope)) ?? expandCommand(text)))
        .catch((e: Error) => {
          const event = { type: 'error' as const, kind: 'failed' as const, message: e.message };
          conversations.applyEvent(conv.id, event);
          sendAssistant(IPC.assistantEvent, { conversationId: conv.id, event });
        });
      return conv.id;
    },

    assistantConversation(id) {
      const c = conversations.get(id);
      return c ? { id: c.id, scope: c.scope, title: c.title, messages: c.messages, working: sessions.get(id)?.busy() ?? false } : null;
    },

    assistantOpenConversation(id) {
      const c = conversations.get(id);
      if (!c || !scopes().some((x) => x.key === c.scope)) return;
      pickedScope = c.scope;
      currentConv.set(c.scope, c.id);
      releaseIdle();
      push();
    },

    assistantDeleteConversation(id) {
      const c = conversations.get(id);
      if (!c) return;
      sessions.get(id)?.close();
      sessions.delete(id);
      if (convOf(c.scope) === id) currentConv.set(c.scope, null);
      conversations.remove(id);
      push();
    },

    assistantSetScope(scope) {
      if (!scopes().some((x) => x.key === scope)) return;
      pickedScope = scope;
      releaseIdle();
      push();
    },

    setAssistantScopeConfig(scope, patch) {
      if (!scopes().some((x) => x.key === scope)) return;
      setScopeConfig(scope, patch);
      releaseIdle();
      push();
    },

    // The user's own changes to a scope's notes (Settings → Assistant); no confirmation needed.
    assistantMemoryAdd(scope, text) {
      if (!scopes().some((x) => x.key === scope)) return;
      const r = memory.add(scope, text);
      if (r && r !== 'full') {
        refreshInstructions(scope);
        push();
      }
    },
    assistantMemoryUpdate(scope, id, text) {
      if (memory.update(scope, id, text)) {
        refreshInstructions(scope);
        push();
      }
    },
    assistantMemoryRemove(scope, id) {
      if (memory.remove(scope, id)) {
        refreshInstructions(scope);
        push();
      }
    },

    // Skills (Settings → Skills). A fetched SKILL.md only comes back as a draft: the user reads it
    // and saves it themself. Nothing in a skill ever runs; it is text for the assistant.
    async skillFetch(raw) {
      const url = skillFetchUrl(raw);
      if (!url) return { ok: false, error: t('main.skills.fetchBadLink') };
      try {
        const res = await net.fetch(url, { headers: { Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1' }, signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return { ok: false, error: res.status === 404 ? t('main.skills.fetchNotFound') : t('main.skills.fetchStatus', { status: String(res.status) }) };
        if (res.url && !res.url.startsWith('https://')) return { ok: false, error: t('main.skills.fetchNotHttps') };
        if (/text\/html/i.test(res.headers.get('content-type') ?? '')) return { ok: false, error: t('main.skills.fetchWebPage') };
        if (Number(res.headers.get('content-length') ?? 0) > 64_000) return { ok: false, error: t('main.skills.fetchTooBig') };
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 64_000) return { ok: false, error: t('main.skills.fetchTooBig') };
        const text = new TextDecoder('utf-8').decode(buf);
        if (text.includes(String.fromCharCode(0))) return { ok: false, error: t('main.skills.fetchNotText') };
        const draft = parseSkillMd(text);
        if (!draft.instructions) return { ok: false, error: t('main.skills.fetchEmpty') };
        if (draft.instructions.length > MAX_INSTRUCTIONS) return { ok: false, error: t('main.skills.fetchTooLong', { max: MAX_INSTRUCTIONS }) };
        return { ok: true, url, draft };
      } catch {
        return { ok: false, error: t('main.skills.fetchFailed') };
      }
    },
    skillAdd(draft, source, scopeList) {
      const valid = scopeList.filter((sc) => scopes().some((x) => x.key === sc));
      // A catalogue skill always uses Mission Desk's own text, whatever the page sent.
      const fromCatalog = source.kind === 'catalog' ? SKILL_CATALOG.find((c) => c.id === source.id) : undefined;
      const text = fromCatalog ?? draft;
      if (!text) return;
      const r = skills.add(text, source, valid);
      if (r && r !== 'full') {
        for (const sc of valid) refreshInstructions(sc);
        push();
      }
    },
    skillUpdate(id, patch) {
      if (skills.update(id, patch)) {
        refreshInstructions();
        push();
      }
    },
    skillRemove(id) {
      if (skills.remove(id)) {
        refreshInstructions();
        push();
      }
    },
    skillSetActive(id, scope, on) {
      if (!scopes().some((x) => x.key === scope)) return;
      if (skills.setActive(id, scope, on)) {
        refreshInstructions(scope);
        push();
      }
    },

    setAssistantMode(mode) {
      store.setAssistantPrefs({ mode });
      pickedScope = null;
      releaseIdle();
      push();
    },

    openExternalLink(url) {
      openExternal(url); // http(s)/mailto/tel only (isSafeExternal)
    },

    assistantStop() {
      const id = onScreenConv();
      if (id) sessions.get(id)?.stop();
    },

    assistantNewChat() {
      // A fresh conversation in this space (the old one stays in the history).
      currentConv.set(scopeNow(), null);
      releaseIdle();
      push();
    },

    assistantSetModel(model, effort) {
      // The chat's model and effort belong to the space on screen.
      store.setAssistantPrefs({ model, effort }); // also the default for spaces without their own choice
      setScopeConfig(scopeNow(), { model, effort });
      releaseIdle();
      push();
    },

    assistantSetWidth(width) {
      store.setAssistantPrefs({ width: Math.round(Math.max(ASSISTANT_MIN, Math.min(ASSISTANT_MAX, width))) });
      assistantOverlay?.layout();
      push();
    },

    openToday() {
      todayOpen = true;
      meetingsOpen = false;
      setupOpen = false;
      calendarOpen = false;
      settingsOpen = false;
      spacePanel?.close();
      viewManager.hideAll();
      win.webContents.focus();
      push();
    },

    setOpenOnToday(on) {
      store.setOpenOnToday(on);
      push();
    },

    openMessage(key) {
      const m = messages.find((x) => x.key === key);
      if (!m || !account(m.accountId)) return;
      messages = removeMessage(messages, key);
      notifications.dismiss(m.sender, m.id); // and from Notification Center
      openFromNotification(m.accountId, m.kind);
      // The page opens that chat or mail, as if its notification had been clicked.
      const wc = webContents.fromId(m.sender);
      if (wc && !wc.isDestroyed() && registry.accountFor(wc.id)?.accountId === m.accountId) wc.send(SERVICE_IPC.notificationClick, m.id);
      push();
    },

    dismissMessage(key) {
      messages = removeMessage(messages, key);
      push();
    },

    clearMessages() {
      messages = [];
      push();
    },

    setMessagePreviews(on) {
      store.setHomePreviews(on);
      push();
    },

    checkForUpdates() {
      updates.check(true);
    },

    showUpdates() {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      controller.openSettings('about');
    },

    installUpdate() {
      updates.install();
    },

    setAutoUpdate(on) {
      store.setAutoUpdate(on);
      push();
    },

    todoAdd(text, tag) {
      if (todos.add(text, tag)) push();
    },

    todoUpdate(id, patch) {
      todos.update(id, patch);
      push();
    },

    todoRemove(id) {
      todos.remove(id);
      push();
    },

    todosClearDone() {
      todos.clearDone();
      push();
    },

    openSetup() {
      setupOpen = true;
      settingsOpen = false;
      calendarOpen = false;
      spacePanel?.close();
      setAssistantOpen(false);
      viewManager.hideAll();
      win.webContents.focus();
      push();
    },

    skipSetup() {
      store.setOnboarded();
      setupOpen = false;
      leaveSetup();
    },

    finishSetup(plan) {
      if (!setupOpen) return 0; // only from the setup on screen, once (a repeated request adds nothing)
      setupOpen = false;
      store.setAssistantPrefs({ defaultEngine: plan.engine }); // 'off' too: "Not now" means no assistant
      const reads = plan.assistantReads && plan.engine !== 'off';
      const created: string[] = [];
      const spaces = store.state().spaces ?? [];
      // One colour per space (the same rule as the setup's preview): an existing space keeps its own.
      const colours = spaceColours(
        plan.spaces.map((sp) => sp.name),
        spaces.map((sp) => ({ name: sp.name, color: store.state().accounts.find((x) => x.spaceId === sp.id)?.color })),
      );
      let loose = spaces.length + plan.spaces.length; // loose apps take the colours after those
      const add = (app: SetupApp, place: { spaceId: string } | { newSpace: string } | undefined, color: string): Account => {
        // Numbered against what is already in that place ("Google 2" next to an existing "Google").
        const here = store.state().accounts.filter((x) => (place && 'spaceId' in place ? x.spaceId === place.spaceId : !place && !x.spaceId));
        const name = place && 'newSpace' in place ? app.name : uniqueName(baseName(app), here.map((x) => x.name));
        const a = store.add({ service: app.service, name, color, ...(app.url ? { url: app.url } : {}) }, place);
        if (reads) store.update(a.id, { claudeAccess: 'read' });
        created.push(a.id);
        return a;
      };
      plan.spaces.forEach((sp, i) => {
        // A space the user already has (run again, same name) gets the apps.
        const id = existingSpace(sp.name, store.state().spaces ?? []);
        if (id) {
          for (const app of sp.apps) add(app, { spaceId: id }, colours[i]);
          return;
        }
        const first = add(sp.apps[0], { newSpace: sp.name }, colours[i]);
        for (const app of sp.apps.slice(1)) add(app, first.spaceId ? { spaceId: first.spaceId } : undefined, colours[i]);
      });
      for (const app of plan.apps) add(app, undefined, ACCOUNT_COLORS[loose++ % ACCOUNT_COLORS.length]);
      store.setOnboarded();
      // Straight into the first app, to sign in; the others load behind it.
      if (created[0]) controller.selectAccount(created[0]);
      else leaveSetup();
      created.slice(1).forEach((id, i) => {
        setTimeout(() => {
          const a = account(id);
          if (a) for (const k of backgroundKinds(a)) viewManager.ensure(a, k);
        }, (i + 1) * STAGGER_MS);
      });
      return created.length;
    },

    openSettings(section) {
      settingsSection = section ?? null;
      setupOpen = false;
      settingsOpen = true;
      todayOpen = false;
      meetingsOpen = false;
      calendarOpen = false;
      spacePanel?.close();
      viewManager.hideAll();
      win.webContents.focus();
      push();
    },

    closeSettings() {
      settingsOpen = false;
      const s = store.state();
      const id = s.activeAccountId && account(s.activeAccountId) ? s.activeAccountId : s.accounts[0]?.id;
      if (id) controller.selectAccount(id);
      else push();
    },

    isSettingsOpen: () => settingsOpen,

    appInfo: () => ({ dataFolder: app.getPath('userData'), version: app.getVersion() }),

    chooseAccountImage(id) {
      const a = account(id);
      if (a) void chooseCustomImage(a);
    },

    removeAccountById(id) {
      const a = account(id);
      if (a) void removeAccount(a);
    },

    moveToSpace(accountId, spaceId) {
      if (!account(accountId)) return;
      if (!confirmMeetingsLoss(assignSpace(store.state().accounts, store.state().spaces ?? [], accountId, spaceId))) return;
      store.moveToSpace(accountId, spaceId);
      push();
    },

    setSpaceAlwaysOpen(id, on) {
      store.setSpaceAlwaysOpen(id, on);
      push();
    },

    setSpaceShareGoogle(id, on) {
      store.setSpaceShareGoogle(id, on);
      push();
    },

    setSpaceGoogleAccount(id, accountId) {
      store.setSpaceGoogleAccount(id, accountId);
      push();
    },

    ungroupSpace(id) {
      if (!confirmMeetingsLoss(ungroupSpace(store.state().accounts, id))) return;
      store.ungroup(id);
      push();
    },

    setWeekStart(v) {
      store.setWeekStart(v);
      push();
    },

    captureHost: () => capture,

    meetingAnswer: (yes, never) => void orchestrator.answer(yes, never),
    meetingPause: () => orchestrator.pause(),
    meetingResume: () => orchestrator.resume(),
    meetingStop: () => void orchestrator.stop(),
    meetingSetLanguage: (locale) => void orchestrator.setLanguage(locale),
    meetingCopyNotice() {
      clipboard.writeText(store.state().meetings?.notice || t('meetings.notice.default'));
    },
    meetingInstallLocale(locale) {
      if (localeInstall) return;
      localeInstall = { locale, fraction: 0 };
      push();
      void transcriberNow()
        .installLocale(locale, (f) => {
          localeInstall = { locale, fraction: f };
          pushSoon();
        })
        .then(() => {
          const live = orchestrator.live();
          if (live?.notice?.code === 'localeMissing' && live.notice.locale === locale) void orchestrator.setLanguage(locale);
        })
        .catch(() => undefined)
        .finally(() => {
          localeInstall = null;
          push();
        });
    },
    meetingBarWebContents: () => meetingBar.webContents(),
    meetingRun: (scope, id, actions) => void meetingRunner.run(scope, id, actions),
    meetingGet: (scope, id) => meetingStore.get(scope, id),
    meetingDelete(scope, id) {
      const m = meetingStore.get(scope, id);
      if (!m) return;
      const r = dialog.showMessageBoxSync(win, { type: 'warning', message: t('meetings.delete.title', { title: m.title }), detail: t('meetings.delete.detail'), buttons: [t('common.delete'), t('common.cancel')], defaultId: 1, cancelId: 1 });
      if (r !== 0) return;
      meetingStore.remove(scope, id);
      push();
    },
    meetingOpenDraft(scope, id) {
      const m = meetingStore.get(scope, id);
      const email = m?.result?.email;
      if (!m || !email) return;
      // The space's mail: the meeting's own Google account first, then any Google or Microsoft account in the space.
      const inScope = store.state().accounts.filter((a) => scopeOfAccount(a, 'space') === scope && (a.service === 'google' || a.service === 'microsoft'));
      const a = inScope.find((x) => x.id === m.event?.accountId) ?? inScope.find((x) => x.id === m.accountId) ?? inScope[0];
      if (!a) return;
      const { url, bodyInClipboard } = composeUrl(a.service === 'google' ? 'google' : 'microsoft', email);
      if (bodyInClipboard) {
        clipboard.writeText(email.body);
        assistantOverlay?.toast({ state: 'done', title: t('meetings.draft.bodyCopied') });
      }
      follow(a, routeLink({ service: a.service, url, disposition: 'new-window', busySubApps: busySubApps(a.id) }));
    },
    meetingCopySummary(scope, id) {
      const m = meetingStore.get(scope, id);
      const s = m?.result?.summary;
      if (!m || !s) return;
      const part = (key: 'meetings.section.decisions' | 'meetings.section.points' | 'meetings.section.nextSteps', items: string[]): string => (items.length ? `${t(key)}\n${items.map((x) => `• ${x}`).join('\n')}` : '');
      const date = new Date(m.startedAt).toLocaleDateString(localeNow.format, { day: 'numeric', month: 'long', year: 'numeric' });
      clipboard.writeText(
        [t('meetings.copy.heading', { title: m.title, date }), part('meetings.section.decisions', s.decisions), part('meetings.section.points', s.points), part('meetings.section.nextSteps', s.nextSteps)]
          .filter(Boolean)
          .join('\n\n'),
      );
    },
    meetingSaveNote(scope, id, index) {
      const note = meetingStore.get(scope, id)?.result?.memoryNotes?.[index];
      if (!note) return;
      const host = toolHostFor(scope);
      void host.confirmMemory('remember', note).then((ok) => {
        if (ok) host.remember(note);
      });
    },
    meetingCreateEvent(scope, id) {
      const m = meetingStore.get(scope, id);
      const ev = m?.result?.followUpEvent;
      if (!m || !ev) return;
      const google = store.state().accounts.filter((a) => a.service === 'google' && scopeOfAccount(a, 'space') === scope);
      const a = google.find((x) => x.id === m.event?.accountId) ?? google[0];
      if (!a) return;
      const draft: EventDraft = { calendarId: 'primary', title: ev.title, allDay: false, start: ev.start, end: ev.end, location: '', description: '', guests: ev.guests, meet: true };
      const host = toolHostFor(scope);
      void host.confirmCreate(confirmSummary(draft, a.name), draft.guests.length > 0).then((r) => {
        if (r.create) void host.createEvent(a.id, draft, r.notify).then(() => push());
      });
    },
    modelDownload(id) {
      void models
        .download(id, () => pushSoon())
        .catch((e: Error & { code?: string }) => {
          if (e.code !== 'cancelled') assistantOverlay?.toast({ state: 'error', title: t('meetings.engine.downloadFailed', { engine: engineName(id), reason: e.message }) });
        })
        .finally(() => push());
      push();
    },
    async meetingCapabilities() {
      if (!meetingsOn) return null;
      try {
        const c = await transcriberNow().capabilities();
        return { apple: c.apple };
      } catch {
        return null;
      }
    },
    appleLocaleRemove(locale) {
      void transcriberNow().releaseLocale(locale);
    },
    modelCancel(id) {
      models.cancel(id);
    },
    modelDelete(id) {
      const st = models.status(id);
      if (st.state === 'downloading') return void models.cancel(id);
      if (st.state !== 'ready') return;
      const size = `${(st.bytes / 1e9).toLocaleString(localeNow.format, { maximumFractionDigits: 1 })} GB`;
      const r = dialog.showMessageBoxSync(win, { type: 'warning', message: t('meetings.engine.deleteTitle', { engine: engineName(id), size }), detail: t('meetings.engine.deleteDetail'), buttons: [t('common.delete'), t('common.cancel')], defaultId: 1, cancelId: 1 });
      if (r !== 0) return;
      models.remove(id);
      if (store.state().meetings?.engine === id) store.setMeetingGlobal({ engine: 'apple' });
      push();
    },
    openMeetings(scope, id) {
      meetingsOpen = true;
      meetingsFocus = scope || id ? { ...(scope ? { scope } : {}), ...(id ? { id } : {}) } : undefined;
      todayOpen = false;
      calendarOpen = false;
      settingsOpen = false;
      setupOpen = false;
      spacePanel?.close();
      viewManager.hideAll();
      win.webContents.focus();
      push();
    },

    onCapture(pcm, state) {
      capturePcmCbs.add(pcm);
      captureStateCbs.add(state);
      return () => {
        capturePcmCbs.delete(pcm);
        captureStateCbs.delete(state);
      };
    },

    async claudeAccountsInfo() {
      const status = await claudeStatus().catch(() => null);
      const mac = status?.state === 'not-installed' || !status ? null : parseAuthInfo(await runClaudeIn({ kind: 'claude', builtin: true }, ['auth', 'status', '--json']).catch(() => ''));
      const accounts = await Promise.all(
        connections.list().filter((c) => c.kind === 'claude' && !c.builtin).map(async (a) => {
          const info = parseAuthInfo(await runClaudeIn(claudeTargetOf(a.id), ['auth', 'status', '--json']).catch(() => ''));
          if (info?.loggedIn && (info.email !== a.email || info.org !== a.org)) connections.setInfo(a.id, { ...(info.email ? { email: info.email } : {}), ...(info.org ? { org: info.org } : {}), ...(info.plan ? { plan: info.plan } : {}) });
          return { ...a, ...(info?.loggedIn ? { email: info.email, org: info.org, plan: info.plan } : {}), loggedIn: !!info?.loggedIn };
        }),
      );
      return { mac, accounts };
    },
    async claudeAccountAdd(name) {
      let a: ClaudeAccount;
      try {
        a = connections.add('claude', name);
      } catch (e) {
        return { ok: false as const, error: (e as Error).message };
      }
      push();
      const r = await claudeSignInTo(a.id);
      if (!r.ok) connections.remove(a.id);
      push();
      return r.ok ? { ok: true as const, id: a.id } : r;
    },
    async claudeAccountSignIn(id) {
      if (!connections.list().some((a) => a.id === id && a.kind === 'claude' && !a.builtin)) return { ok: false as const, error: t('settings.claudeAccounts.signInFailed') };
      const r = await claudeSignInTo(id);
      push();
      return r;
    },
    claudeAccountCancel() {
      claudeLogin?.child.kill();
    },
    claudeAccountRemove(id) {
      const a = connections.list().find((x) => x.id === id && x.kind === 'claude' && !x.builtin);
      if (!a) return;
      const users = scopes().filter((s) => cfg(s.key).connection === id).length;
      const r = dialog.showMessageBoxSync(win, {
        type: 'warning',
        message: t('settings.claudeAccounts.removeTitle', { name: a.name }),
        detail: users ? t('settings.claudeAccounts.removeDetail', { count: users }) : t('settings.claudeAccounts.removeDetailUnused'),
        buttons: [t('settings.claudeAccounts.remove'), t('common.cancel')],
        defaultId: 1,
        cancelId: 1,
      });
      if (r !== 0) return;
      // Its sessions end; signing out removes its Keychain entry; then its folder goes.
      for (const [cid, sess] of sessions) {
        const sc = conversations.get(cid)?.scope;
        if (sc && cfg(sc).connection === id) {
          sess.close();
          sessions.delete(cid);
        }
      }
      void runClaudeIn(claudeTargetOf(id), ['auth', 'logout'])
        .catch(() => undefined)
        .finally(() => {
          connections.remove(id);
          push();
        });
    },

    openMemory(scope) {
      if (win.isDestroyed()) return;
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      win.webContents.send(IPC.memoryOpened, scope);
    },

    setSpaceMeetings(scope, s) {
      store.setSpaceMeetings(scope, s);
      push();
    },

    setMeetingGlobal(patch) {
      store.setMeetingGlobal(patch);
      push();
    },

    setLanguage(v) {
      store.setLanguage(v);
      localeNow = resolveLocale(store.state().language, app.getPreferredSystemLanguages());
      setLocale(localeNow.locale, localeNow.format);
      rebuildMenu();
      const pages = [win.webContents, ...controller.assistantWebContents(), controller.spacePanelWebContents(), controller.quickWebContents()];
      for (const wc of pages) if (wc && !wc.isDestroyed()) wc.reload();
      push();
    },

    localeInfo: () => ({ ...localeNow, system: resolveLocale('system', app.getPreferredSystemLanguages()).locale }),

    setMenuBuilder(build) {
      rebuildMenu = build;
    },

    showDataFolder() {
      void shell.openPath(app.getPath('userData'));
    },

    showClaudeLog() {
      const log = path.join(app.getPath('userData'), 'claude-activity.log');
      if (fs.existsSync(log)) shell.showItemInFolder(log);
      else void shell.openPath(app.getPath('userData'));
    },

    loadCalendar: (range, force) => calendar.load(range, force),

    joinMeeting(accountId, url) {
      const provider = meetingProvider(url); // only real meeting services
      if (!provider) return;
      const a = account(accountId);
      if (provider === 'meet' && a?.service === 'google') {
        // In the account's own Meet tab (signed in as the account the meeting belongs to).
        follow(a, routeLink({ service: 'google', url, disposition: 'new-window', busySubApps: busySubApps(a.id) }));
        return;
      }
      const native = nativeJoinUrl({ provider, url });
      if (native && app.getApplicationNameForProtocol(`${native.split(':')[0]}://`)) {
        void shell.openExternal(native); // straight into the Zoom or Teams app
        return;
      }
      if (provider === 'zoom') {
        // No Zoom app on this computer: in a Zoom account added here, in the same space.
        // Never another space's Zoom (another client's identity): the same space, or both in none.
        const z = a ? store.state().accounts.find((x) => x.service === 'zoom' && (x.spaceId ?? null) === (a.spaceId ?? null)) : undefined;
        if (z) {
          follow(z, routeLink({ service: 'zoom', url, disposition: 'new-window', busySubApps: busySubApps(z.id) }));
          return;
        }
      }
      openExternal(url);
    },

    openCalendarLink(accountId, url) {
      const a = account(accountId);
      if (!a || a.service !== 'google' || !isAllowedCalendarLink(url)) return;
      follow(a, routeLink({ service: 'google', url, disposition: 'new-window', busySubApps: busySubApps(a.id) }));
    },

    createSpace(name, accountIds) {
      try {
        store.createSpace(name, accountIds);
      } catch {
        // stale ids from the UI: nothing to group
      }
      push();
    },

    renameSpace(id, name) {
      store.renameSpace(id, name);
      push();
    },

    dropInSidebar(drag, target, zone) {
      const preview = applyDrop(store.state().accounts, store.state().spaces ?? [], drag, target, zone);
      if (preview && 'accounts' in preview && !confirmMeetingsLoss(preview.accounts)) return null;
      const r = store.dropInSidebar(drag, target, zone);
      push();
      return r;
    },

    showAddMenu() {
      const open = (kind: 'app' | 'space') => () => win.webContents.send(IPC.openAddDialog, kind);
      Menu.buildFromTemplate([
        { label: t('main.add.app'), click: open('app') },
        { label: t('main.add.space'), enabled: store.state().accounts.length > 0, click: open('space') },
      ]).popup({ window: win });
    },

    newEvent() {
      const st = store.state();
      if (!st.accounts.some((a) => a.service === 'google')) return;
      spacePanel?.close();
      quick?.show({ kind: 'event', accountId: actionContext(st.accounts, st.spaces ?? [], st.activeAccountId ?? null).googleId });
    },

    newTodo() {
      const st = store.state();
      if (st.accounts.length === 0) return;
      spacePanel?.close();
      quick?.show({ kind: 'todo', tag: actionContext(st.accounts, st.spaces ?? [], st.activeAccountId ?? null).todoTag });
    },

    quickClose() {
      quick?.hide();
    },

    quickDone(message) {
      quick?.hide();
      actionDone(message);
    },

    quickWebContents: () => quick?.webContents() ?? null,

    showActionsMenu() {
      const st = store.state();
      const ctx = actionContext(st.accounts, st.spaces ?? [], st.activeAccountId ?? null);
      // With the floating button on screen, the actions fan out from it (drawn by the quick overlay).
      if (assistantOverlay && st.assistant?.button !== false && quick) {
        const { rect, side } = assistantOverlay.fab();
        const actions: DialAction[] = [...(ctx.googleId ? (['meet'] as const) : []), ...(st.accounts.some((a) => a.service === 'google') ? (['event'] as const) : []), 'todo', 'assistant'];
        spacePanel?.close();
        quick.show({ kind: 'dial', fab: rect, side, label: ctx.label, actions });
        return;
      }
      const mac = process.platform === 'darwin';
      const hasGoogle = st.accounts.some((a) => a.service === 'google');
      // The shortcuts are the app menu's; shown here so people learn them.
      const shortcut = (accelerator: string) => ({ accelerator, registerAccelerator: false });
      Menu.buildFromTemplate([
        { label: ctx.label ? t('main.quick.titleFor', { name: ctx.label }) : t('main.quick.title'), enabled: false },
        { type: 'separator' },
        {
          label: t('main.menu.copyMeetLink'),
          ...shortcut(mac ? 'Ctrl+Cmd+M' : 'Ctrl+Alt+M'),
          enabled: !!ctx.googleId,
          ...(ctx.googleId ? {} : { sublabel: t('main.quick.noGoogleInSpace') }),
          click: () => void controller.copyMeetingLink(),
        },
        {
          label: t('main.menu.newEvent'),
          ...shortcut(mac ? 'Ctrl+Cmd+E' : 'Ctrl+Alt+E'),
          enabled: hasGoogle,
          ...(hasGoogle ? {} : { sublabel: t('main.quick.needGoogle') }),
          click: () => controller.newEvent(),
        },
        { label: t('main.menu.newTodo'), ...shortcut(mac ? 'Ctrl+Cmd+T' : 'Ctrl+Alt+D'), click: () => controller.newTodo() },
        { type: 'separator' },
        { label: t('main.quick.askAssistant'), ...shortcut('CmdOrCtrl+J'), click: () => controller.toggleAssistant(true) },
      ]).popup({ window: win });
    },

    quickPick(action) {
      if (action === 'event') return controller.newEvent(); // the dial turns into the pop-up
      if (action === 'todo') return controller.newTodo();
      quick?.hide();
      if (action === 'meet') void controller.copyMeetingLink();
      else setAssistantOpen(true);
    },

    showSpaceMenu(id) {
      const sp = store.state().spaces?.find((s) => s.id === id);
      if (!sp) return;
      const googleMembers = store.state().accounts.filter((a) => a.spaceId === id && a.service === 'google');
      const identityId = (googleMembers.find((g) => g.id === sp.googleAccountId) ?? googleMembers[0])?.id;
      Menu.buildFromTemplate([
        { label: t('main.menu.copyMeetLink'), enabled: googleMembers.length > 0, click: () => void controller.copyMeetingLink({ spaceId: id }) },
        { type: 'separator' },
        { label: t('main.space.memory'), click: () => controller.openMemory(`space:${id}`) },
        { label: t('main.space.rename'), click: () => win.webContents.send(IPC.spaceNameRequest, { mode: 'rename', spaceId: id, name: sp.name }) },
        {
          label: t('main.space.alwaysOpen'),
          type: 'checkbox',
          checked: !!sp.alwaysOpen,
          click: (item) => {
            store.setSpaceAlwaysOpen(id, item.checked);
            push();
          },
        },
        { type: 'separator' },
        {
          label: t('main.space.shareGoogle'),
          type: 'checkbox',
          checked: sp.shareGoogle !== false,
          click: (item) => {
            store.setSpaceShareGoogle(id, item.checked);
            push();
          },
        },
        ...(googleMembers.length > 1
          ? [
              {
                label: t('main.space.googleFrom'),
                enabled: sp.shareGoogle !== false,
                submenu: googleMembers.map((g) => ({
                  label: g.name,
                  type: 'radio' as const,
                  checked: g.id === identityId,
                  click: () => {
                    store.setSpaceGoogleAccount(id, g.id);
                    push();
                  },
                })),
              },
            ]
          : []),
        { type: 'separator' },
        {
          label: t('main.space.ungroup'),
          click: () => {
            store.ungroup(id);
            push();
          },
        },
      ]).popup({ window: win });
    },

    sidebarStyle: () => sidebarStyleOf(store.state().sidebarStyle),

    setSpaceOpen(id, open) {
      store.setSpaceOpen(id, open);
      push();
    },

    setSidebarStyle(style) {
      if (style !== 'panel') spacePanel?.close();
      store.setSidebarStyle(style);
      const item = Menu.getApplicationMenu()?.getMenuItemById(`sidebar-style-${style}`);
      if (item) item.checked = true; // the menu is built once; keep its radio in step with Settings
      push();
    },

    openSpacePanel(id, top) {
      const { spaces = [], accounts, sidebarStyle } = store.state();
      if (sidebarStyleOf(sidebarStyle) !== 'panel' || !spaces.some((s) => s.id === id)) return;
      spacePanel?.open(id, top, accounts.filter((a) => a.spaceId === id).length);
    },

    closeSpacePanel() {
      spacePanel?.close();
    },

    spacePanelWebContents: () => spacePanel?.webContents() ?? null,

    setCalendarHidden(accountId, hidden) {
      store.setCalendarHidden(accountId, hidden);
      push();
    },

    async shutdown() {
      quitting = true; // pages closing now are not reopened
      signInChild?.kill(); // its local sign-in callback must not outlive the app
      codexSignInChild?.kill();
      googleSync.dispose();
      for (const sess of sessions.values()) sess.release(); // their conversations resume next time
      conversations.flush();
      for (const srv of servers.values()) await srv.then((x) => x.close()).catch(() => undefined);
      await socketServer?.close();
      socketServer = null;
    },
  };
  return controller;
}
