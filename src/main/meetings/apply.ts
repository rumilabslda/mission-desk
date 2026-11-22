import type { FollowUpResult, Meeting, MeetingAction } from '../../shared/meeting';
import type { Todo } from '../../shared/types';

/**
 * Applies the harmless parts of a follow-up: the user's to-dos and the "Waiting on" items go to the
 * meeting's space, linked to the meeting. The summary, e-mail draft, memory notes and event stay in
 * the result for the user to open or confirm. Returns the actions that have a result.
 */
export function applyFollowUp(
  r: FollowUpResult,
  m: Meeting,
  deps: { addTodo(text: string, tag: Todo['tag'] | undefined, extra: { meetingId: string; waitingOn?: string }): unknown; tagFor(scope: string): Todo['tag'] | undefined },
): MeetingAction[] {
  const tag = deps.tagFor(m.scope);
  for (const text of r.myTodos ?? []) deps.addTodo(text, tag, { meetingId: m.id });
  for (const w of r.waitingOn ?? []) deps.addTodo(w.what, tag, { meetingId: m.id, waitingOn: w.who });
  const applied: MeetingAction[] = [];
  if (r.summary) applied.push('summary');
  if (r.myTodos) applied.push('myTodos');
  if (r.waitingOn) applied.push('waitingOn');
  if (r.email) applied.push('email');
  if (r.memoryNotes) applied.push('memory');
  if (r.followUpEvent) applied.push('event');
  return applied;
}
