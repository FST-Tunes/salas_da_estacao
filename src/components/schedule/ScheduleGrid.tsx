"use client";

import { Check, Clock, Lock, MinusCircle, Plus } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";

export interface GridColumn {
  id: string;
  name: string;
}

export interface DisplayCell {
  state: SlotState;
  label: string | null;
}

export interface GridSelection {
  colId: string;
  startIdx: number;
  endIdx: number;
}

interface ScheduleGridProps {
  blocks: string[];
  columns: GridColumn[];
  cellsByCol: Record<string, DisplayCell[]>;
  selection: GridSelection | null;
  onCellClick?: (colId: string, idx: number) => void;
}

const STATE_ICON = {
  free: Plus,
  pending: Clock,
  busy: Lock,
  off: MinusCircle,
} as const;

// Fill / ink per state (design-system.md §3). Busy also gets a hairline hatch
// so the state reads without colour.
const STATE_CLS: Record<SlotState, string> = {
  free: "bg-free-fill text-free-ink hover:brightness-[0.97] cursor-pointer",
  pending: "bg-pending-fill text-pending-ink",
  busy: "bg-busy-fill text-busy-ink",
  off: "bg-off-fill text-off-ink",
};

const HATCH =
  "repeating-linear-gradient(45deg, rgba(194,26,38,0.10) 0 4px, transparent 4px 9px)";

export function ScheduleGrid({
  blocks,
  columns,
  cellsByCol,
  selection,
  onCellClick,
}: ScheduleGridProps) {
  const gridTemplateColumns = `3.25rem repeat(${columns.length}, minmax(4.75rem, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-0 shadow-sm">
      <div role="grid" className="min-w-max" style={{ display: "grid", gridTemplateColumns }}>
        {/* Header row */}
        <div className="sticky left-0 top-0 z-20 border-b border-hairline bg-surface-1" role="columnheader" />
        {columns.map((col) => (
          <div
            key={col.id}
            role="columnheader"
            className="sticky top-0 z-10 border-b border-l border-hairline bg-surface-1 px-2 py-2.5 text-center text-[0.78rem] font-medium text-navy"
          >
            {col.name}
          </div>
        ))}

        {/* Block rows */}
        {blocks.map((start, idx) => (
          <Row
            key={start}
            start={start}
            idx={idx}
            columns={columns}
            cellsByCol={cellsByCol}
            selection={selection}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  start,
  idx,
  columns,
  cellsByCol,
  selection,
  onCellClick,
}: {
  start: string;
  idx: number;
  columns: GridColumn[];
  cellsByCol: Record<string, DisplayCell[]>;
  selection: GridSelection | null;
  onCellClick?: (colId: string, idx: number) => void;
}) {
  return (
    <>
      <div
        role="rowheader"
        className="sticky left-0 z-10 flex items-start justify-end border-b border-hairline bg-surface-1 px-2 py-1.5"
      >
        <span className="numeral text-[0.8rem] text-navy-60">{start}</span>
      </div>
      {columns.map((col) => {
        const cell = cellsByCol[col.id]?.[idx] ?? { state: "off" as SlotState, label: null };
        const selected =
          selection?.colId === col.id && idx >= selection.startIdx && idx <= selection.endIdx;
        const isRunStart = selected && idx === selection!.startIdx;
        const isRunEnd = selected && idx === selection!.endIdx;
        const Icon = STATE_ICON[cell.state];
        const interactive = cell.state === "free" || selected;

        const common =
          "relative border-b border-l border-hairline min-h-11 px-1.5 py-1 text-left transition-colors";

        const content = (
          <>
            {/* Brace hug on the selected run (design-system.md §5) */}
            {isRunStart && (
              <span aria-hidden className="absolute -left-0.5 top-0 font-display text-sm leading-none text-gold">
                {"{"}
              </span>
            )}
            {isRunEnd && (
              <span aria-hidden className="absolute -left-0.5 bottom-0 font-display text-sm leading-none text-gold">
                {"}"}
              </span>
            )}
            {cell.label ? (
              <span className="line-clamp-2 text-[0.7rem] font-medium leading-tight">{cell.label}</span>
            ) : (
              <span className="flex items-center gap-1 text-[0.65rem] opacity-70">
                <Icon size={11} weight="bold" aria-hidden />
              </span>
            )}
          </>
        );

        if (interactive && onCellClick) {
          return (
            <button
              key={col.id}
              type="button"
              role="gridcell"
              aria-pressed={selected}
              aria-label={`${col.name}, ${start}, ${selected ? "selecionado" : "disponível"}`}
              onClick={() => onCellClick(col.id, idx)}
              className={`${common} ${
                selected ? "bg-navy text-text-on-dark" : STATE_CLS.free
              }`}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={col.id}
            role="gridcell"
            aria-label={`${col.name}, ${start}, ${cell.state === "busy" ? "ocupada" : cell.state === "pending" ? "pendente" : "indisponível"}`}
            className={`${common} ${STATE_CLS[cell.state]}`}
            style={cell.state === "busy" ? { backgroundImage: HATCH } : undefined}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
