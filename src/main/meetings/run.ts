import { DEFAULT_ACTIONS, type Meeting, type MeetingAction } from '../../shared/meeting';
import type { Todo } from '../../shared/types';
import { applyFollowUp } from './apply';
import { runFollowUp } from './followup';
import type { Ask } from './one-shot';
import type { MeetingStore } from './store';

/**
 * Runs a meeting's chosen actions through its space's assistant: one request (no tools), the
 * validated result stored, the to-dos applied. Only a meeting found in `scope` is ever run.
 */
export function createMeetingRunner(deps: {
  store: MeetingStore;
  askFor(scope: string): Ask | null;
  /** The space's memory notes. */
  notes(scope: string): string[];
  guests(m: Meeting): Promise<string[]>;
  myName(): string;
  addTodo(text: string, tag: Todo['tag'] | undefined, extra: { meetingId: string; waitingOn?: string }): void;
  tagFor(scope: string): Todo['tag'] | undefined;
  /** Remembers the ticks for the space's next meeting. */
  saveActions(scope: string, actions: MeetingAction[]): void;
  progress(m: Meeting, state: 'busy' | 'done' | 'error', message?: string): void;
  push(): void;
}) {
  const running = new Map<string, AbortController>();
  const failed = new Map<string, string>();

  return {
    async run(scope: string, id: string, actions: MeetingAction[]): Promise<void> {
      const m = deps.store.get(scope, id);
      const ask = deps.askFor(scope);
      if (!m || !ask || running.has(id) || actions.length === 0) return;
      const ac = new AbortController();
      running.set(id, ac);
      failed.delete(id);
      deps.saveActions(scope, actions);
      deps.store.update(scope, id, { actions });
      deps.progress(m, 'busy');
      deps.push();
      try {
        const result = await runFollowUp(ask, m, { guests: await deps.guests(m), notes: deps.notes(scope), actions, myName: deps.myName() }, ac.signal);
        const now = deps.store.get(scope, id);
        if (!now) return; // deleted meanwhile
        const applied = applyFollowUp(result, now, { addTodo: deps.addTodo, tagFor: deps.tagFor });
        deps.store.update(scope, id, { result: { ...(now.result ?? {}), ...result }, applied: [...new Set([...(now.applied ?? []), ...applied])] });
        deps.progress(now, 'done');
      } catch (e) {
        failed.set(id, (e as Error).message);
        deps.progress(m, 'error', (e as Error).message);
      } finally {
        running.delete(id);
        deps.push();
      }
    },
    state: (id: string): 'running' | 'failed' | undefined => (running.has(id) ? 'running' : failed.has(id) ? 'failed' : undefined),
    error: (id: string): string | undefined => failed.get(id),
    cancel(id: string): void {
      running.get(id)?.abort();
    },
    defaults: (saved: MeetingAction[] | undefined): MeetingAction[] => saved ?? DEFAULT_ACTIONS,
  };
}
export type MeetingRunner = ReturnType<typeof createMeetingRunner>;
