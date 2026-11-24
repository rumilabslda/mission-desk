import type { MemoryNote } from '../../../shared/assistant';
import { t } from '../../../shared/i18n';
import type { Meeting } from '../../../shared/meeting';
import type { Message } from '../../../shared/messages';
import type { Todo } from '../../../shared/types';
import { messagesInScope, todosInScope } from '../../assistant/scope-data';
import type { SourceItem } from './retrieve';

const MAX_TEXT = 300;
const MAX_MESSAGES = 200;

/** One line, at most 300 characters. */
const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);

export interface SourcesInput {
  /** The live meeting's scope: nothing from any other is ever read. */
  scope: string;
  liveId: string;
  /** Every scope's notes (memory.all()). */
  notes: Record<string, MemoryNote[]>;
  /** Candidate meetings; only the scope's ended ones with a summary count. */
  meetings: Meeting[];
  todos: Todo[];
  feed: Message[];
  accounts: { id: string; name: string; spaceId?: string; claudeAccess?: 'off' | 'read' | 'act' }[];
  /** "12/11", in the interface language. */
  dateLabel(iso: string): string;
}

/**
 * The space's knowledge as items a live insight can cite: its memory, the summaries of its past
 * meetings, its open to-dos and waiting on, and recent messages from its apps shared with the
 * assistant. Earlier insights are never sources: they are readings, not facts.
 */
export function buildSources(input: SourcesInput): SourceItem[] {
  const { scope } = input;
  const out: SourceItem[] = [];
  const counters: Record<string, number> = {};
  const id = (prefix: string): string => `${prefix}${(counters[prefix] = (counters[prefix] ?? 0) + 1)}`;

  for (const n of input.notes[scope] ?? []) {
    out.push({ id: id('n'), kind: 'memory', text: oneLine(n.text), date: n.createdAt, label: t('meetings.insights.source.memory'), open: { kind: 'memory', scope } });
  }

  const past = input.meetings.filter((m) => m.scope === scope && m.id !== input.liveId && m.result?.summary);
  for (const m of past) {
    const s = m.result!.summary!;
    const date = input.dateLabel(m.startedAt);
    const parts: [string[], 'decision' | 'point' | 'nextStep'][] = [
      [s.decisions, 'decision'],
      [s.points, 'point'],
      [s.nextSteps, 'nextStep'],
    ];
    for (const [list, kind] of parts) {
      for (const text of list) {
        out.push({ id: id('d'), kind: 'meeting', text: oneLine(text), date: m.startedAt, label: t(`meetings.insights.source.${kind}`, { date }), open: { kind: 'meeting', scope, id: m.id } });
      }
    }
  }

  for (const todo of todosInScope(input.todos, input.accounts, scope)) {
    if (todo.done) continue;
    if (todo.waitingOn) {
      out.push({ id: id('w'), kind: 'waiting', text: oneLine(todo.text), date: todo.createdAt, label: t('meetings.insights.source.waiting', { who: todo.waitingOn }), open: { kind: 'home' } });
    } else {
      out.push({ id: id('t'), kind: 'todo', text: oneLine(todo.text), date: todo.createdAt, label: t('meetings.insights.source.todo'), open: { kind: 'home' } });
    }
  }

  for (const { message: m, account: a } of messagesInScope(input.feed, input.accounts, scope).slice(0, MAX_MESSAGES)) {
    const label = `${a.name} · ${m.title}`;
    out.push({ id: id('x'), kind: 'message', text: oneLine(`${label}: ${m.body}`), date: new Date(m.at).toISOString(), label: oneLine(label), open: { kind: 'message', key: m.key } });
  }
  return out;
}
