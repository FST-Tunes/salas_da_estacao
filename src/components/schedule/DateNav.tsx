"use client";

import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { addDays, formatLongDate } from "@/lib/time/dates";

/** Day navigation for the public schedule. Drives the ?date= query param. */
export function DateNav({
  date,
  minDate,
  maxDate,
  basePath = "/",
}: {
  date: string;
  minDate: string;
  maxDate: string;
  basePath?: string;
}) {
  const router = useRouter();
  const go = (next: string) => router.push(`${basePath}?date=${next}`);

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const atMin = date <= minDate;
  const atMax = date >= maxDate;

  const longDate = formatLongDate(date);
  const pretty = longDate.charAt(0).toUpperCase() + longDate.slice(1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(prev)}
          disabled={atMin}
          aria-label="Dia anterior"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => go(next)}
          disabled={atMax}
          aria-label="Dia seguinte"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <CaretRight size={18} weight="bold" />
        </button>
        <p className="ml-1 font-display text-lg text-navy">{pretty}</p>
      </div>

      <label className="inline-flex items-center gap-2 rounded-md border border-navy/20 px-3 py-2 text-sm text-navy-60">
        <CalendarBlank size={16} weight="bold" aria-hidden />
        <span className="sr-only">Escolher data</span>
        <input
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="bg-transparent text-navy outline-none"
        />
      </label>
    </div>
  );
}
