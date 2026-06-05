"use client";

import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { DatePicker } from "@/components/ui/DatePicker";
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

      <div className="w-44 shrink-0 sm:w-48">
        <DatePicker
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(v) => v && go(v)}
          aria-label="Escolher data"
        />
      </div>
    </div>
  );
}
