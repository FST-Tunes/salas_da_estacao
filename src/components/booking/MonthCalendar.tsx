"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { fromISODate, toISODate } from "@/lib/time/dates";

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MONTH_TITLE = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" });

/** Monday-first index (0=Mon … 6=Sun) for a JS getDay() value (0=Sun). */
const mondayIndex = (jsDay: number) => (jsDay + 6) % 7;

/**
 * Step 1 — month grid date-picker. Days before today and beyond the booking
 * horizon (`maxDate`) are disabled; picking a valid day advances the wizard.
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
  const initial = fromISODate(selected ?? today);
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const lead = mondayIndex(first.getDay());

  // Disable month nav once it would leave the [today, maxDate] window.
  const prevDisabled = toISODate(new Date(view.y, view.m, 1)) <= today.slice(0, 7) + "-01";
  const lastOfMonth = toISODate(new Date(view.y, view.m + 1, 0));
  const nextDisabled = lastOfMonth >= maxDate;

  const step = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const title = MONTH_TITLE.format(first);
  const prettyTitle = title.charAt(0).toUpperCase() + title.slice(1);

  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(view.y, view.m, i + 1))),
  ];

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-hairline bg-surface-0 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={prevDisabled}
          aria-label="Mês anterior"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5 disabled:pointer-events-none disabled:opacity-40"
        >
          <CaretLeft size={17} weight="bold" />
        </button>
        <p className="font-display text-lg text-navy">{prettyTitle}</p>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={nextDisabled}
          aria-label="Mês seguinte"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-navy/20 text-navy hover:bg-navy/5 disabled:pointer-events-none disabled:opacity-40"
        >
          <CaretRight size={17} weight="bold" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-text-muted">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} aria-hidden />;
          const day = Number(iso.slice(-2));
          const disabled = iso < today || iso > maxDate;
          const isSelected = iso === selected;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              aria-pressed={isSelected}
              aria-label={iso}
              className={`numeral relative flex aspect-square items-center justify-center rounded-md text-[0.9rem] transition-colors ${
                isSelected
                  ? "bg-navy text-text-on-dark"
                  : disabled
                    ? "cursor-default text-navy-30"
                    : "text-navy hover:bg-navy/5"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-navy/40" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
