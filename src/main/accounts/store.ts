import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyDrop,
  assignSpace,
  cleanSpaceName,
  type DragRef,
  type DropZone,
  groupInto,
  moveWithinContainer,
  normalizeSpaces,
  ungroupSpace,
} from '../../shared/spaces';
import type { LanguageSetting } from '../../shared/i18n/locales';
import type { MeetingGlobalSettings, SpaceMeetingSettings } from '../../shared/meeting';
import { t } from '../../shared/i18n';
import type { Account, AppState, GoogleSubApp, ServiceId, SidebarStyle, Space } from '../../shared/types';

export interface Store {
  state(): AppState;
  /** Adds an account, optionally straight into an existing space or a new one. */
  add(input: { service: ServiceId; name: string; color: string; url?: string }, place?: { spaceId: string } | { newSpace: string }): Account;
  update(
    id: string,
    patch: Partial<Pick<Account, 'name' | 'color' | 'muted' | 'hibernateWhenIdle' | 'iconMode' | 'iconSourceAccountId' | 'claudeAccess' | 'teamsInBackground' | 'siteMoves'>>,
  ): Account;
  remove(id: string): void;
  reorder(ids: string[]): void;
  setActive(id: string | null): void;
  setGoogleSubApp(id: string, sub: GoogleSubApp): void;
  setWindow(bounds: AppState['window']): void;
  setClaudeEnabled(on: boolean): void;
  setCalendarHidden(id: string, hidden: boolean): void;
  createSpace(name: string, accountIds: string[]): Space;
  renameSpace(id: string, name: string): void;
  setSpaceAlwaysOpen(id: string, on: boolean): void;
  /** Remembers whether the user left a space open (Folders style). */
  setSpaceOpen(id: string, open: boolean): void;
  setSpaceShareGoogle(id: string, on: boolean): void;
  /** Which Google account in the space shares its sign-in (must be a Google member). */
  setSpaceGoogleAccount(id: string, accountId: string): void;
  setSpaceChromeProfile(id: string, dir: string | null): void;
  setLinksInApp(on: boolean): void;
  ungroup(id: string): void;
  moveToSpace(accountId: string, spaceId: string | null): void;
  /** Applies a sidebar drop; returns the accounts to group when a new space must be named first. */
  dropInSidebar(drag: DragRef, target: DragRef, zone: DropZone): { create: [string, string] } | null;
  moveWithin(accountId: string, delta: -1 | 1): void;
  setSidebarStyle(style: SidebarStyle): void;
  setWeekStart(v: 0 | 1 | 'auto'): void;
  setLanguage(v: LanguageSetting): void;
  /** A scope's meeting settings ('space:<id>' or 'nospace'); an unknown space is ignored. */
  setSpaceMeetings(scope: string, s: SpaceMeetingSettings): void;
  setMeetingGlobal(patch: Partial<MeetingGlobalSettings>): void;
  setCalendarDefaultAccount(id: string): void;
  setAssistantPrefs(prefs: { model?: string; effort?: string; width?: number; height?: number; defaultEngine?: string; button?: boolean; fab?: { side: 'left' | 'right'; y: number }; mode?: 'space' | 'all'; scopes?: Record<string, { engine?: string; model?: string; effort?: string; openrouterModel?: string; codexModel?: string }> }): void;
  setOpenOnToday(on: boolean): void;
  setHomePreviews(on: boolean): void;
  setAutoUpdate(on: boolean): void;
  /** The first-run setup was finished or skipped. */
  setOnboarded(): void;
  /** The user's name ('' forgets it). */
  setUserName(name: string): void;
  loadWarning(): string | null;
}

function defaultState(): AppState {
  return {
    version: 1,
    accounts: [],
    activeAccountId: null,
    activeGoogleSubApp: {},
    window: { x: 100, y: 100, width: 1400, height: 900 },
  };
}

function isAppState(v: unknown): v is AppState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Partial<AppState>;
  return (
    s.version === 1 &&
    Array.isArray(s.accounts) &&
    typeof s.activeGoogleSubApp === 'object' &&
    s.activeGoogleSubApp !== null &&
    typeof s.window === 'object' &&
    s.window !== null
  );
}

/** Spaces cleaned up: no dangling ids, no empty spaces, members contiguous. */
function normalized(s: AppState): AppState {
  const spaces = Array.isArray(s.spaces)
    ? s.spaces.filter((x): x is Space => typeof x === 'object' && x !== null && typeof x.id === 'string' && typeof x.name === 'string')
    : [];
  const n = normalizeSpaces(s.accounts, spaces);
  return { ...s, accounts: n.accounts, spaces: n.spaces };
}

export function createStore(filePath: string): Store {
  let unreadable = false; // the saved file couldn't be read (the warning is written when shown)
  let state = load();

  function load(): AppState {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch {
      return defaultState();
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isAppState(parsed)) return normalized(parsed);
    } catch {
      // fall through to recovery
    }
    fs.copyFileSync(filePath, `${filePath}.bak`);
    unreadable = true;
    return defaultState();
  }

  function save(): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, filePath);
  }

  function find(id: string): Account {
    const account = state.accounts.find((a) => a.id === id);
    if (!account) throw new Error(`Unknown account ${id}`);
    return account;
  }

  return {
    state: () => state,
    loadWarning: () => (unreadable ? t('main.store.loadWarning') : null),

    add(input, place) {
      const account: Account = { id: randomUUID(), ...input, muted: false, hibernateWhenIdle: false };
      state = { ...state, accounts: [...state.accounts, account] };
      if (place && 'newSpace' in place && cleanSpaceName(place.newSpace)) {
        return { ...account, spaceId: this.createSpace(place.newSpace, [account.id]).id };
      }
      if (place && 'spaceId' in place && state.spaces?.some((s) => s.id === place.spaceId)) {
        this.moveToSpace(account.id, place.spaceId);
        return find(account.id);
      }
      save();
      return account;
    },

    update(id, patch) {
      const updated = { ...find(id), ...patch };
      state = { ...state, accounts: state.accounts.map((a) => (a.id === id ? updated : a)) };
      save();
      return updated;
    },

    remove(id) {
      const { [id]: _removed, ...rest } = state.activeGoogleSubApp;
      state = {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== id),
        activeAccountId: state.activeAccountId === id ? null : state.activeAccountId,
        activeGoogleSubApp: rest,
        ...(state.calendarHidden ? { calendarHidden: state.calendarHidden.filter((x) => x !== id) } : {}),
      };
      state = normalized(state);
      save();
    },

    reorder(ids) {
      const current = new Set(state.accounts.map((a) => a.id));
      if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((id) => current.has(id))) {
        throw new Error('reorder: ids must be a permutation of the current account ids');
      }
      state = normalized({ ...state, accounts: ids.map(find) });
      save();
    },

    setActive(id) {
      state = { ...state, activeAccountId: id };
      save();
    },

    setGoogleSubApp(id, sub) {
      state = { ...state, activeGoogleSubApp: { ...state.activeGoogleSubApp, [id]: sub } };
      save();
    },

    setClaudeEnabled(on) {
      state = { ...state, claudeEnabled: on };
      save();
    },

    setCalendarHidden(id, hidden) {
      if (!state.accounts.some((a) => a.id === id)) return;
      if (hidden === (state.calendarHidden ?? []).includes(id)) return;
      const rest = (state.calendarHidden ?? []).filter((x) => x !== id);
      state = { ...state, calendarHidden: hidden ? [...rest, id] : rest };
      save();
    },

    createSpace(name, accountIds) {
      const clean = cleanSpaceName(name);
      const ids = accountIds.filter((id) => state.accounts.some((a) => a.id === id));
      if (!clean || ids.length === 0) throw new Error('createSpace: a name and at least one account are needed');
      const space: Space = { id: randomUUID(), name: clean };
      const spaces = [...(state.spaces ?? []), space];
      state = normalized({ ...state, spaces, accounts: groupInto(state.accounts, ids, space.id) });
      save();
      return space;
    },

    renameSpace(id, name) {
      const clean = cleanSpaceName(name);
      if (!clean || !state.spaces?.some((s) => s.id === id)) return;
      state = { ...state, spaces: state.spaces.map((s) => (s.id === id ? { ...s, name: clean } : s)) };
      save();
    },

    setSpaceAlwaysOpen(id, on) {
      if (!state.spaces?.some((s) => s.id === id)) return;
      state = {
        ...state,
        spaces: state.spaces.map((s) => {
          if (s.id !== id) return s;
          const { alwaysOpen: _drop, ...rest } = s;
          return on ? { ...rest, alwaysOpen: true } : rest;
        }),
      };
      save();
    },

    setSpaceOpen(id, open) {
      if (!state.spaces?.some((s) => s.id === id)) return;
      state = {
        ...state,
        spaces: state.spaces.map((s) => {
          if (s.id !== id) return s;
          const { open: _drop, ...rest } = s;
          return open ? { ...rest, open: true } : rest;
        }),
      };
      save();
    },

    setSpaceShareGoogle(id, on) {
      if (!state.spaces?.some((s) => s.id === id)) return;
      state = {
        ...state,
        spaces: state.spaces.map((s) => {
          if (s.id !== id) return s;
          const { shareGoogle: _drop, ...rest } = s;
          return on ? rest : { ...rest, shareGoogle: false };
        }),
      };
      save();
    },

    setSpaceGoogleAccount(id, accountId) {
      const member = state.accounts.find((a) => a.id === accountId && a.spaceId === id && a.service === 'google');
      if (!member || !state.spaces?.some((s) => s.id === id)) return;
      state = { ...state, spaces: state.spaces.map((s) => (s.id === id ? { ...s, googleAccountId: accountId } : s)) };
      save();
    },

    ungroup(id) {
      state = normalized({ ...state, accounts: ungroupSpace(state.accounts, id) });
      save();
    },

    moveToSpace(accountId, spaceId) {
      state = normalized({ ...state, accounts: assignSpace(state.accounts, state.spaces ?? [], accountId, spaceId) });
      save();
    },

    dropInSidebar(drag, target, zone) {
      const r = applyDrop(state.accounts, state.spaces ?? [], drag, target, zone);
      if (!r) return null;
      if ('create' in r) return r;
      state = normalized({ ...state, accounts: r.accounts });
      save();
      return null;
    },

    moveWithin(accountId, delta) {
      state = normalized({ ...state, accounts: moveWithinContainer(state.accounts, state.spaces ?? [], accountId, delta) });
      save();
    },

    setOnboarded() {
      state = { ...state, onboarded: true };
      save();
    },

    setUserName(name) {
      const { userName: _old, ...rest } = state;
      state = name ? { ...rest, userName: name } : rest;
      save();
    },

    setOpenOnToday(on) {
      const { openOnToday: _drop, ...rest } = state;
      state = on ? rest : { ...rest, openOnToday: false };
      save();
    },

    setLinksInApp(on) {
      const { linksInApp: _drop, ...rest } = state;
      state = on ? rest : { ...rest, linksInApp: false };
      save();
    },

    setSpaceChromeProfile(id, dir) {
      if (!state.spaces?.some((s) => s.id === id)) return;
      state = {
        ...state,
        spaces: state.spaces.map((s) => {
          if (s.id !== id) return s;
          const { chromeProfile: _drop, ...rest } = s;
          return dir ? { ...rest, chromeProfile: dir } : rest;
        }),
      };
      save();
    },

    setHomePreviews(on) {
      const { homePreviews: _drop, ...rest } = state;
      state = on ? rest : { ...rest, homePreviews: false };
      save();
    },

    setAutoUpdate(on) {
      const { autoUpdate: _drop, ...rest } = state;
      state = on ? rest : { ...rest, autoUpdate: false };
      save();
    },

    setAssistantPrefs(prefs) {
      state = { ...state, assistant: { ...(state.assistant ?? {}), ...prefs } };
      save();
    },

    setCalendarDefaultAccount(id) {
      if (!state.accounts.some((a) => a.id === id && a.service === 'google')) return;
      state = { ...state, calendarDefaultAccount: id };
      save();
    },

    setWeekStart(v) {
      const { weekStart: _drop, ...rest } = state;
      state = v === 'auto' ? rest : { ...rest, weekStart: v };
      save();
    },

    setSpaceMeetings(scope, s) {
      if (scope === 'nospace') {
        state = { ...state, meetings: { ...(state.meetings ?? {}), nospace: s } };
      } else {
        const id = scope.startsWith('space:') ? scope.slice(6) : '';
        if (!state.spaces?.some((sp) => sp.id === id)) return;
        state = { ...state, spaces: state.spaces.map((sp) => (sp.id === id ? { ...sp, meetings: s } : sp)) };
      }
      save();
    },

    setMeetingGlobal(patch) {
      state = { ...state, meetings: { ...(state.meetings ?? {}), ...patch } };
      save();
    },

    setLanguage(v) {
      const { language: _drop, ...rest } = state;
      state = v === 'system' ? rest : { ...rest, language: v };
      save();
    },

    setSidebarStyle(style) {
      state = { ...state, sidebarStyle: style };
      save();
    },

    setWindow(bounds) {
      state = { ...state, window: bounds };
      save();
    },
  };
}
