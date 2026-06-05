"use client";

import { Check } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";
import type { SlotCell } from "@/app/actions/availability";
import { blockEnd } from "@/lib/time/blocks";
import { nextRun, type SlotRun } from "@/lib/time/selection";
import { STATE_CLS, LOCKED_ICON } from "@/components/schedule/slotVisuals";

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
 *  - clicking a selected end block removes just that block from the run (single block → clears);
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
    const next = nextRun(i, selection, cells);
    // Same reference ⇒ no-op (e.g. the gap wasn't all free); skip the update.
    if (next !== selection) onSelectionChange(next);
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
          const LockedIcon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off" | "blocked"];
          // Booker name on the first block of an occupied run (public-safe: no phone).
          const namedSlot = !selected && !!cell.label && (cell.state === "busy" || cell.state === "pending");

          return (
            <button
              key={start}
              type="button"
              data-slot={idx}
              data-state={cell.state}
              disabled={!free}
              aria-pressed={selected}
              aria-label={`${start} a ${blockEnd(start)}${free ? (selected ? ", selecionado" : ", disponível") : cell.state === "busy" ? `, ocupado por ${cell.label}` : cell.state === "pending" ? `, pendente, ${cell.label}` : ", indisponível"}`}
              onClick={() => free && handleClick(idx)}
              className={`numeral flex h-12 items-center justify-center gap-1.5 rounded-md border px-1.5 text-xs font-medium tabular-nums transition-colors ${
                selected
                  ? "border-navy bg-navy text-text-on-dark"
                  : `border-transparent ${STATE_CLS[cell.state]}${free ? " hover:brightness-[0.97]" : ""}`
              } ${free ? "cursor-pointer" : "cursor-default"}`}
            >
              {namedSlot ? (
                <span className="flex w-full min-w-0 flex-col items-center justify-center leading-tight">
                  <span className="flex items-center gap-1">
                    {LockedIcon && <LockedIcon size={11} weight="bold" aria-hidden />}
                    {`${start} – ${blockEnd(start)}`}
                  </span>
                  <span className="block w-full truncate text-center text-[0.6rem] font-medium opacity-90">
                    {cell.label}
                  </span>
                </span>
              ) : (
                <>
                  {selected ? (
                    <Check size={12} weight="bold" aria-hidden />
                  ) : (
                    LockedIcon && <LockedIcon size={12} weight="bold" aria-hidden />
                  )}
                  {`${start} – ${blockEnd(start)}`}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
