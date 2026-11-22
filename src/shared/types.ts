import type { JoinLink } from './meetings';
export type ServiceId = 'google' | 'slack' | 'whatsapp' | 'microsoft' | 'telegram' | 'linkedin' | 'discord' | 'zoom' | 'proton' | 'icloud' | 'fastmail' | 'notion' | 'custom';
/** A tab of a tabbed account (Google, Microsoft 365). `mail` is the account's main view. */
export type SubApp = 'mail' | 'calendar' | 'drive' | 'meet' | 'teams';
/** @deprecated the old name of SubApp */
export type GoogleSubApp = SubApp;

/** 0 means nothing unread; 'dot' means unread with an unknown count. */
export type UnreadCount = number | 'dot';

/**
 * A view inside an account. A Google account's Gmail (a Microsoft 365 account's
 * Outlook) is its `main` view; Slack and WhatsApp accounts only have `main`.
 */
export type ViewKind = 'main' | 'calendar' | 'drive' | 'meet' | 'teams' | `extra:${number}`;

export interface Account {
  id: string;
  service: ServiceId;
  name: string;
  color: string;
  muted: boolean;
  hibernateWhenIdle: boolean;
  /**
   * 'auto' (default): company logo or person photo when known.
   * 'service': the Google/Slack/WhatsApp logo. 'letter': the letter and colour.
   * 'account': the same image as another account. 'custom': an image the user chose.
   */
  iconMode?: IconMode;
  /** With iconMode 'account': whose image to show. */
  iconSourceAccountId?: string;
  /** What Claude may do in this account (default 'off'). */
  claudeAccess?: ClaudeAccess;
  /** The space it is grouped in, if any. */
  spaceId?: string;
  /** A custom app (any website): its address (https). */
  url?: string;
  /** A custom app: other domains of the same site it moved to on load (e.g. notion.so → notion.com). */
  siteMoves?: string[];
  /** Microsoft 365: the user has opened Teams, so it now runs in the background for notifications. */
  teamsInBackground?: boolean;
}

/** A group of accounts in the sidebar (organisation only: sessions stay per account). */
export interface Space {
  id: string;
  name: string;
  /** In the Folders style, keep it open. */
  alwaysOpen?: boolean;
  /** In the Folders style, the user left it open (remembered across restarts). */
  open?: boolean;
  /** Share Google sign-in between the space's apps (default on; false = off). */
  shareGoogle?: boolean;
  /** The Google account whose sign-in the space shares (default: its first Google account). */
  googleAccountId?: string;
}

export type SidebarStyle = 'folders' | 'panel' | 'sections';

export type ClaudeAccess = 'off' | 'read' | 'act';

export type IconMode = 'auto' | 'service' | 'letter' | 'account' | 'custom';

/** What the sidebar draws for an account. */
export type AccountIcon = { kind: 'image'; src: string } | { kind: 'service' } | { kind: 'letter' };

export interface AppState {
  version: 1;
  accounts: Account[];
  activeAccountId: string | null;
  activeGoogleSubApp: Record<string, GoogleSubApp>;
  window: { x: number; y: number; width: number; height: number };
  /** Master switch: "Allow Claude to connect" (default false). */
  claudeEnabled?: boolean;
  /** First day of the week chosen in Settings (unset: from the Mac). */
  weekStart?: 0 | 1;
  /** The first-run setup was finished or skipped. */
  onboarded?: boolean;
  /** Open Mission Desk on the Home page (the Today page in code; default on; false = off). */
  openOnToday?: boolean;
  /** Home's message list shows the start of each message (false: only who sent it). */
  homePreviews?: boolean;
  /** Check GitHub for new versions in the background (false: only when asked). */
  autoUpdate?: boolean;
  /** The assistant panel's choices (model, effort, width). */
  assistant?: { model?: string; effort?: string; width?: number; height?: number; defaultEngine?: string; button?: boolean; fab?: { side: 'left' | 'right'; y: number }; mode?: 'space' | 'all';
    /** Per scope ('space:<id>', 'nospace', 'all'): which assistant, model and effort. */
    scopes?: Record<string, { engine?: string; model?: string; effort?: string; openrouterModel?: string; codexModel?: string }>;
  };
  /** The Google account last used to create an event in the unified calendar. */
  calendarDefaultAccount?: string;
  /** Google accounts hidden in the "All calendars" view. */
  calendarHidden?: string[];
  /** Account groups in the sidebar; members are contiguous in `accounts`. */
  spaces?: Space[];
  /** How spaces are drawn (default 'folders'). */
  sidebarStyle?: SidebarStyle;
}

export function subAppToKind(s: GoogleSubApp): ViewKind {
  return s === 'mail' ? 'main' : s;
}

export function kindToSubApp(k: ViewKind): GoogleSubApp | null {
  if (k === 'main') return 'mail';
  if (k === 'calendar' || k === 'drive' || k === 'meet' || k === 'teams') return k;
  return null;
}

/** A time span to read, as ISO instants (end exclusive). */
export interface CalendarRange {
  start: string;
  end: string;
}

/**
 * One event in the combined calendar. Only these fields ever leave Google's
 * response. All-day events use `YYYY-MM-DD` dates with `end` exclusive;
 * timed events use ISO date-times.
 */
export interface CalEvent {
  id: string;
  accountId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  response: 'accepted' | 'tentative' | 'needsAction' | 'none';
  /** https://calendar.google.com/calendar/event?eid=… */
  openUrl?: string;
  /** https://meet.google.com/<code> */
  meetUrl?: string;
  /** The meeting to join (Meet, Zoom, Teams, Webex…), from the event's call, location or description. */
  join?: JoinLink;
  /** Google's ids, for writes. */
  calendarId: string;
  eventId: string;
  /** The user may change it (organiser or guests-can-modify, in a writable calendar). */
  editable: boolean;
  /** An instance of a repeating event. */
  recurring: boolean;
  /** The user is a guest (not the organiser) and can reply. */
  invited: boolean;
  /** Shown as "free" in Google (transparent): doesn't block time. */
  free?: boolean;
}

export interface AccountCalendarStatus {
  accountId: string;
  state: 'ok' | 'signed-out' | 'error' | 'offline';
}

export interface CalendarData {
  events: CalEvent[];
  status: AccountCalendarStatus[];
}

/** An event as the editor fills it in. All-day dates are `YYYY-MM-DD`, end exclusive. */
export interface EventDraft {
  calendarId: string;
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  location: string;
  description: string;
  /** Guests' emails (not the user). */
  guests: string[];
  /** Has (or should get) a Google Meet link. */
  meet: boolean;
}

/** An existing event, read fresh for the editor. */
export interface EditableEvent extends EventDraft {
  eventId: string;
  /** The repeating series it belongs to. */
  seriesId?: string;
  meetUrl?: string;
  editable: boolean;
}

export interface WritableCalendar {
  id: string;
  name: string;
  primary: boolean;
}

export type WriteScope = 'this' | 'all';
export type Reply = 'accepted' | 'declined' | 'tentative';
export type SendUpdates = 'all' | 'none';
export type WriteError = 'signed-out' | 'error' | 'offline' | 'forbidden' | 'unsupported';
export type WriteResult = { ok: true; event?: EditableEvent } | { ok: false; error: WriteError };

/** A to-do on the Today page (stored locally in todos.json). */
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  /** ISO time it was added. */
  createdAt: string;
  doneAt?: string;
  /** Local day it was added (YYYY-MM-DD). */
  day: string;
  /** The client it belongs to: a space, or a loose account. */
  tag?: { kind: 'space' | 'account'; id: string };
}
