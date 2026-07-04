import { JST_OFFSET, JST_OFFSET_MINUTES } from "./constants";

export function nowJst() {
  const shifted = new Date(Date.now() + JST_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().replace("Z", JST_OFFSET);
}
