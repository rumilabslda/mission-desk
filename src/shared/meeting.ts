/** Meeting transcription: settings, stored meetings and what the UI shows. */

export type MeetingMode = 'always' | 'ask' | 'off';
export type EngineId = 'apple' | 'whisper' | 'parakeet';
export type MeetingProviderId = 'meet' | 'teams' | 'zoom';
export type MeetingAction = 'summary' | 'myTodos' | 'waitingOn' | 'email' | 'memory' | 'event';

export const MEETING_ACTIONS: MeetingAction[] = ['summary', 'myTodos', 'waitingOn', 'email', 'memory', 'event'];
export const DEFAULT_ACTIONS: MeetingAction[] = ['summary', 'myTodos', 'waitingOn', 'email'];
export const ENGINES: EngineId[] = ['apple', 'whisper', 'parakeet'];
export const RETENTION_DAYS = [0, 30, 90] as const;
export const MAX_NOTICE = 300;

/** One space's choices (or the apps outside spaces'). */
export interface SpaceMeetingSettings {
  mode: MeetingMode;
  /** The meetings' language, as an engine locale ("pt-PT"); unset: from the interface language. */
  language?: string;
  /** The "Meeting ended" ticks, as last left. */
  actions?: MeetingAction[];
}

export interface MeetingGlobalSettings {
  engine?: EngineId;
  /** The sentence "Copy notice" copies (unset: the built-in one in the interface language). */
  notice?: string;
  /** Delete transcripts (keeping summaries) after this many days; 0 or unset: never. */
  retentionDays?: (typeof RETENTION_DAYS)[number];
  /** The apps outside spaces. */
  nospace?: SpaceMeetingSettings;
}

/** A piece of transcript. Times in ms since the meeting started. */
export interface Segment {
  start: number;
  end: number;
  /** 'me', 'others', or a participant's name as the meeting page shows it. */
  speaker: string;
  text: string;
}

/** What the assistant returned for a meeting (only the parts that were asked for). */
export interface FollowUpResult {
  summary?: { decisions: string[]; points: string[]; nextSteps: string[] };
  myTodos?: string[];
  waitingOn?: { who: string; what: string }[];
  email?: { to: string[]; subject: string; body: string };
  memoryNotes?: string[];
  followUpEvent?: { title: string; start: string; end: string; guests: string[] };
}

export interface Meeting {
  id: string;
  /** 'space:<id>' or 'nospace'. */
  scope: string;
  accountId: string;
  provider: MeetingProviderId;
  url: string;
  title: string;
  startedAt: string;
  endedAt?: string;
  language: string;
  engine: EngineId;
  /** The calendar event it was matched to (by its meeting link and time). */
  event?: { accountId: string; eventId: string; calendarId?: string; googleEventId?: string };
  segments: Segment[];
  gaps: { start: number; end: number }[];
  result?: FollowUpResult;
  /** Actions whose result was applied. */
  applied?: MeetingAction[];
  /** The actions chosen for it. */
  actions?: MeetingAction[];
  /** The transcript was deleted after the retention period (the summary stays). */
  transcriptPruned?: boolean;
}

export type MeetingState = 'transcribing' | 'notRun' | 'running' | 'ready' | 'failed';

/** A meeting in lists (the snapshot): no transcript. */
export interface MeetingListItem {
  id: string;
  scope: string;
  title: string;
  startedAt: string;
  minutes: number;
  state: MeetingState;
  event?: Meeting['event'];
  /** Why the last run failed. */
  error?: string;
}

/** What the "Meeting ended" window shows. */
export interface MeetingEndedInfo {
  scope: string;
  id: string;
  title: string;
  minutes: number;
  language: string;
  spaceName: string;
  /** The space's saved ticks. */
  defaults: MeetingAction[];
  /** The space has an assistant to run them. */
  askAvailable: boolean;
}

/** The meeting being transcribed. */
export interface LiveMeeting {
  id: string;
  scope: string;
  accountId: string;
  paused: boolean;
  language: string;
  engine: EngineId;
  notice?: { code: 'fellBack' | 'localeMissing' | 'missingSide' | 'probeUnreliable'; text: string; locale?: string };
}

export interface EngineStatus {
  id: EngineId;
  state: 'ready' | 'notDownloaded' | 'downloading' | 'unavailable';
  /** 0–1 while downloading. */
  progress?: number;
  /** Size on disk (or to download). */
  bytes: number;
  reason?: string;
}

export const isMeetingMode = (v: unknown): v is MeetingMode => v === 'always' || v === 'ask' || v === 'off';
export const isEngineId = (v: unknown): v is EngineId => (ENGINES as unknown[]).includes(v);
export const isMeetingAction = (v: unknown): v is MeetingAction => (MEETING_ACTIONS as unknown[]).includes(v);
/** An engine locale: "pt-PT", "en-US", "pt". */
export const isMeetingLocale = (v: unknown): v is string => typeof v === 'string' && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(v);

/** A space's settings, with the default (Ask) when it has none. */
export function spaceMeetingSettings(s: { meetings?: SpaceMeetingSettings } | undefined): SpaceMeetingSettings {
  return s?.meetings ?? { mode: 'ask' };
}

/** The regional variants transcription engines know, per language (the first is the default). */
const LOCALE_REGIONS: Record<string, string[]> = {
  en: ['US', 'GB', 'AU', 'CA', 'IE', 'IN', 'NZ', 'SG', 'ZA'],
  es: ['ES', 'MX', 'US', 'CL'],
  fr: ['FR', 'BE', 'CA', 'CH'],
  de: ['DE', 'AT', 'CH'],
  it: ['IT', 'CH'],
  nl: ['NL'],
};

/**
 * The meetings' default language for the engines: the interface language, in the Mac's region
 * when the engines know that variant ("en-PT" → en-US, "de-AT" → de-AT).
 */
export function meetingLocale(uiLocale: string, format: string): string {
  if (uiLocale === 'pt-PT' || uiLocale === 'pt-BR') return uiLocale;
  const lang = uiLocale.split('-')[0];
  const regions = LOCALE_REGIONS[lang];
  if (!regions) return 'en-US';
  const region = format.split('-')[1]?.toUpperCase();
  return `${lang}-${region && regions.includes(region) ? region : regions[0]}`;
}

/** The meeting languages offered on the bar (the engines may support more). */
export const MEETING_LOCALES = ['pt-PT', 'pt-BR', 'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'nl-NL'];
