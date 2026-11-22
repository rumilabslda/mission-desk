import type { Meeting, MeetingListItem } from '../../shared/meeting';
import type { MeetingStore } from './store';

/**
 * The meetings a scope's assistant may read: its own space's, never another's. "All spaces" reads
 * only the meetings outside spaces (as with notes).
 */
export function meetingsHost(store: MeetingStore, scope: string): { meetings(): MeetingListItem[]; meeting(id: string): Meeting | null } {
  const own = scope === 'all' ? 'nospace' : scope;
  return {
    meetings: () => store.list(own),
    meeting: (id) => store.get(own, id),
  };
}
