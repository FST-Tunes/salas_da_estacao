"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react";
import { CalendarGrid } from "./CalendarGrid";
import { useFloating } from "./useFloating";
import { fromISODate } from "@/lib/time/dates";

const LABEL_FMT = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  /** ISO yyyy-mm-dd, or "" when empty. */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const triggerBase =
  "flex w-full items-center justify-between gap-2 rounded-md border border-navy/20 bg-surface-0 " +
  "px-3 py-2 text-sm text-navy outline-none transition-colors hover:border-navy/40 " +
  "focus-visible:border-navy aria-expanded:border-navy disabled:opacity-60 disabled:pointer-events-none";

/**
 * App-styled replacement for <input type="date">. The trigger shows the chosen
 * date (pt-PT) and opens the shared CalendarGrid in a portal popover — no native
 * picker, consistent brand look across every browser and OS.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Escolher data",
  className = "",
  id,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const floating = useFloating(open, anchorRef, panelRef, () => setOpen(false));

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        // Stop here so Esc closes only the picker, not an enclosing Overlay.
        e.stopPropagation();
        setOpen(false);
        anchorRef.current?.focus();
      }
    },
    [open],
  );

  const label = value ? cap(LABEL_FMT.format(fromISODate(value))) : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`numeral ${triggerBase} ${className}`.trim()}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarBlank size={16} weight="bold" aria-hidden className="shrink-0 text-navy-60" />
          <span className={`truncate ${label ? "" : "text-navy-30"}`}>{label ?? placeholder}</span>
        </span>
        <CaretDown
          size={15}
          weight="bold"
          aria-hidden
          className={`shrink-0 text-navy-60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && floating &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Escolher data"
            onKeyDown={onKeyDown}
            style={{
              position: "fixed",
              top: floating.top,
              left: floating.left,
              maxWidth: floating.maxWidth,
              transform: floating.placement === "top" ? "translateY(-100%)" : undefined,
            }}
            className="z-[60] rounded-lg border border-hairline bg-surface-0 p-3 shadow-md"
          >
            <CalendarGrid
              value={value || null}
              min={min}
              max={max}
              onPick={(iso) => {
                onChange(iso);
                setOpen(false);
                anchorRef.current?.focus();
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
