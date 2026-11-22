import { appNames, type SetupApp, type SetupPlan } from '../shared/setup';
import { isEngine } from '../shared/assistant-engines';
import { cleanSiteUrl } from '../shared/custom-site';
import type { NewAccountInput } from '../shared/ipc';
import { cleanSpaceName, type DragRef, type DropZone } from '../shared/spaces';
import type { Account, CalendarRange, EventDraft, Reply, SendUpdates, ServiceId, SidebarStyle, WriteScope } from '../shared/types';

const SERVICES: ServiceId[] = ['google', 'slack', 'whatsapp', 'microsoft', 'telegram', 'linkedin', 'discord', 'zoom', 'custom'];
const MAX_NAME = 60;

function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const name = v.trim();
  return name.length > 0 && name.length <= MAX_NAME ? name : null;
}

function cleanColor(v: unknown): string | null {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
}

function parseSpaceChoice(v: unknown): NewAccountInput['space'] | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const keys = Object.keys(v);
  const r = v as Record<string, unknown>;
  if (keys.length === 1 && typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 64) return { id: r.id };
  if (keys.length === 1 && 'newName' in r) {
    const name = cleanSpaceName(r.newName);
    return name ? { newName: name } : null;
  }
  return null;
}

export function parseNewAccount(input: unknown): NewAccountInput | null {
  if (typeof input !== 'object' || input === null) return null;
  const { service, name, color, space, url } = input as Record<string, unknown>;
  const n = cleanName(name);
  const c = cleanColor(color);
  if (!SERVICES.includes(service as ServiceId) || !n || !c) return null;
  const parsed: NewAccountInput = { service: service as ServiceId, name: n, color: c };
  if (service === 'custom') {
    const site = cleanSiteUrl(url);
    if (!site) return null;
    parsed.url = site;
  }
  if (space !== undefined && space !== null) {
    const choice = parseSpaceChoice(space);
    if (!choice) return null;
    parsed.space = choice;
  }
  return parsed;
}

export type AccountPatch = Partial<
  Pick<Account, 'name' | 'color' | 'muted' | 'hibernateWhenIdle' | 'iconMode' | 'iconSourceAccountId' | 'claudeAccess'>
>;

const ICON_MODES = ['auto', 'service', 'letter', 'account'] as const; // 'custom' is chosen in main (file picker)
const CLAUDE_ACCESS = ['off', 'read', 'act'] as const;

/** What the UI may change on an account (Edit dialog and Settings). Unknown keys are ignored. */
export function parseAccountPatch(input: unknown): AccountPatch | null {
  if (typeof input !== 'object' || input === null) return null;
  const raw = input as Record<string, unknown>;
  const patch: AccountPatch = {};
  if ('name' in raw) {
    const n = cleanName(raw.name);
    if (!n) return null;
    patch.name = n;
  }
  if ('color' in raw) {
    const c = cleanColor(raw.color);
    if (!c) return null;
    patch.color = c;
  }
  for (const key of ['muted', 'hibernateWhenIdle'] as const) {
    if (key in raw) {
      if (typeof raw[key] !== 'boolean') return null;
      patch[key] = raw[key] as boolean;
    }
  }
  if ('claudeAccess' in raw) {
    if (!CLAUDE_ACCESS.includes(raw.claudeAccess as never)) return null;
    patch.claudeAccess = raw.claudeAccess as Account['claudeAccess'];
  }
  if ('iconMode' in raw) {
    if (!ICON_MODES.includes(raw.iconMode as never)) return null;
    patch.iconMode = raw.iconMode as Account['iconMode'];
    if (raw.iconMode === 'account') {
      if (typeof raw.iconSourceAccountId !== 'string' || !raw.iconSourceAccountId) return null;
      patch.iconSourceAccountId = raw.iconSourceAccountId;
    }
  }
  if ('iconSourceAccountId' in raw && raw.iconMode !== 'account') return null;
  return patch;
}

export function parseWeekStart(v: unknown): 0 | 1 | 'auto' | null {
  return v === 'auto' || v === 0 || v === 1 ? v : null;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
const HOUR = 3_600_000;
const MAX_SPAN = 62 * 24 * HOUR;

/** A range the calendar UI may ask for: ISO instants, 1 hour to 62 days. */
export function parseCalendarRange(v: unknown): CalendarRange | null {
  if (typeof v !== 'object' || v === null) return null;
  const { start, end } = v as Record<string, unknown>;
  if (typeof start !== 'string' || typeof end !== 'string' || !ISO_INSTANT.test(start) || !ISO_INSTANT.test(end)) return null;
  const span = Date.parse(end) - Date.parse(start);
  if (!Number.isFinite(span) || span < HOUR || span > MAX_SPAN) return null;
  return { start, end };
}

export function parseDragRef(v: unknown): DragRef | null {
  if (typeof v !== 'object' || v === null) return null;
  const { kind, id } = v as Record<string, unknown>;
  if ((kind !== 'account' && kind !== 'space') || typeof id !== 'string' || id.length === 0 || id.length > 100) return null;
  return { kind, id };
}

export function parseDropZone(v: unknown): DropZone | null {
  return v === 'before' || v === 'after' || v === 'into' ? v : null;
}

export function parseSidebarStyle(v: unknown): SidebarStyle | null {
  return v === 'folders' || v === 'panel' || v === 'sections' ? v : null;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/;
const MAX_EVENT_SPAN = 366 * 24 * HOUR;

/** An event draft from the calendar editor. */
export function parseEventDraft(v: unknown): EventDraft | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Record<string, unknown>;
  const text = (x: unknown, max: number): string | null => (typeof x === 'string' && x.length <= max ? x : null);
  const calendarId = text(r.calendarId, 256);
  const title = text(r.title, 1024);
  const location = text(r.location, 1024);
  const description = text(r.description, 8192);
  if (!calendarId || title === null || location === null || description === null) return null;
  if (typeof r.allDay !== 'boolean' || typeof r.meet !== 'boolean') return null;
  if (typeof r.start !== 'string' || typeof r.end !== 'string') return null;
  const shape = r.allDay ? DATE_ONLY : ISO_INSTANT;
  if (!shape.test(r.start) || !shape.test(r.end)) return null;
  const span = Date.parse(r.allDay ? `${r.end}T00:00:00Z` : r.end) - Date.parse(r.allDay ? `${r.start}T00:00:00Z` : r.start);
  if (!Number.isFinite(span) || span <= 0 || span > MAX_EVENT_SPAN) return null;
  if (!Array.isArray(r.guests) || r.guests.length > 100) return null;
  const guests: string[] = [];
  for (const g of r.guests) {
    if (typeof g !== 'string') return null;
    const email = g.trim().toLowerCase();
    if (email.length > 254 || !EMAIL.test(email)) return null;
    if (!guests.includes(email)) guests.push(email);
  }
  return { calendarId, title: title.trim(), allDay: r.allDay, start: r.start, end: r.end, location: location.trim(), description, guests, meet: r.meet };
}

export const parseScope = (v: unknown): WriteScope | null => (v === 'this' || v === 'all' ? v : null);
export const parseReply = (v: unknown): Reply | null => (v === 'accepted' || v === 'declined' || v === 'tentative' ? v : null);
export const parseSendUpdates = (v: unknown): SendUpdates | null => (v === 'all' || v === 'none' ? v : null);

/** Times from a drag (move or resize). */
export function parseTimes(start: unknown, end: unknown, allDay: unknown): { start: string; end: string; allDay: boolean } | null {
  if (typeof start !== 'string' || typeof end !== 'string' || typeof allDay !== 'boolean') return null;
  const shape = allDay ? DATE_ONLY : ISO_INSTANT;
  if (!shape.test(start) || !shape.test(end)) return null;
  const span = Date.parse(allDay ? `${end}T00:00:00Z` : end) - Date.parse(allDay ? `${start}T00:00:00Z` : start);
  if (!Number.isFinite(span) || span <= 0 || span > MAX_EVENT_SPAN) return null;
  return { start, end, allDay };
}

/** A Google id (calendar or event) from the UI. */
export const isGoogleId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 1024 && !/^\.+$/.test(v); // '.'/'..' would leave the path

/** A to-do's client tag: undefined = not given, null = remove it, false = invalid. */
export function parseTodoTag(v: unknown): { kind: 'space' | 'account'; id: string } | null | undefined | false {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'object') return false;
  const { kind, id } = v as Record<string, unknown>;
  if ((kind !== 'space' && kind !== 'account') || typeof id !== 'string' || !id || id.length > 64) return false;
  return { kind, id };
}

/** An unread count a service page reports (untrusted). */
export function parseUnreadCount(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000_000 ? v : null;
}

const MAX_SETUP_SPACES = 20;
const MAX_SETUP_APPS = 240; // 20 spaces of 12: what the setup screens allow

/** The first-run setup's plan (untrusted: from the UI). Spaces without apps are dropped. */
export function parseSetupPlan(v: unknown): SetupPlan | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  if (!isEngine(p.engine) || !Array.isArray(p.spaces) || !Array.isArray(p.apps)) return null;
  if (p.spaces.length > MAX_SETUP_SPACES) return null;
  const apps = (list: unknown): SetupApp[] | null => {
    if (!Array.isArray(list) || list.length > 12) return null;
    const raw: { service: ServiceId; url?: string }[] = [];
    for (const a of list) {
      const x = a as Record<string, unknown>;
      if (typeof x !== 'object' || x === null || !SERVICES.includes(x.service as ServiceId)) return null;
      if (x.service === 'custom') {
        const url = cleanSiteUrl(x.url);
        if (!url) return null;
        raw.push({ service: 'custom', url });
      } else raw.push({ service: x.service as ServiceId });
    }
    const names = appNames(raw);
    return raw.map((a, i) => ({ ...a, name: names[i] }));
  };
  const spaces: SetupPlan['spaces'] = [];
  for (const s of p.spaces) {
    const x = s as Record<string, unknown>;
    const name = cleanSpaceName(x?.name);
    const list = apps(x?.apps);
    if (!name || !list) return null;
    if (list.length) spaces.push({ name, apps: list }); // a space holds apps
  }
  const loose = apps(p.apps);
  if (!loose) return null;
  if (spaces.reduce((n, s) => n + s.apps.length, loose.length) > MAX_SETUP_APPS) return null;
  return { engine: p.engine, assistantReads: p.assistantReads === true, spaces, apps: loose };
}
