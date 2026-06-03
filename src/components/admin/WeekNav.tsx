"use client";

import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { addDays, formatDayMonth, startOfWeekISO, todayISO } from "@/lib/time/dates";

/** Week navigation for the per-room schedule. Drives the ?week= query param
 *  (always the Monday of the shown week). */
export function WeekNav({ week, basePath }: { week: string; basePath: string }) {
  const router = useRouter();
  const go = (next: string) => router.push(`${basePath}?week=${startOfWeekISO(next)}`);

  const end = addDays(week, 6);
  const thisWeek = startOfWeekISO(todayISO());
  const isThisWeek = week === thisWeek;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(addDays(week, -7))}
          aria-label="Semana anterior"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => go(addDays(week, 7))}
          aria-label="Semana seguinte"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5"
        >
          <CaretRight size={18} weight="bold" />
        </button>
        <p className="numeral ml-1 font-display text-lg tabular-nums text-navy">
          {formatDayMonth(week)} – {formatDayMonth(end)}
        </p>
      </div>

      {!isThisWeek && (
        <button
          type="button"
          onClick={() => go(thisWeek)}
          className="inline-flex items-center gap-2 rounded-md border border-navy/20 px-3 py-2 text-sm text-navy hover:bg-navy/5"
        >
          <CalendarBlank size={16} weight="bold" aria-hidden />
          Esta semana
        </button>
      )}
    </div>
  );
}
