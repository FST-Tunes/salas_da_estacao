"use client";

import { Lock, Clock, MinusCircle, Check } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";
import type { SlotCell } from "@/app/actions/availability";
import { blockEnd } from "@/lib/time/blocks";
import type { SlotRun } from "@/lib/time/selection";

const STATE_CLS: Record<SlotState, string> = {
  free: "bg-free-fill text-free-ink hover:brightness-[0.97]",
  pending: "bg-pending-fill text-pending-ink",
  busy: "bg-busy-fill text-busy-ink",
  off: "bg-off-fill text-off-ink",
};

// Icon per non-free state — never colour alone (design-system §3). Free blocks
// carry no icon (their distinguishing cue is the absence of a lock/clock/minus).
const LOCKED_ICON = { pending: Clock, busy: Lock, off: MinusCircle } as const;

/**
 * Step 3 — slot picker. Blocks are laid out in time-of-day columns read
 * top-to-bottom (PC: 4 columns of 4h each — 08–12, 12–16, 16–20, 20–24;
 * mobile: 2 columns — 08–16, 16–24). Because the blocks are in chronological
 * order, a CSS column-major grid produces those buckets automatically.
 *
 * Selection is click-only (no dragging) and always a single contiguous run of
 * free blocks (spec → consecutivity):
 *  - with nothing selected, clicking a free block starts the run;
 *  - clicking a free block outside the run extends it toward that block,
 *    provided every block in the gap is also free (can't jump over blocked slots);
 *  - clicking a selected end block (or a single selected block) clears the run;
 *  - clicking an interior selected block trims the smaller side: the clicked
 *    block becomes the new boundary on whichever end was closer.
 */
export function TimeStep({
  blocks,
  cells,
  selection,
  onSelectionChange,
  roomLabel,
}: {
  blocks: string[];
  cells: SlotCell[];
  selection: SlotRun | null;
  onSelectionChange: (run: SlotRun | null) => void;
  roomLabel: string;
}) {
  const handleClick = (i: number) => {
    if (!selection) {
      onSelectionChange({ lo: i, hi: i });
      return;
    }
    const { lo, hi } = selection;

    if (i >= lo && i <= hi) {
      if (lo === hi || i === lo || i === hi) {
        // Single block, or clicking either end: clear the selection entirely.
        onSelectionChange(null);
      } else {
        // Interior block: keep it and trim the smaller side.
        // Whichever end is closer becomes the new boundary at i.
        const distToLo = i - lo;
        const distToHi = hi - i;
        onSelectionChange(distToHi <= distToLo ? { lo, hi: i } : { lo: i, hi });
      }
      return;
    }

    // An unselected block: extend the run towards it, but only if every block
    // in the gap is free (can't jump over busy/pending/off blocks).
    const [gapStart, gapEnd] = i < lo ? [i, lo - 1] : [hi + 1, i];
    const gapAllFree = cells.slice(gapStart, gapEnd + 1).every((c) => c.state === "free");
    if (!gapAllFree) return;

    onSelectionChange(i < lo ? { lo: i, hi } : { lo, hi: i });
  };

  return (
    <div className="space-y-4">
      <div
        role="grid"
        aria-label={`Horários para ${roomLabel}`}
        className="grid select-none grid-flow-col grid-rows-[repeat(16,minmax(0,1fr))] gap-2 lg:grid-rows-[repeat(8,minmax(0,1fr))]"
      >
        {blocks.map((start, idx) => {
          const cell = cells[idx] ?? { state: "off" as SlotState, label: null };
          const free = cell.state === "free";
          const selected = !!selection && idx >= selection.lo && idx <= selection.hi;
          const LockedIcon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off"];

          return (
            <button
              key={start}
              type="button"
              data-slot={idx}
              data-state={cell.state}
              disabled={!free}
              aria-pressed={selected}
              aria-label={`${start} a ${blockEnd(start)}${free ? (selected ? ", selecionado" : ", disponível") : cell.state === "busy" ? ", ocupado" : cell.state === "pending" ? ", pendente" : ", indisponível"}`}
              onClick={() => free && handleClick(idx)}
              className={`numeral flex h-12 items-center justify-center gap-1.5 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                selected
                  ? "border-navy bg-navy text-text-on-dark"
                  : `border-transparent ${STATE_CLS[cell.state]}`
              } ${free ? "cursor-pointer" : "cursor-default"}`}
            >
              {selected ? (
                <Check size={12} weight="bold" aria-hidden />
              ) : (
                LockedIcon && <LockedIcon size={12} weight="bold" aria-hidden />
              )}
              {`${start} – ${blockEnd(start)}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
