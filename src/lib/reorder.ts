/** Moves one id a step up or down in an ordered list (returns a new list; unchanged at the ends). */
export function moveId<T>(ids: readonly T[], id: T, dir: "up" | "down"): T[] {
  const out = [...ids];
  const from = out.indexOf(id);
  if (from < 0) return out;
  const to = dir === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= out.length) return out;
  [out[from], out[to]] = [out[to], out[from]];
  return out;
}
