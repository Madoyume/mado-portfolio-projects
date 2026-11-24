export function moveTo(ids: string[], id: string, index: number) {
  const rest = ids.filter((item) => item !== id);
  if (rest.length === ids.length) return ids;
  return [...rest.slice(0, index), id, ...rest.slice(index)];
}

export function moveToEdge(
  ids: string[],
  selected: string[],
  edge: "start" | "end",
) {
  const block = ids.filter((id) => selected.includes(id));
  const rest = ids.filter((id) => !selected.includes(id));
  return edge === "start" ? [...block, ...rest] : [...rest, ...block];
}

export function shiftSelected(
  ids: string[],
  selected: string[],
  direction: "backward" | "forward",
) {
  const next = direction === "backward" ? [...ids] : ids.toReversed();
  for (let i = 1; i < next.length; i++) {
    if (selected.includes(next[i]) && !selected.includes(next[i - 1])) {
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
    }
  }
  return direction === "backward" ? next : next.reverse();
}

export function isSameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
