/**
 * A booking's time selection: a single contiguous run of 30-minute blocks
 * (docs spec → "Regra de Consecutividade"), expressed as inclusive indices into
 * the day's ordered block list. The selection gestures live in the TimeStep UI;
 * the run can never cross a busy/pending/off block.
 */

export interface SlotRun {
  lo: number;
  hi: number;
}
