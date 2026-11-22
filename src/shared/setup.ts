import type { AssistantEngine } from './assistant-engines';
import type { ServiceId } from './types';
import { ACCOUNT_COLORS } from './ipc';

/** What the first-run setup asks Mission Desk to create. */
export interface SetupApp {
  service: ServiceId;
  name: string;
  /** A website's address (custom apps only). */
  url?: string;
}

export interface SetupPlan {
  /** The assistant every space uses ('off': none). */
  engine: AssistantEngine;
  /** Let the assistant read the apps created here. */
  assistantReads: boolean;
  spaces: { name: string; apps: SetupApp[] }[];
  /** Apps outside any space. */
  apps: SetupApp[];
}

export const SERVICE_NAMES: Record<ServiceId, string> = {
  google: 'Google',
  microsoft: 'Microsoft 365',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  zoom: 'Zoom',
  custom: 'Website',
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
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Website';
  } catch {
    return 'Website';
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
  engine: AssistantEngine;
  /** Let the assistant read the apps (asked on the last step). */
  reads: boolean;
  /** No spaces: every app side by side. */
  together: boolean;
  spaces: { key: string; name: string; apps: DraftApp[] }[];
  /** The apps when everything stays together. */
  loose: DraftApp[];
}
export interface DraftApp {
  key: string;
  service: ServiceId;
  url?: string;
}

export type SetupStep = { kind: 'welcome' | 'assistant' | 'spaces' | 'ready' } | { kind: 'apps'; space: number };

/** The screens in order: one for the apps of each space (-1: all together). */
export function setupSteps(d: Pick<SetupDraft, 'together' | 'spaces'>): SetupStep[] {
  const apps: SetupStep[] = d.together ? [{ kind: 'apps', space: -1 }] : d.spaces.map((_, i) => ({ kind: 'apps', space: i }));
  return [{ kind: 'welcome' }, { kind: 'assistant' }, { kind: 'spaces' }, ...apps, { kind: 'ready' }];
}

const named = (apps: DraftApp[]): SetupApp[] => {
  const names = appNames(apps);
  return apps.map((a, i) => ({ service: a.service, name: names[i], ...(a.url ? { url: a.url } : {}) }));
};

/** The plan sent to Mission Desk: spaces without apps are left out. */
export function planOf(d: SetupDraft): SetupPlan {
  return {
    engine: d.engine,
    assistantReads: d.engine !== 'off' && d.reads,
    spaces: d.together ? [] : d.spaces.filter((s) => s.apps.length > 0).map((s) => ({ name: s.name.trim(), apps: named(s.apps) })),
    apps: d.together ? named(d.loose) : [],
  };
}

/** Why a space name can't be added (null: it can); 'empty' says nothing to the user. */
export function spaceNameProblem(name: string, existing: string[]): string | null {
  const n = name.trim();
  if (!n) return 'empty';
  if (n.length > 40) return 'Keep it under 40 characters.';
  const same = existing.find((e) => e.trim().toLowerCase() === n.toLowerCase());
  return same ? `${same} is already there.` : null;
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
