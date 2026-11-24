import type { AssistantEngine } from './assistant-engines';
import type { EngineId, MeetingMode } from './meeting';
import type { ServiceId } from './types';
import { ACCOUNT_COLORS } from './ipc';
import { t } from './i18n';

/** What the first-run setup asks Mission Desk to create. */
export interface SetupApp {
  service: ServiceId;
  name: string;
  /** A website's address (custom apps only). */
  url?: string;
}

/** An assistant: its type ('off': none) and connection ('' = that type's built-in, else an added one's id). */
export interface SetupAssistant {
  engine: AssistantEngine;
  connection: string;
}

export interface SetupPlan {
  /** The assistant of every space set up here (and of the apps outside spaces), unless a space has its own. */
  engine: AssistantEngine;
  connection: string;
  /** Let each space's assistant read the apps created here. */
  assistantReads: boolean;
  /** `assistant`, `meetingMode`: this space's own choices (only when the setup asked space by space). */
  spaces: { name: string; apps: SetupApp[]; assistant?: SetupAssistant; meetingMode?: MeetingMode }[];
  /** Apps outside any space. */
  apps: SetupApp[];
  /** The user's name, when they gave one (see shared/user.ts). */
  userName?: string;
  /** Meetings, when the setup asked (macOS, and an app with calls): every new space's mode, the engine, insights. */
  meetings?: { mode: MeetingMode; engine: EngineId; insights: boolean };
}

/** Brand names (a website is named after its address, see siteName). */
export const SERVICE_NAMES: Record<Exclude<ServiceId, 'custom'>, string> = {
  google: 'Google',
  microsoft: 'Microsoft 365',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  zoom: 'Zoom',
  proton: 'Proton Mail',
  icloud: 'iCloud Mail',
  fastmail: 'Fastmail',
  notion: 'Notion',
};

/** The first-run setup shows once, on a Mission Desk with nothing in it yet. */
export function needsSetup(state: { accounts: unknown[]; onboarded?: boolean }): boolean {
  return state.accounts.length === 0 && state.onboarded !== true;
}

/** A website's short name from its address: "app.hubspot.com" → "Hubspot". */
export function siteName(url: string | undefined): string {
  try {
    const labels = new URL(url ?? '').hostname.split('.').filter((l) => !['www', 'app', 'web', 'my'].includes(l));
    const first = labels[0] ?? '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : t('setup.app.website');
  } catch {
    return t('setup.app.website');
  }
}

/** Short names for a space's apps ("Google", "Slack"); a second of a kind becomes "Google 2". */
export function appNames(apps: { service: ServiceId; url?: string }[]): string[] {
  const seen = new Map<string, number>();
  return apps.map((a) => {
    const base = a.service === 'custom' ? siteName(a.url) : SERVICE_NAMES[a.service];
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} ${n}`;
  });
}

/** What the setup screens collect before they hand Mission Desk a plan. */
export interface SetupDraft {
  /** The assistant for every space (its type and connection, see SetupAssistant). */
  engine: AssistantEngine;
  connection: string;
  /** Each space chooses its own assistant (a space without a choice keeps the one above). */
  perSpace: boolean;
  /** Let the assistant read the apps (asked with the assistant). */
  reads: boolean;
  /** No spaces: every app side by side. */
  together: boolean;
  spaces: { key: string; name: string; apps: DraftApp[]; assistant?: SetupAssistant; meetingMode?: MeetingMode }[];
  /** The name typed on the first screen. */
  userName?: string;
  /** The meetings step: one mode for every space (or each its own), the engine, insights. */
  meetings?: { mode: MeetingMode; perSpace: boolean; engine: EngineId; insights: boolean };
  /** The apps when everything stays together. */
  loose: DraftApp[];
}
export interface DraftApp {
  key: string;
  service: ServiceId;
  url?: string;
}

export type SetupStep = { kind: 'welcome' | 'assistant' | 'meetings' | 'spaces' | 'ready' } | { kind: 'apps'; space: number };

/**
 * The screens in order: one for the apps of each space (-1: all together), then the assistant, which
 * is chosen for the spaces and apps already there (and may be the hardest step: it comes last).
 */
export function setupSteps(d: Pick<SetupDraft, 'together' | 'spaces'> & Partial<Pick<SetupDraft, 'loose'>>, o: { meetings?: boolean } = {}): SetupStep[] {
  const apps: SetupStep[] = d.together ? [{ kind: 'apps', space: -1 }] : d.spaces.map((_, i) => ({ kind: 'apps', space: i }));
  // Meetings only where they're transcribed (macOS) and an app has calls.
  const meetings: SetupStep[] = o.meetings && hasMeetingApps({ loose: [], ...d }) ? [{ kind: 'meetings' }] : [];
  return [{ kind: 'welcome' }, { kind: 'spaces' }, ...apps, { kind: 'assistant' }, ...meetings, { kind: 'ready' }];
}

/** Whether any space (or the apps outside spaces) gets an assistant. */
export function assistantsInPlan(p: Pick<SetupPlan, 'engine' | 'spaces' | 'apps'>): boolean {
  const used = p.spaces.map((s) => (s.assistant ?? p).engine);
  if (p.apps.length > 0 || p.spaces.some((s) => !s.assistant)) used.push(p.engine);
  return used.some((e) => e !== 'off');
}

/** Apps with calls (Meet, Teams, Zoom), whose meetings the space's assistant can sum up. */
export function hasMeetingApps(d: Pick<SetupDraft, 'together' | 'spaces' | 'loose'>): boolean {
  const apps = d.together ? d.loose : d.spaces.flatMap((s) => s.apps);
  return apps.some((a) => a.service === 'google' || a.service === 'microsoft' || a.service === 'zoom');
}

const named = (apps: DraftApp[]): SetupApp[] => {
  const names = appNames(apps);
  return apps.map((a, i) => ({ service: a.service, name: names[i], ...(a.url ? { url: a.url } : {}) }));
};

/** The plan sent to Mission Desk: spaces without apps are left out. `meetings`: the setup showed that step. */
export function planOf(d: SetupDraft, o: { meetings?: boolean } = {}): SetupPlan {
  const meet = o.meetings && d.meetings ? d.meetings : null;
  const p: SetupPlan = {
    engine: d.engine,
    connection: d.engine === 'off' ? '' : d.connection,
    assistantReads: false,
    spaces: d.together
      ? []
      : d.spaces
          .filter((s) => s.apps.length > 0)
          .map((s) => ({
            name: s.name.trim(),
            apps: named(s.apps),
            ...(d.perSpace && s.assistant ? { assistant: s.assistant } : {}),
            ...(meet?.perSpace && s.meetingMode ? { meetingMode: s.meetingMode } : {}),
          })),
    apps: d.together ? named(d.loose) : [],
  };
  const name = d.userName?.replace(/\s+/g, ' ').trim();
  return {
    ...p,
    assistantReads: d.reads && assistantsInPlan(p),
    ...(name ? { userName: name } : {}),
    ...(meet ? { meetings: { mode: meet.mode, engine: meet.engine, insights: meet.insights } } : {}),
  };
}

/** Why a space name can't be added (null: it can); 'empty' says nothing to the user. */
export function spaceNameProblem(name: string, existing: string[]): string | null {
  const n = name.trim();
  if (!n) return 'empty';
  if (n.length > 40) return t('setup.spaces.tooLong', { max: 40 });
  const same = existing.find((e) => e.trim().toLowerCase() === n.toLowerCase());
  return same ? t('setup.spaces.taken', { name: same }) : null;
}

/** The id of the space already called `name` (any case), so a second run adds to it. */
export function existingSpace(name: string, spaces: { id: string; name: string }[]): string | null {
  const n = name.trim().toLowerCase();
  return spaces.find((s) => s.name.trim().toLowerCase() === n)?.id ?? null;
}

/** `name`, or "name 2", "name 3"… when it is already taken. */
export function uniqueName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  for (let i = 2; ; i++) if (!taken.includes(`${name} ${i}`)) return `${name} ${i}`;
}

/** An app's name before numbering ("Google", "Hubspot"). */
export function baseName(app: { service: ServiceId; url?: string }): string {
  return appNames([app])[0];
}

/**
 * The colour of each planned space: one the user already has keeps its own; new ones take the
 * next colours after the existing spaces (the setup's preview and Mission Desk use this same rule).
 */
export function spaceColours(names: string[], existing: { name: string; color?: string }[]): string[] {
  let next = existing.length;
  return names.map((name) => {
    const i = existing.findIndex((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (i >= 0) return existing[i].color ?? ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
    return ACCOUNT_COLORS[next++ % ACCOUNT_COLORS.length];
  });
}
