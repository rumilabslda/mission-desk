import { type BrowserWindow, ipcMain } from 'electron';
import { isAssistantEffort, isAssistantModel } from '../shared/assistant';
import { isScopeKey } from '../shared/assistant-scope';
import { isCodexModel, isEngine, isOpenRouterModel, type ScopeConfig } from '../shared/assistant-engines';
import { IPC } from '../shared/ipc';
import type { ViewKind } from '../shared/types';
import type { AppController } from './app-controller';
import { cleanSpaceName } from '../shared/spaces';
import { parseTodoTag, isGoogleId, parseAccountPatch, parseEventDraft, parseReply, parseScope, parseSendUpdates, parseSidebarStyle, parseTimes, parseWeekStart, parseCalendarRange, parseDragRef, parseDropZone, parseNewAccount, parseSetupPlan } from './ipc-validation';

const isString = (v: unknown): v is string => typeof v === 'string';
const isViewKind = (v: unknown): v is ViewKind =>
  v === 'main' || v === 'calendar' || v === 'drive' || v === 'meet' || v === 'teams' || (isString(v) && /^extra:\d+$/.test(v));

/** Wires UI IPC to the controller. Only the main window's own UI may call it. */
export function registerIpc(win: BrowserWindow, controller: AppController): void {
  // The main window's UI, and the floating assistant (the same UI page in its own small views).
  const fromUi = (e: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean =>
    e.sender === win.webContents || controller.assistantWebContents().includes(e.sender);
  // The "Folders with panel" overlay may only read the snapshot, select an account,
  // open an account's menu and close itself.
  const fromPanel = (e: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean =>
    e.sender === controller.spacePanelWebContents();
  // The ⚡ quick-entry pop-up may only read the snapshot and the calendars, create an event,
  // add a to-do and close itself (never setModalOpen: that would hide the page under it).
  const fromQuick = (e: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean =>
    e.sender === controller.quickWebContents();
  const QUICK_CHANNELS = new Set<string>([IPC.calendarCalendars, IPC.calendarCreate, IPC.todoAdd]);

  ipcMain.handle(IPC.getSnapshot, (e) => (fromUi(e) || fromPanel(e) || fromQuick(e) ? controller.snapshot() : null));
  ipcMain.handle(IPC.addAccount, (e, input: unknown) => {
    const parsed = fromUi(e) ? parseNewAccount(input) : null;
    if (!parsed) throw new Error('Invalid account');
    return controller.addAccount(parsed);
  });
  ipcMain.on(IPC.selectAccount, (e, id: unknown) => {
    if ((fromUi(e) || fromPanel(e)) && isString(id)) controller.selectAccount(id);
  });
  ipcMain.on(IPC.updateAccount, (e, id: unknown, patch: unknown) => {
    const parsed = parseAccountPatch(patch);
    if (fromUi(e) && isString(id) && parsed) controller.updateAccount(id, parsed);
  });
  ipcMain.on(IPC.reorder, (e, ids: unknown) => {
    if (fromUi(e) && Array.isArray(ids) && ids.every(isString)) controller.reorder(ids);
  });
  ipcMain.on(IPC.accountMenu, (e, id: unknown) => {
    if ((fromUi(e) || fromPanel(e)) && isString(id)) controller.showAccountMenu(id);
  });
  ipcMain.on(IPC.selectGoogleTab, (e, id: unknown, tab: unknown) => {
    if (fromUi(e) && isString(id) && isViewKind(tab)) controller.selectGoogleTab(id, tab);
  });
  ipcMain.on(IPC.closeGoogleTab, (e, id: unknown, tab: unknown) => {
    if (fromUi(e) && isString(id) && isString(tab) && /^extra:\d+$/.test(tab)) {
      controller.closeGoogleTab(id, tab as `extra:${number}`);
    }
  });
  ipcMain.handle(IPC.getClaudeConnectInfo, (e) => (fromUi(e) ? controller.claudeConnectInfo() : null));
  ipcMain.handle(IPC.setClaudeEnabled, (e, on: unknown) =>
    fromUi(e) && typeof on === 'boolean' ? controller.setClaudeEnabled(on) : null,
  );
  ipcMain.on(IPC.stopClaude, (e, id: unknown) => {
    if (fromUi(e)) controller.stopClaude(isString(id) ? id : undefined);
  });
  ipcMain.on(IPC.openCalendar, (e) => {
    if (fromUi(e)) controller.openCalendar();
  });
  ipcMain.handle(IPC.loadCalendar, (e, range: unknown, force: unknown) => {
    const parsed = fromUi(e) ? parseCalendarRange(range) : null;
    if (!parsed) throw new Error('Invalid range');
    return controller.loadCalendar(parsed, force === true);
  });
  ipcMain.on(IPC.joinMeeting, (e, id: unknown, url: unknown) => {
    if (fromUi(e) && isString(id) && isString(url)) controller.joinMeeting(id, url);
  });
  ipcMain.on(IPC.openCalendarLink, (e, id: unknown, url: unknown) => {
    if (fromUi(e) && isString(id) && isString(url)) controller.openCalendarLink(id, url);
  });
  ipcMain.on(IPC.setCalendarHidden, (e, id: unknown, hidden: unknown) => {
    if (fromUi(e) && isString(id) && typeof hidden === 'boolean') controller.setCalendarHidden(id, hidden);
  });
  ipcMain.on(IPC.createSpace, (e, name: unknown, ids: unknown) => {
    const clean = cleanSpaceName(name);
    if (fromUi(e) && clean && Array.isArray(ids) && ids.length > 0 && ids.length <= 50 && ids.every(isString)) {
      controller.createSpace(clean, ids);
    }
  });
  ipcMain.on(IPC.renameSpace, (e, id: unknown, name: unknown) => {
    const clean = cleanSpaceName(name);
    if (fromUi(e) && isString(id) && clean) controller.renameSpace(id, clean);
  });
  ipcMain.handle(IPC.dropInSidebar, (e, drag: unknown, target: unknown, zone: unknown) => {
    const d = parseDragRef(drag);
    const t = parseDragRef(target);
    const z = parseDropZone(zone);
    return fromUi(e) && d && t && z ? controller.dropInSidebar(d, t, z) : null;
  });
  const bool = (v: unknown): v is boolean => typeof v === 'boolean';
  const on = (channel: string, handler: (...args: unknown[]) => void): void => {
    ipcMain.on(channel, (e, ...args: unknown[]) => {
      if (fromUi(e) || (QUICK_CHANNELS.has(channel) && fromQuick(e))) handler(...args);
    });
  };
  // Calendar editing: every argument is checked; anything invalid is refused without calling Google.
  const BAD = { ok: false, error: 'error' } as const;
  const write = (channel: string, fn: (...args: unknown[]) => Promise<unknown> | null): void => {
    ipcMain.handle(channel, (e, ...args: unknown[]) => (fromUi(e) || (QUICK_CHANNELS.has(channel) && fromQuick(e)) ? (fn(...args) ?? BAD) : BAD));
  };
  write(IPC.calendarCalendars, (a) => (isString(a) ? controller.calendarCalendars(a) : null));
  write(IPC.calendarGetEvent, (a, c, ev) => (isString(a) && isGoogleId(c) && isGoogleId(ev) ? controller.calendarGetEvent(a, c, ev) : null));
  write(IPC.calendarCreate, (a, d, s) => {
    const draft = parseEventDraft(d);
    const send = parseSendUpdates(s);
    return isString(a) && draft && send ? controller.calendarCreate(a, draft, send) : null;
  });
  write(IPC.calendarUpdate, (a, ev, d, scope, s) => {
    const draft = parseEventDraft(d);
    const sc = parseScope(scope);
    const send = parseSendUpdates(s);
    return isString(a) && isGoogleId(ev) && draft && sc && send ? controller.calendarUpdate(a, ev, draft, sc, send) : null;
  });
  write(IPC.calendarMove, (a, c, ev, start, end, allDay, scope) => {
    const t = parseTimes(start, end, allDay);
    const sc = parseScope(scope);
    return isString(a) && isGoogleId(c) && isGoogleId(ev) && t && sc ? controller.calendarMove(a, c, ev, t.start, t.end, t.allDay, sc) : null;
  });
  write(IPC.calendarDelete, (a, c, ev, scope, s) => {
    const sc = parseScope(scope);
    const send = parseSendUpdates(s);
    return isString(a) && isGoogleId(c) && isGoogleId(ev) && sc && send ? controller.calendarDelete(a, c, ev, sc, send) : null;
  });
  write(IPC.calendarRespond, (a, c, ev, r) => {
    const reply = parseReply(r);
    return isString(a) && isGoogleId(c) && isGoogleId(ev) && reply ? controller.calendarRespond(a, c, ev, reply) : null;
  });
  write(IPC.calendarChangeCalendar, (a, from, ev, to) =>
    isString(a) && isGoogleId(from) && isGoogleId(ev) && isGoogleId(to) ? controller.calendarChangeCalendar(a, from, ev, to) : null,
  );
  on(IPC.openToday, () => controller.openToday());
  on(IPC.setOpenOnToday, (on) => typeof on === 'boolean' && controller.setOpenOnToday(on));
  on(IPC.openMessage, (key) => typeof key === 'string' && key.length <= 600 && controller.openMessage(key));
  on(IPC.dismissMessage, (key) => typeof key === 'string' && key.length <= 600 && controller.dismissMessage(key));
  on(IPC.clearMessages, () => controller.clearMessages());
  on(IPC.setMessagePreviews, (on) => typeof on === 'boolean' && controller.setMessagePreviews(on));
  on(IPC.checkForUpdates, () => controller.checkForUpdates());
  on(IPC.installUpdate, () => controller.installUpdate());
  on(IPC.setAutoUpdate, (on) => typeof on === 'boolean' && controller.setAutoUpdate(on));
  on(IPC.todoAdd, (text, tag) => {
    const t = parseTodoTag(tag);
    if (typeof text === 'string' && t !== false && t !== null) controller.todoAdd(text, t);
  });
  on(IPC.todoUpdate, (id, patch) => {
    if (!isString(id) || typeof patch !== 'object' || patch === null) return;
    const p = patch as Record<string, unknown>;
    const tag = parseTodoTag(p.tag);
    if (tag === false) return;
    if (p.text !== undefined && typeof p.text !== 'string') return;
    if (p.done !== undefined && typeof p.done !== 'boolean') return;
    controller.todoUpdate(id, {
      ...(typeof p.text === 'string' ? { text: p.text } : {}),
      ...(typeof p.done === 'boolean' ? { done: p.done } : {}),
      ...(tag !== undefined ? { tag } : {}),
    });
  });
  on(IPC.todoRemove, (id) => isString(id) && controller.todoRemove(id));
  on(IPC.todosClearDone, () => controller.todosClearDone());
  on(IPC.toggleAssistant, (open) => controller.toggleAssistant(typeof open === 'boolean' ? open : undefined));
  ipcMain.handle(IPC.assistantSend, (e, text: unknown, target: unknown) => {
    if (!fromUi(e) || typeof text !== 'string' || !text.trim() || text.length > 20_000) return null;
    const t = target as { scope?: unknown; conversationId?: unknown } | undefined;
    const ok = t && isScopeKey(t.scope) && (t.conversationId === null || (isString(t.conversationId) && t.conversationId.length < 80));
    return controller.assistantSend(text, ok ? { scope: t.scope as string, conversationId: t.conversationId as string | null } : undefined);
  });
  ipcMain.handle(IPC.assistantConversation, (e, id: unknown) => (fromUi(e) && isString(id) ? controller.assistantConversation(id) : null));
  on(IPC.assistantOpenConversation, (id) => isString(id) && controller.assistantOpenConversation(id));
  on(IPC.assistantDeleteConversation, (id) => isString(id) && controller.assistantDeleteConversation(id));
  on(IPC.assistantSetScope, (scope) => isScopeKey(scope) && controller.assistantSetScope(scope));
  on(IPC.setAssistantMode, (mode) => (mode === 'space' || mode === 'all') && controller.setAssistantMode(mode));
  on(IPC.setAssistantScopeConfig, (scope, patch) => {
    if (!isScopeKey(scope) || typeof patch !== 'object' || patch === null) return;
    const p = patch as Record<string, unknown>;
    const clean: Partial<ScopeConfig> = {
      ...(isEngine(p.engine) ? { engine: p.engine } : {}),
      ...(isAssistantModel(p.model) ? { model: p.model } : {}),
      ...(isAssistantEffort(p.effort) ? { effort: p.effort } : {}),
      ...(isOpenRouterModel(p.openrouterModel) ? { openrouterModel: p.openrouterModel } : {}),
      ...(isCodexModel(p.codexModel) ? { codexModel: p.codexModel } : {}),
    };
    if (Object.keys(clean).length) controller.setAssistantScopeConfig(scope, clean);
  });
  on(IPC.assistantStop, () => controller.assistantStop());
  on(IPC.assistantAsk, (text) => typeof text === 'string' && text.trim() && text.length <= 20_000 && controller.assistantAsk(text));
  on(IPC.setAssistantButton, (v) => typeof v === 'boolean' && controller.setAssistantButton(v));
  on(IPC.assistantSignInCancel, () => controller.assistantSignInCancel());
  ipcMain.handle(IPC.claudeIntegrationStatus, (e) => (fromUi(e) ? controller.claudeIntegrationStatus() : null));
  ipcMain.handle(IPC.codexStatus, (e) => (fromUi(e) ? controller.codexStatus() : null));
  ipcMain.handle(IPC.codexSignIn, (e) => (fromUi(e) ? controller.codexSignIn() : null));
  on(IPC.codexSignInCancel, () => controller.codexSignInCancel());
  ipcMain.handle(IPC.openRouterStatus, (e) => (fromUi(e) ? controller.openRouterStatus() : null));
  ipcMain.handle(IPC.openRouterConnect, (e, key: unknown) =>
    fromUi(e) && typeof key === 'string' && /^\S{10,300}$/.test(key.trim()) ? controller.openRouterConnect(key.trim()) : { connected: false, error: 'That doesn’t look like an OpenRouter key.' },
  );
  on(IPC.openRouterDisconnect, () => controller.openRouterDisconnect());
  ipcMain.handle(IPC.openRouterModels, (e) => (fromUi(e) ? controller.openRouterModels() : []));
  on(IPC.assistantFabDrag, (phase) => (phase === 'start' || phase === 'end') && controller.assistantFabDrag(phase));
  on(IPC.assistantChatResize, (phase, edges) => {
    if (phase === 'end') return controller.assistantChatResize('end');
    const e = (edges ?? {}) as { x?: unknown; y?: unknown };
    const x = e.x === 'left' || e.x === 'right' ? e.x : undefined;
    const y = e.y === 'top' || e.y === 'bottom' ? e.y : undefined;
    if (phase === 'start' && (x || y)) controller.assistantChatResize('start', { ...(x ? { x } : {}), ...(y ? { y } : {}) });
  });
  ipcMain.handle(IPC.assistantStatus, (e) => (fromUi(e) ? controller.assistantStatus() : null));
  ipcMain.handle(IPC.assistantSignIn, (e) => (fromUi(e) ? controller.assistantSignIn() : null));
  on(IPC.openExternal, (url) => typeof url === 'string' && controller.openExternalLink(url));
  on(IPC.assistantNewChat, () => controller.assistantNewChat());
  on(IPC.assistantSetModel, (m, e) => isAssistantModel(m) && isAssistantEffort(e) && controller.assistantSetModel(m, e));
  on(IPC.assistantSetWidth, (w) => typeof w === 'number' && Number.isFinite(w) && controller.assistantSetWidth(w));
  on(IPC.openSetup, () => controller.openSetup());
  on(IPC.skipSetup, () => controller.skipSetup());
  ipcMain.handle(IPC.finishSetup, (e, plan: unknown) => {
    const parsed = fromUi(e) ? parseSetupPlan(plan) : null;
    if (!parsed) throw new Error('Invalid setup');
    return controller.finishSetup(parsed);
  });
  on(IPC.openSettings, (section) => controller.openSettings(typeof section === 'string' && /^[a-z]{1,20}$/.test(section) ? section : undefined));
  on(IPC.closeSettings, () => controller.closeSettings());
  ipcMain.handle(IPC.getAppInfo, (e) => (fromUi(e) ? controller.appInfo() : null));
  on(IPC.chooseAccountImage, (id) => isString(id) && controller.chooseAccountImage(id));
  on(IPC.removeAccount, (id) => isString(id) && controller.removeAccountById(id));
  on(IPC.moveToSpace, (id, spaceId) => isString(id) && (spaceId === null || isString(spaceId)) && controller.moveToSpace(id, spaceId));
  on(IPC.setSpaceAlwaysOpen, (id, v) => isString(id) && bool(v) && controller.setSpaceAlwaysOpen(id, v));
  on(IPC.setSpaceShareGoogle, (id, v) => isString(id) && bool(v) && controller.setSpaceShareGoogle(id, v));
  on(IPC.setSpaceGoogleAccount, (id, acc) => isString(id) && isString(acc) && controller.setSpaceGoogleAccount(id, acc));
  on(IPC.ungroupSpace, (id) => isString(id) && controller.ungroupSpace(id));
  on(IPC.setSidebarStyle, (v) => {
    const style = parseSidebarStyle(v);
    if (style) controller.setSidebarStyle(style);
  });
  on(IPC.setWeekStart, (v) => {
    const w = parseWeekStart(v);
    if (w !== null) controller.setWeekStart(w);
  });
  on(IPC.showDataFolder, () => controller.showDataFolder());
  on(IPC.showClaudeLog, () => controller.showClaudeLog());
  ipcMain.on(IPC.setSpaceOpen, (e, id: unknown, open: unknown) => {
    if (fromUi(e) && isString(id) && typeof open === 'boolean') controller.setSpaceOpen(id, open);
  });
  ipcMain.on(IPC.addMenu, (e) => {
    if (fromUi(e)) controller.showAddMenu();
  });
  ipcMain.on(IPC.actionsMenu, (e) => {
    if (fromUi(e)) controller.showActionsMenu();
  });
  ipcMain.on(IPC.quickClose, (e) => {
    if (fromQuick(e) || fromUi(e)) controller.quickClose();
  });
  ipcMain.on(IPC.quickDone, (e, message: unknown) => {
    if (fromQuick(e) && typeof message === 'string' && message.length <= 80) controller.quickDone(message);
  });
  ipcMain.on(IPC.spaceMenu, (e, id: unknown) => {
    if (fromUi(e) && isString(id)) controller.showSpaceMenu(id);
  });
  ipcMain.on(IPC.openSpacePanel, (e, id: unknown, top: unknown) => {
    if (fromUi(e) && isString(id) && typeof top === 'number' && Number.isFinite(top)) controller.openSpacePanel(id, top);
  });
  ipcMain.on(IPC.closeSpacePanel, (e) => {
    if (fromUi(e) || fromPanel(e)) controller.closeSpacePanel();
  });
  ipcMain.on(IPC.setModalOpen, (e, open: unknown) => {
    if (fromUi(e) && typeof open === 'boolean') controller.setModalOpen(open);
  });
}
