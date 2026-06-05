"use client";

import { CalendarGrid } from "@/components/ui/CalendarGrid";

/**
 * Step 1 — month grid date-picker (full-width card). Days before today and
 * beyond the booking horizon (`maxDate`) are disabled; picking a valid day
 * advances the wizard. The grid itself is shared with the popover DatePicker.
 */
export function MonthCalendar({
  today,
  maxDate,
  selected,
  onPick,
}: {
  today: string;
  maxDate: string;
  selected: string | null;
  onPick: (iso: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-sm justify-center rounded-lg border border-hairline bg-surface-0 p-4 shadow-sm sm:p-5">
      <CalendarGrid value={selected} min={today} max={maxDate} onPick={onPick} />
    </div>
  );
}
