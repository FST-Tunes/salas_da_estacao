"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useFloating } from "./useFloating";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional richer label for the list/trigger (falls back to `label`). */
  node?: ReactNode;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Extra classes for the trigger button. */
  className?: string;
  id?: string;
  "aria-label"?: string;
  /** Tabular-nums styling for both the trigger and the list (times). */
  numeral?: boolean;
}

const triggerBase =
  "flex w-full items-center justify-between gap-2 rounded-md border border-navy/20 bg-surface-0 " +
  "px-3 py-2 text-sm text-navy outline-none transition-colors hover:border-navy/40 " +
  "focus-visible:border-navy aria-expanded:border-navy disabled:opacity-60 disabled:pointer-events-none";

/**
 * App-styled replacement for the native <select>. A combobox button opens a
 * portal-rendered listbox (so it never clips inside an Overlay), with full
 * keyboard support — arrows, Home/End, Enter/Space, Esc, and type-ahead — and
 * the brand navy/sky palette. Controlled: `onChange` receives the chosen value.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecionar…",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
  numeral = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const typeahead = useRef({ buffer: "", timer: 0 });
  const listId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value],
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => {
    setOpen(false);
    anchorRef.current?.focus();
  }, []);

  const floating = useFloating(open, anchorRef, panelRef, () => setOpen(false));

  // On open, highlight (and scroll to) the current selection.
  useEffect(() => {
    if (!open) return;
    const start = selectedIndex >= 0 ? selectedIndex : firstEnabled(options);
    setActive(start);
  }, [open, selectedIndex, options]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
  };

  const move = (dir: 1 | -1) => {
    setActive((cur) => {
      let i = cur;
      for (let step = 0; step < options.length; step++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i]?.disabled) return i;
      }
      return cur;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); move(-1); break;
      case "Home": e.preventDefault(); setActive(firstEnabled(options)); break;
      case "End": e.preventDefault(); setActive(lastEnabled(options)); break;
      case "Enter":
      case " ": e.preventDefault(); choose(active); break;
      // Stop here so Esc closes only the dropdown, not an enclosing Overlay.
      case "Escape": e.preventDefault(); e.stopPropagation(); close(); break;
      case "Tab": setOpen(false); break;
      default:
        if (e.key.length === 1) typeAhead(e.key);
    }
  };

  const typeAhead = (ch: string) => {
    window.clearTimeout(typeahead.current.timer);
    typeahead.current.buffer += ch.toLowerCase();
    const buf = typeahead.current.buffer;
    const match = options.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(buf),
    );
    if (match >= 0) setActive(match);
    typeahead.current.timer = window.setTimeout(() => {
      typeahead.current.buffer = "";
    }, 600);
  };

  const num = numeral ? "tabular-nums [font-variant-numeric:tabular-nums]" : "";

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${triggerBase} ${num} ${className}`.trim()}
      >
        <span className={`truncate ${selected ? "" : "text-navy-30"}`}>
          {selected ? selected.node ?? selected.label : placeholder}
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
            style={{
              position: "fixed",
              top: floating.top,
              left: floating.left,
              minWidth: floating.minWidth,
              maxWidth: floating.maxWidth,
              maxHeight: floating.maxHeight,
              transform: floating.placement === "top" ? "translateY(-100%)" : undefined,
            }}
            className="z-[60] overflow-hidden rounded-md border border-hairline bg-surface-0 shadow-md"
          >
            <ul
              id={listId}
              role="listbox"
              aria-activedescendant={`${listId}-${active}`}
              className={`max-h-[inherit] overflow-y-auto overscroll-contain p-1 ${num}`}
              style={{ maxHeight: floating.maxHeight }}
            >
              {options.map((o, i) => {
                const isSelected = o.value === value;
                const isActive = i === active;
                return (
                  <li
                    key={o.value}
                    id={`${listId}-${i}`}
                    ref={(el) => { optionRefs.current[i] = el; }}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => !o.disabled && setActive(i)}
                    onClick={() => choose(i)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-sm ${
                      o.disabled
                        ? "cursor-not-allowed text-navy-30"
                        : isActive
                          ? "bg-navy text-text-on-dark"
                          : isSelected
                            ? "bg-surface-1 text-navy"
                            : "text-navy"
                    }`}
                  >
                    <span className="truncate">{o.node ?? o.label}</span>
                    {isSelected && (
                      <Check
                        size={14}
                        weight="bold"
                        aria-hidden
                        className={`shrink-0 ${isActive ? "text-text-on-dark" : "text-gold"}`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}

const firstEnabled = (opts: SelectOption[]) => {
  const i = opts.findIndex((o) => !o.disabled);
  return i >= 0 ? i : 0;
};
const lastEnabled = (opts: SelectOption[]) => {
  for (let i = opts.length - 1; i >= 0; i--) if (!opts[i].disabled) return i;
  return opts.length - 1;
};
