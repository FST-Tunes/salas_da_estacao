"use client";

import { useRef } from "react";
import { Lock, Clock, MinusCircle, HandTap, CursorClick } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";
import type { SlotCell } from "@/app/actions/availability";
import { dragRun, fillRun, type SlotRun } from "@/lib/time/selection";

const STATE_CLS: Record<SlotState, string> = {
  free: "bg-free-fill text-free-ink hover:brightness-[0.97]",
  pending: "bg-pending-fill text-pending-ink",
  busy: "bg-busy-fill text-busy-ink",
  off: "bg-off-fill text-off-ink",
};

const LOCKED_ICON = { pending: Clock, busy: Lock, off: MinusCircle } as const;

/**
 * Step 3 — slot picker. A grid of 30-min "chips" with three selection gestures
 * mapped onto the pure rules in lib/time/selection:
 *  - drag (mouse or touch) → extend, clamping at the first occupied block;
 *  - tap-to-tap / Shift+click → fill the range if every block between is free,
 *    otherwise restart the selection at the new block;
 *  - keyboard (Enter/Space, Shift+Enter) for accessibility.
 * Touch drag uses elementFromPoint so a finger sliding across chips selects them.
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
  // Committed anchor that a subsequent tap / Shift-click fills from.
  const anchorRef = useRef<number | null>(null);

  const cellIdxAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const chip = el?.closest<HTMLElement>("[data-slot]");
    if (!chip) return null;
    return Number(chip.dataset.slot);
  };

  const handleTap = (i: number, fill: boolean) => {
    // Toggle off when tapping the single currently-selected block.
    if (selection && selection.lo === selection.hi && selection.lo === i) {
      anchorRef.current = null;
      onSelectionChange(null);
      return;
    }
    const prev = anchorRef.current;
    if (prev != null) {
      const run = fillRun(cells, prev, i);
      if (run) {
        onSelectionChange(run);
        return; // keep anchor; allows growing/shrinking from the same origin
      }
      // Range crosses an occupied block → restart here (spec rule 2).
    }
    void fill; // fill intent is implicit: a second tap always tries to fill
    anchorRef.current = i;
    onSelectionChange({ lo: i, hi: i });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const i = cellIdxAt(e.clientX, e.clientY);
    if (i == null || cells[i]?.state !== "free") return;
    e.preventDefault();
    downRef.current = true;
    dragAnchorRef.current = i;
    movedRef.current = false;
    gridRef.current?.setPointerCapture(e.pointerId);
    onSelectionChange({ lo: i, hi: i });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!downRef.current || dragAnchorRef.current == null) return;
    const j = cellIdxAt(e.clientX, e.clientY);
    if (j == null) return;
    if (j !== dragAnchorRef.current) movedRef.current = true;
    onSelectionChange(dragRun(cells, dragAnchorRef.current, j));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!downRef.current) return;
    downRef.current = false;
    try {
      gridRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be gone */
    }
    const a = dragAnchorRef.current;
    if (a == null) return;
    if (movedRef.current) {
      anchorRef.current = a; // drag committed; future Shift/tap fills from here
    } else {
      handleTap(a, e.shiftKey);
    }
  };

  const onPointerCancel = () => {
    downRef.current = false;
  };

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <HandTap size={15} weight="bold" aria-hidden />
          Deslize ou toque no início e no fim
        </span>
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <CursorClick size={15} weight="bold" aria-hidden />
          No PC: arraste ou Shift+clique
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
        className="grid touch-none grid-cols-3 gap-2 select-none sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
      >
        {blocks.map((start, idx) => {
          const cell = cells[idx] ?? { state: "off" as SlotState, label: null };
          const free = cell.state === "free";
          const selected = !!selection && idx >= selection.lo && idx <= selection.hi;
          const isRunStart = selected && idx === selection!.lo;
          const isRunEnd = selected && idx === selection!.hi;
          const LockedIcon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off"];

          return (
            <button
              key={start}
              type="button"
              data-slot={idx}
              data-state={cell.state}
              disabled={!free}
              aria-pressed={selected}
              aria-label={`${start}${free ? (selected ? ", selecionado" : ", disponível") : cell.state === "busy" ? ", ocupado" : cell.state === "pending" ? ", pendente" : ", indisponível"}`}
              onKeyDown={(e) => {
                if (!free) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTap(idx, e.shiftKey);
                }
              }}
              className={`numeral relative flex h-12 items-center justify-center rounded-md border text-[0.9rem] font-medium transition-colors ${
                selected
                  ? "border-navy bg-navy text-text-on-dark"
                  : `border-transparent ${STATE_CLS[cell.state]}`
              } ${free ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* Brace motif hugging the run ends (design-system §5). */}
              {isRunStart && (
                <span aria-hidden className="absolute -left-1 top-1/2 -translate-y-1/2 font-display text-base leading-none text-gold">
                  {"{"}
                </span>
              )}
              {isRunEnd && (
                <span aria-hidden className="absolute -right-1 top-1/2 -translate-y-1/2 font-display text-base leading-none text-gold">
                  {"}"}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                {LockedIcon && <LockedIcon size={12} weight="bold" aria-hidden />}
                {start}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
