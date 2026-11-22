import type { Todo } from '../../../shared/types';

/** Open to-dos: the user's own, and what others owe them ("Waiting on", from meetings). */
export function splitWaiting<T extends Pick<Todo, 'waitingOn'>>(todos: T[]): { mine: T[]; waiting: T[] } {
  return { mine: todos.filter((x) => !x.waitingOn), waiting: todos.filter((x) => !!x.waitingOn) };
}
