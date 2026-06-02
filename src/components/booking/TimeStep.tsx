"use client";

import { useRef } from "react";
import { Lock, Clock, MinusCircle, Check, HandTap, CursorClick } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";
import type { SlotCell } from "@/app/actions/availability";
import { blockEnd } from "@/lib/time/blocks";
import { dragRun, fillRun, type SlotRun } from "@/lib/time/selection";

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
 * Selection stays a single contiguous run of free blocks (spec → consecutivity):
 *  - single click toggles — selects a free block, deselects a selected one
 *    (clicking another free block fills the range between; clicking inside the
 *    run trims it back toward the origin);
 *  - mouse drag extends, clamping at the first occupied block (the "wall").
 * Touch never starts a drag, so the page can scroll the grid freely.
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
  const gridRef = useRef<HTMLDivElement>(null);
  const downRef = useRef(false);
  const dragAnchorRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  // Suppress the click that fires right after a committed mouse drag.
  const justDraggedRef = useRef(false);
  // Committed origin that clicks grow the run from / trim back toward.
  const anchorRef = useRef<number | null>(null);

  const cellIdxAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const chip = el?.closest<HTMLElement>("[data-slot]");
    if (!chip) return null;
    return Number(chip.dataset.slot);
  };

  const handleClick = (i: number) => {
    const anchor = anchorRef.current;
    const isSelected = !!selection && i >= selection.lo && i <= selection.hi;

    if (isSelected) {
      // Toggle off: clicking the origin (or a single block) clears the run;
      // clicking elsewhere in the run trims it back toward the origin.
      if (anchor == null || i === anchor) {
        anchorRef.current = null;
        onSelectionChange(null);
        return;
      }
      onSelectionChange(i > anchor ? { lo: anchor, hi: i - 1 } : { lo: i + 1, hi: anchor });
      return;
    }

    // A free, unselected block. Grow the contiguous run from the origin if every
    // block between is free; otherwise restart the selection here (spec rule 2).
    if (anchor != null) {
      const run = fillRun(cells, anchor, i);
      if (run) {
        onSelectionChange(run);
        return;
      }
    }
    anchorRef.current = i;
    onSelectionChange({ lo: i, hi: i });
  };

  // Mouse-only drag. Touch falls through to the native click so the page can
  // still scroll the grid.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const i = cellIdxAt(e.clientX, e.clientY);
    if (i == null || cells[i]?.state !== "free") return;
    downRef.current = true;
    dragAnchorRef.current = i;
    movedRef.current = false;
    gridRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!downRef.current || dragAnchorRef.current == null) return;
    const j = cellIdxAt(e.clientX, e.clientY);
    if (j == null) return;
    if (j !== dragAnchorRef.current) {
      movedRef.current = true;
      e.preventDefault(); // avoid text selection while dragging
      onSelectionChange(dragRun(cells, dragAnchorRef.current, j));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!downRef.current) return;
    downRef.current = false;
    try {
      gridRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be gone */
    }
    if (movedRef.current && dragAnchorRef.current != null) {
      anchorRef.current = dragAnchorRef.current; // clicks grow/trim from here
      justDraggedRef.current = true; // swallow the trailing click
    }
  };

  const onPointerCancel = () => {
    downRef.current = false;
  };

  // Fires for taps (touch / mouse-without-drag) and keyboard activation.
  const onCellClick = (idx: number) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    handleClick(idx);
  };

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <HandTap size={15} weight="bold" aria-hidden />
          Toque para selecionar; toque de novo para remover
        </span>
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <CursorClick size={15} weight="bold" aria-hidden />
          No PC pode também arrastar para marcar um intervalo
        </span>
      </p>

      <div
        ref={gridRef}
        role="grid"
        aria-label={`Horários para ${roomLabel}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
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
              onClick={() => free && onCellClick(idx)}
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
