"use client";

import { Fragment } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { STATE_CLS, LOCKED_ICON } from "@/components/schedule/slotVisuals";
import { blockEnd } from "@/lib/time/blocks";
import { formatShortWeekday, fromISODate } from "@/lib/time/dates";
import type { RoomWeekModel } from "@/lib/grid";

/** Read-only weekly schedule for one room: rows = 30-min blocks, columns = the
 *  7 days of the week. Reuses the shared state colours/icons (slotVisuals) so it
 *  never drifts from the daily picker. Recurring occupations carry a gold mark. */
export function RoomWeekGrid({ model, today }: { model: RoomWeekModel; today: string }) {
  const { blocks, days } = model;
  const cols = `3.25rem repeat(${days.length}, minmax(4.5rem, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-0">
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: cols }}>
        {/* Header: empty time corner + weekday labels */}
        <div className="sticky left-0 z-10 border-b border-hairline bg-surface-0" />
        {days.map((d) => {
          const isToday = d.date === today;
          return (
            <div
              key={d.date}
              aria-current={isToday ? "date" : undefined}
              className={`border-b border-l border-hairline px-1 py-2 text-center ${
                isToday ? "bg-navy text-text-on-dark" : "bg-surface-1 text-navy"
              }`}
            >
              <div className="text-xs font-medium capitalize">{formatShortWeekday(d.date)}</div>
              <div className="numeral text-[0.7rem] tabular-nums opacity-80">
                {fromISODate(d.date).getDate()}
              </div>
            </div>
          );
        })}

        {/* Body: one row per block */}
        {blocks.map((start, i) => (
          <Fragment key={start}>
            <div className="numeral sticky left-0 z-10 flex items-start justify-end border-t border-hairline bg-surface-0 px-1.5 py-1 text-[0.65rem] tabular-nums text-text-muted">
              {start}
            </div>
            {days.map((d) => {
              const cell = d.cells[i] ?? { state: "off" as const, label: null, recurring: false };
              const free = cell.state === "free";
              const Icon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off"];
              return (
                <div
                  key={d.date}
                  data-state={cell.state}
                  title={cell.label ? `${cell.label} · ${start}–${blockEnd(start)}` : undefined}
                  className={`min-h-[1.9rem] border-t border-l border-hairline px-1 py-1 ${STATE_CLS[cell.state]}`}
                >
                  <span className="flex items-center gap-0.5 leading-tight">
                    {Icon && <Icon size={10} weight="bold" aria-hidden className="shrink-0 opacity-70" />}
                    {cell.recurring && (
                      <ArrowsClockwise size={10} weight="bold" aria-hidden className="shrink-0 text-gold" />
                    )}
                    {cell.label && (
                      <span className="truncate text-[0.65rem] font-medium">{cell.label}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
