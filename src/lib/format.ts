import { TIMEZONE } from "./constants";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = dateFormat.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

export function formatMonth(ym?: string | null) {
  if (!ym) return "";
  return ym.replace("-", ".");
}

export function currentYear() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
  }).format(new Date());
}
