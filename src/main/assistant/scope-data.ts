import type { Message } from '../../shared/messages';
import type { Todo } from '../../shared/types';

/**
 * What one assistant scope may see of Home's data. A space's assistant sees only that space:
 * never another space's messages, to-dos or notes (clients under NDA must not cross).
 */

type Acct = { id: string; name: string; spaceId?: string; claudeAccess?: 'off' | 'read' | 'act' };

/** The account belongs to the scope ('all' sees every space). */
export function accountInScope(a: { spaceId?: string }, scope: string): boolean {
  if (scope === 'all') return true;
  if (scope === 'nospace') return !a.spaceId;
  return scope.startsWith('space:') && a.spaceId === scope.slice(6);
}

/** Home's messages from accounts in the scope that are shared with the assistant, newest first. */
export function messagesInScope(feed: Message[], accounts: Acct[], scope: string): { message: Message; account: Acct }[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const out: { message: Message; account: Acct }[] = [];
  for (const m of feed) {
    const a = byId.get(m.accountId);
    if (!a || (a.claudeAccess ?? 'off') === 'off' || !accountInScope(a, scope)) continue;
    out.push({ message: m, account: a });
  }
  return out.sort((x, y) => y.message.at - x.message.at);
}

/**
 * The to-dos of the scope: a space's are those tagged with it or with one of its accounts.
 * Untagged to-dos belong to no space: only "No space" and "All spaces" see them.
 */
export function todosInScope(todos: Todo[], accounts: { id: string; spaceId?: string }[], scope: string): Todo[] {
  if (scope === 'all') return todos;
  const byId = new Map(accounts.map((a) => [a.id, a]));
  return todos.filter((t) => {
    if (!t.tag) return scope === 'nospace';
    if (t.tag.kind === 'space') return scope === `space:${t.tag.id}`;
    const a = byId.get(t.tag.id);
    return !!a && accountInScope(a, scope);
  });
}

/** The tag a to-do the assistant adds gets: always its own space, so it shows there. */
export function todoTagFor(scope: string): Todo['tag'] | undefined {
  return scope.startsWith('space:') ? { kind: 'space', id: scope.slice(6) } : undefined;
}
