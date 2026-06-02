/**
 * 30-minute block arithmetic. Time is block-based and never free-typed
 * (docs/specification.md → Seleção de Horários). All helpers work on
 * "HH:MM" strings and integer minute offsets from midnight.
 */

export const BLOCK_MINUTES = 30;

/** Parse "HH:MM" → minutes from midnight. "24:00" → 1440 (end-of-day). */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutes from midnight → "HH:MM" (1440 → "24:00"). */
export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Round a minute value down to its block boundary. */
export function floorToBlock(minutes: number): number {
  return Math.floor(minutes / BLOCK_MINUTES) * BLOCK_MINUTES;
}

/**
 * Build the ordered list of block start-times for a given operating window.
 * closeTime "00:00" is treated as midnight (1440). A block is included only
 * if it fits entirely before close.
 */
export function blockStarts(openTime: string, closeTime: string): string[] {
  const start = toMinutes(openTime);
  const endRaw = toMinutes(closeTime);
  const end = endRaw === 0 ? 1440 : endRaw; // 00:00 close === midnight
  const out: string[] = [];
  for (let m = start; m + BLOCK_MINUTES <= end; m += BLOCK_MINUTES) {
    out.push(toTime(m));
  }
  return out;
}

/** End time of the block that starts at `start`. */
export function blockEnd(start: string): string {
  return toTime(toMinutes(start) + BLOCK_MINUTES);
}

/** Number of 30-min blocks spanned by [start, end). */
export function blockCount(start: string, end: string): number {
  return (toMinutes(end) - toMinutes(start)) / BLOCK_MINUTES;
}

/** Do [aStart,aEnd) and [bStart,bEnd) overlap? Half-open intervals. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** Format a [start,end) range for display, e.g. "18:00 – 19:30". */
export function formatRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** Are these two block starts contiguous (b immediately follows a)? */
export function isContiguous(a: string, b: string): boolean {
  return toMinutes(b) - toMinutes(a) === BLOCK_MINUTES;
}
