/** Moves `id` one place up (-1) or down (+1); unchanged at the ends. */
export function moveBy(ids: string[], id: string, delta: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const out = [...ids];
  [out[from], out[to]] = [out[to], out[from]];
  return out;
}
