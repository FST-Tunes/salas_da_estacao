"use client";

import { useRef } from "react";
import { Lock, Clock, MinusCircle, Check, HandTap, CursorClick } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";
import type { SlotCell } from "@/app/actions/availability";
import { dragRun, fillRun, type SlotRun } from "@/lib/time/selection";

const STATE_CLS: Record<SlotState, string> = {
  free: "bg-free-fill text-free-ink hover:brightness-[0.97]",
  pending: "bg-pending-fill text-pending-ink",
  busy: "bg-busy-fill text-busy-ink",
  off: "bg-off-fill text-off-ink",
};

// Right-side label + icon for each state — never colour alone (design-system §3).
const STATE_META: Record<SlotState, { label: string; Icon: typeof Check }> = {
  free: { label: "Disponível", Icon: Check },
  pending: { label: "Pendente", Icon: Clock },
  busy: { label: "Ocupada", Icon: Lock },
  off: { label: "Fora de horário", Icon: MinusCircle },
};

/**
 * Step 3 — slot picker, laid out as a top-to-bottom timeline (one row per
 * 30-min block, earliest at the top — like a day planner) so consecutive times
 * read in a single vertical sweep instead of wrapping across columns.
 *
 * Selection maps the pure rules in lib/time/selection onto two gestures:
 *  - mouse drag → extend, clamping at the first occupied block (the "wall");
 *  - tap / click (touch, mouse-without-drag, keyboard) → first tap sets the
 *    anchor, a second tap fills the range if every block between is free,
 *    otherwise the selection restarts at the new block (spec rule 2).
 * Touch never starts a drag, so the page can scroll the (tall) timeline freely;
 * mouse drag uses elementFromPoint so the pointer sliding over rows selects them.
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
  // Committed anchor that a subsequent tap fills from.
  const anchorRef = useRef<number | null>(null);

  const cellIdxAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const chip = el?.closest<HTMLElement>("[data-slot]");
    if (!chip) return null;
    return Number(chip.dataset.slot);
  };

  const handleTap = (i: number, _fill: boolean) => {
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
    anchorRef.current = i;
    onSelectionChange({ lo: i, hi: i });
  };

  // Mouse-only drag. Touch falls through to the native click below so the page
  // can still scroll the timeline.
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
      anchorRef.current = dragAnchorRef.current; // future taps fill from here
      justDraggedRef.current = true; // swallow the trailing click
    }
  };

  const onPointerCancel = () => {
    downRef.current = false;
  };

  // Fires for taps (touch / mouse-without-drag) and keyboard activation.
  const onCellClick = (idx: number, e: React.MouseEvent) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    handleTap(idx, e.shiftKey);
  };

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <HandTap size={15} weight="bold" aria-hidden />
          Toque na hora de início e na de fim
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
        className="flex max-w-md select-none flex-col overflow-hidden rounded-lg border border-hairline"
      >
        {blocks.map((start, idx) => {
          const cell = cells[idx] ?? { state: "off" as SlotState, label: null };
          const free = cell.state === "free";
          const selected = !!selection && idx >= selection.lo && idx <= selection.hi;
          const isRunStart = selected && idx === selection!.lo;
          const isRunEnd = selected && idx === selection!.hi;
          const meta = STATE_META[cell.state];
          const RightIcon = selected ? Check : meta.Icon;
          const rightLabel = selected ? "Selecionado" : meta.label;

          return (
            <button
              key={start}
              type="button"
              data-slot={idx}
              data-state={cell.state}
              disabled={!free}
              aria-pressed={selected}
              aria-label={`${start}${free ? (selected ? ", selecionado" : ", disponível") : cell.state === "busy" ? ", ocupado" : cell.state === "pending" ? ", pendente" : ", indisponível"}`}
              onClick={(e) => free && onCellClick(idx, e)}
              className={`relative flex h-12 items-center gap-3 border-b border-hairline pl-8 pr-3 text-left transition-colors last:border-b-0 ${
                selected ? "bg-navy text-text-on-dark" : STATE_CLS[cell.state]
              } ${free ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* Brace motif "hugging" the run on its left edge (design-system §5). */}
              {isRunStart && (
                <span aria-hidden className="absolute left-1.5 top-1 font-display text-base leading-none text-gold">
                  {"{"}
                </span>
              )}
              {isRunEnd && (
                <span aria-hidden className="absolute bottom-1 left-1.5 font-display text-base leading-none text-gold">
                  {"}"}
                </span>
              )}
              <span className="numeral w-12 shrink-0 text-[0.95rem] font-medium tabular-nums">
                {start}
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs">
                <RightIcon size={13} weight="bold" aria-hidden />
                {rightLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
