/** Moves `dragged` to the position of `target` in `ids`. */
export function moveId(ids: string[], dragged: string, target: string): string[] {
  const without = ids.filter((id) => id !== dragged);
  const at = without.indexOf(target);
  if (at < 0) return ids;
  const draggedFrom = ids.indexOf(dragged);
  const targetFrom = ids.indexOf(target);
  without.splice(draggedFrom < targetFrom ? at + 1 : at, 0, dragged);
  return without;
}
