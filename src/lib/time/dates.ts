/**
 * Date helpers in the venue's local calendar. We deliberately work with
 * "YYYY-MM-DD" strings to avoid timezone drift between server (UTC on Vercel)
 * and the Portuguese venue. Display formatting uses the pt-PT locale.
 */

/** Local "YYYY-MM-DD" for a Date (not UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's local ISO date. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse "YYYY-MM-DD" → local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

const LONG = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const SHORT_WEEKDAY = new Intl.DateTimeFormat("pt-PT", { weekday: "short" });
const DAY_MONTH = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit" });

/** e.g. "terça-feira, 3 de junho". */
export function formatLongDate(iso: string): string {
  return LONG.format(fromISODate(iso));
}

/** e.g. "ter." */
export function formatShortWeekday(iso: string): string {
  return SHORT_WEEKDAY.format(fromISODate(iso)).replace(".", "");
}

/** e.g. "03/06". */
export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(fromISODate(iso));
}

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;
