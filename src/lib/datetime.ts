import { JST_OFFSET, JST_OFFSET_MINUTES } from "./constants";

export function jstMinutesAgo(minutes: number) {
  const shifted = new Date(
    Date.now() + (JST_OFFSET_MINUTES - minutes) * 60 * 1000,
  );
  return shifted.toISOString().replace("Z", JST_OFFSET);
}

export function nowJst() {
  return jstMinutesAgo(0);
}
