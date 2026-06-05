/**
 * A booking's time selection: a single contiguous run of 30-minute blocks
 * (docs spec → "Regra de Consecutividade"), expressed as inclusive indices into
 * the day's ordered block list. The selection gestures live in the TimeStep UI;
 * the run can never cross a busy/pending/off block.
 */

import type { SlotState } from "@/lib/types";

export interface SlotRun {
  lo: number;
  hi: number;
}

/**
 * Pure click-to-select gesture shared by the public TimeStep picker and the
 * admin's edit grid, so they behave identically:
 *  - nothing selected → clicking a block starts a 1-block run;
 *  - clicking a block outside the run extends towards it, but only if every
 *    block in the gap is free (can't jump over busy/pending/off blocks);
 *  - clicking the run's end block trims that end (single block → clears, null);
 *  - clicking an interior block trims the smaller side to that block.
 *
 * Returns the next run, `null` to clear, or the *same* `run` reference when the
 * click is a no-op (e.g. the gap isn't all free) so callers can skip updates.
 */
export function nextRun(
  i: number,
  run: SlotRun | null,
  cells: readonly { state: SlotState }[],
): SlotRun | null {
  if (!run) return { lo: i, hi: i };
  const { lo, hi } = run;

  if (i >= lo && i <= hi) {
    if (lo === hi) return null;
    if (i === lo) return { lo: lo + 1, hi };
    if (i === hi) return { lo, hi: hi - 1 };
    const distToLo = i - lo;
    const distToHi = hi - i;
    return distToHi <= distToLo ? { lo, hi: i } : { lo: i, hi };
  }

  const [gapStart, gapEnd] = i < lo ? [i, lo - 1] : [hi + 1, i];
  const gapAllFree = cells.slice(gapStart, gapEnd + 1).every((c) => c.state === "free");
  if (!gapAllFree) return run;
  return i < lo ? { lo: i, hi } : { lo, hi: i };
}
