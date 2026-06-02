/**
 * Slot-selection rules for the booking wizard's time step
 * (docs spec → "Regra de Consecutividade"). Pure index math over a column of
 * cells; the UI layer maps pointer/keyboard gestures onto these.
 *
 * A cell is selectable iff its state is "free". A valid selection is a single
 * contiguous run of free cells — it can never cross a busy/pending/off block.
 */

export interface SlotRun {
  lo: number;
  hi: number;
}

interface SelectableCell {
  state: string;
}

const isFree = (cells: SelectableCell[], i: number) =>
  i >= 0 && i < cells.length && cells[i].state === "free";

/**
 * Drag behaviour: extend from `anchor` toward `target`, stopping at the first
 * non-free block (the wall). Models "o limite máximo da seleção será as 11:00"
 * — a drag that hits an occupied slot clamps instead of jumping past it.
 * Assumes `anchor` is free.
 */
export function dragRun(cells: SelectableCell[], anchor: number, target: number): SlotRun {
  if (target >= anchor) {
    let hi = anchor;
    for (let i = anchor; i <= target; i++) {
      if (!isFree(cells, i)) break;
      hi = i;
    }
    return { lo: anchor, hi };
  }
  let lo = anchor;
  for (let i = anchor; i >= target; i--) {
    if (!isFree(cells, i)) break;
    lo = i;
  }
  return { lo, hi: anchor };
}

/**
 * Tap-to-tap / Shift-click behaviour: fill the whole [anchor, target] range,
 * but only if every block in between is free. If anything is occupied, the fill
 * is impossible, so the caller restarts the selection at `target` (spec rule 2:
 * "limpar a seleção das 10:00 e iniciar uma nova às 15:00"). Returns null when
 * the range can't be filled.
 */
export function fillRun(cells: SelectableCell[], anchor: number, target: number): SlotRun | null {
  const lo = Math.min(anchor, target);
  const hi = Math.max(anchor, target);
  for (let i = lo; i <= hi; i++) {
    if (!isFree(cells, i)) return null;
  }
  return { lo, hi };
}
