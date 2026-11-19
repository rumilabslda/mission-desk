import type { Account, SidebarStyle, Space, UnreadCount } from './types';

/**
 * Spaces group accounts in the sidebar. The accounts list stays the single
 * order: a space's members are always contiguous in it and the space sits
 * where its first member is. Every function here returns a normalised list.
 */
export interface Member {
  id: string;
  spaceId?: string;
}

export type SidebarItem<T extends Member> = { kind: 'account'; account: T } | { kind: 'space'; space: Space; accounts: T[] };
export interface DragRef {
  kind: 'account' | 'space';
  id: string;
}
export type DropZone = 'before' | 'after' | 'into';

const MAX_NAME = 40;

/**
 * Where a drag lands, from the pointer's height within the target (0 = top, 1 = bottom).
 * An account: top/bottom quarter = before/after, middle = into. A space is only placed before/after.
 */
export function dropZoneFor(drag: DragRef['kind'], _target: DragRef['kind'], y: number): DropZone {
  if (drag === 'space') return y < 0.5 ? 'before' : 'after';
  return y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'into';
}

function withSpace<T extends Member>(a: T, spaceId: string | null): T {
  if (spaceId) return { ...a, spaceId };
  const { spaceId: _drop, ...rest } = a;
  return rest as T;
}

/** Clears unknown space ids, drops empty spaces, and pulls members together at their first member. */
export function normalizeSpaces<T extends Member>(accounts: T[], spaces: Space[]): { accounts: T[]; spaces: Space[] } {
  const known = new Set(spaces.map((s) => s.id));
  const clean = accounts.map((a) => (a.spaceId && !known.has(a.spaceId) ? withSpace(a, null) : a));
  const out: T[] = [];
  const placed = new Set<string>();
  for (const a of clean) {
    if (!a.spaceId) out.push(a);
    else if (!placed.has(a.spaceId)) {
      placed.add(a.spaceId);
      out.push(...clean.filter((m) => m.spaceId === a.spaceId));
    }
  }
  return { accounts: out, spaces: spaces.filter((s) => placed.has(s.id)) };
}

export function sidebarItems<T extends Member>(accounts: T[], spaces: Space[]): SidebarItem<T>[] {
  const byId = new Map(spaces.map((s) => [s.id, s]));
  const items: SidebarItem<T>[] = [];
  for (const a of accounts) {
    const space = a.spaceId ? byId.get(a.spaceId) : undefined;
    if (!space) items.push({ kind: 'account', account: a });
    else {
      const last = items[items.length - 1];
      if (last?.kind === 'space' && last.space.id === space.id) last.accounts.push(a);
      else items.push({ kind: 'space', space, accounts: [a] });
    }
  }
  return items;
}

/** Puts `memberIds` (in that order) into `spaceId`, as a block where the first of them was. */
export function groupInto<T extends Member>(accounts: T[], memberIds: string[], spaceId: string): T[] {
  const ids = memberIds.filter((id, i) => memberIds.indexOf(id) === i && accounts.some((a) => a.id === id));
  if (ids.length === 0) return accounts;
  const members = new Set(ids);
  const firstAt = accounts.findIndex((a) => a.id === ids[0]);
  const insertAt = accounts.slice(0, firstAt).filter((a) => !members.has(a.id)).length;
  const rest = accounts.filter((a) => !members.has(a.id));
  const block = ids.map((id) => withSpace(accounts.find((a) => a.id === id)!, spaceId));
  rest.splice(insertAt, 0, ...block);
  return rest;
}

/** Inserts `movedId` before/after `anchorId`, in `spaceId` (or loose). */
function placeNear<T extends Member>(accounts: T[], movedId: string, anchorId: string, where: 'before' | 'after', spaceId: string | null): T[] {
  const moved = accounts.find((a) => a.id === movedId);
  if (!moved || movedId === anchorId) return accounts;
  const rest = accounts.filter((a) => a.id !== movedId);
  const at = rest.findIndex((a) => a.id === anchorId);
  if (at < 0) return accounts;
  rest.splice(where === 'before' ? at : at + 1, 0, withSpace(moved, spaceId));
  return rest;
}

const members = <T extends Member>(accounts: T[], spaceId: string): T[] => accounts.filter((a) => a.spaceId === spaceId);

/** Into a space: after its last member. To none: loose, right after its old space. */
export function assignSpace<T extends Member>(accounts: T[], spaces: Space[], accountId: string, spaceId: string | null): T[] {
  const list = normalizeSpaces(accounts, spaces).accounts;
  const a = list.find((x) => x.id === accountId);
  if (!a) return list;
  if (spaceId) {
    if (!spaces.some((s) => s.id === spaceId) || a.spaceId === spaceId) return list;
    const block = members(list, spaceId).filter((m) => m.id !== accountId);
    if (block.length === 0) return list.map((x) => (x.id === accountId ? withSpace(x, spaceId) : x));
    return normalizeSpaces(placeNear(list, accountId, block[block.length - 1].id, 'after', spaceId), spaces).accounts;
  }
  if (!a.spaceId) return list;
  const block = members(list, a.spaceId).filter((m) => m.id !== accountId);
  const moved = block.length ? placeNear(list, accountId, block[block.length - 1].id, 'after', null) : list.map((x) => (x.id === accountId ? withSpace(x, null) : x));
  return normalizeSpaces(moved, spaces).accounts;
}

interface Block<T> {
  key: string;
  items: T[];
}
function blocksOf<T extends Member>(accounts: T[]): Block<T>[] {
  const out: Block<T>[] = [];
  for (const a of accounts) {
    const key = a.spaceId ? `space:${a.spaceId}` : `account:${a.id}`;
    const last = out[out.length - 1];
    if (last && last.key === key && a.spaceId) last.items.push(a);
    else out.push({ key, items: [a] });
  }
  return out;
}
const flatten = <T>(blocks: Block<T>[]): T[] => blocks.flatMap((b) => b.items);

/** The result of dropping `drag` on `target`; `create` asks the UI to name a new space. */
export function applyDrop<T extends Member>(
  accounts: T[],
  spaces: Space[],
  drag: DragRef,
  target: DragRef,
  zone: DropZone,
): { accounts: T[] } | { create: [string, string] } | null {
  const norm = normalizeSpaces(accounts, spaces);
  const list = norm.accounts;
  const known = new Set(norm.spaces.map((s) => s.id));
  const find = (id: string) => list.find((a) => a.id === id);
  const done = (next: T[]) => ({ accounts: normalizeSpaces(next, spaces).accounts });

  if (drag.kind === 'account') {
    const d = find(drag.id);
    if (!d) return null;
    if (target.kind === 'account') {
      const t = find(target.id);
      if (!t || t.id === d.id) return null;
      if (zone === 'into') return t.spaceId ? done(placeNear(list, d.id, t.id, 'after', t.spaceId)) : { create: [t.id, d.id] };
      return done(placeNear(list, d.id, t.id, zone, t.spaceId ?? null));
    }
    if (!known.has(target.id)) return null;
    if (zone === 'into') return d.spaceId === target.id ? null : done(assignSpace(list, spaces, d.id, target.id));
    const block = members(list, target.id).filter((m) => m.id !== d.id);
    if (block.length === 0) return null;
    const anchor = zone === 'before' ? block[0] : block[block.length - 1];
    return done(placeNear(list, d.id, anchor.id, zone, null));
  }

  if (!known.has(drag.id)) return null;
  let targetKey: string;
  if (target.kind === 'account') {
    const t = find(target.id);
    if (!t || t.spaceId === drag.id) return null;
    targetKey = t.spaceId ? `space:${t.spaceId}` : `account:${t.id}`;
  } else {
    if (target.id === drag.id || !known.has(target.id)) return null;
    targetKey = `space:${target.id}`;
  }
  const blocks = blocksOf(list);
  const dragKey = `space:${drag.id}`;
  const moving = blocks.find((b) => b.key === dragKey);
  if (!moving) return null;
  const rest = blocks.filter((b) => b.key !== dragKey);
  const at = rest.findIndex((b) => b.key === targetKey);
  if (at < 0) return null;
  rest.splice(zone === 'before' ? at : at + 1, 0, moving);
  return done(flatten(rest));
}

/** Move Up/Down: inside a space among its members; a loose account among the top-level items. */
export function moveWithinContainer<T extends Member>(accounts: T[], spaces: Space[], accountId: string, delta: -1 | 1): T[] {
  const list = normalizeSpaces(accounts, spaces).accounts;
  const i = list.findIndex((a) => a.id === accountId);
  if (i < 0) return list;
  const a = list[i];
  if (a.spaceId) {
    const j = i + delta;
    if (j < 0 || j >= list.length || list[j].spaceId !== a.spaceId) return list;
    const out = [...list];
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  }
  const blocks = blocksOf(list);
  const b = blocks.findIndex((x) => x.key === `account:${accountId}`);
  const c = b + delta;
  if (c < 0 || c >= blocks.length) return list;
  [blocks[b], blocks[c]] = [blocks[c], blocks[b]];
  return flatten(blocks);
}

export function ungroupSpace<T extends Member>(accounts: T[], spaceId: string): T[] {
  return accounts.map((a) => (a.spaceId === spaceId ? withSpace(a, null) : a));
}

/** A closed space's badge: the sum of its accounts' counts, leaving out muted ones. */
export function spaceUnread(list: { unread: UnreadCount; muted: boolean }[]): UnreadCount {
  const live = list.filter((m) => !m.muted);
  const sum = live.reduce<number>((n, m) => (typeof m.unread === 'number' ? n + m.unread : n), 0);
  if (sum > 0) return sum;
  return live.some((m) => m.unread === 'dot') ? 'dot' : 0;
}

export function cleanSpaceName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const name = v.trim();
  return name.length > 0 && name.length <= MAX_NAME ? name : null;
}

/** The sidebar style in use: Sections unless the user chose another. */
export function sidebarStyleOf(style: SidebarStyle | undefined): SidebarStyle {
  return style ?? 'sections';
}

/**
 * The Google account a meeting link is made with: a Google account itself, else its space's
 * Google sign-in account (or the space's first Google account, in sidebar order).
 */
export function googleAccountFor(
  accounts: Pick<Account, 'id' | 'service' | 'spaceId'>[],
  spaces: Pick<Space, 'id' | 'googleAccountId'>[],
  from: { accountId: string } | { spaceId: string },
): string | null {
  let spaceId: string | undefined;
  if ('accountId' in from) {
    const a = accounts.find((x) => x.id === from.accountId);
    if (!a) return null;
    if (a.service === 'google') return a.id;
    spaceId = a.spaceId;
  } else spaceId = from.spaceId;
  if (!spaceId) return null;
  const google = accounts.filter((x) => x.spaceId === spaceId && x.service === 'google');
  const preferred = spaces.find((sp) => sp.id === spaceId)?.googleAccountId;
  return (google.find((g) => g.id === preferred) ?? google[0])?.id ?? null;
}

export interface ActionContext {
  /** What the quick actions act for: the space's name, or the loose account's. */
  label: string | null;
  /** The Google account a Meet link or a new event uses. */
  googleId: string | null;
  /** The tag a new to-do gets. */
  todoTag: { kind: 'space' | 'account'; id: string } | null;
}

/** The quick actions (sidebar ⚡) act for the active account's space, or the account itself when loose. */
export function actionContext(
  accounts: Pick<Account, 'id' | 'name' | 'service' | 'spaceId'>[],
  spaces: Pick<Space, 'id' | 'name' | 'googleAccountId'>[],
  activeId: string | null,
): ActionContext {
  const a = activeId ? accounts.find((x) => x.id === activeId) : undefined;
  if (!a) return { label: null, googleId: null, todoTag: null };
  const space = a.spaceId ? spaces.find((s) => s.id === a.spaceId) : undefined;
  return {
    label: space ? space.name : a.name,
    googleId: googleAccountFor(accounts, spaces, { accountId: a.id }),
    todoTag: space ? { kind: 'space', id: space.id } : { kind: 'account', id: a.id },
  };
}
