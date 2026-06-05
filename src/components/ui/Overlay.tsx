"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

type Variant = "dialog" | "sheet" | "auto";
type Size = "sm" | "md" | "lg";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Optional element rendered before the title (e.g. an icon). */
  icon?: ReactNode;
  /** "auto" (default): bottom sheet on mobile, centred dialog on desktop. */
  variant?: Variant;
  size?: Size;
  /** Hide the default header (title + close button) when the body provides its own. */
  hideHeader?: boolean;
}

const SIZE_CLS: Record<Size, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
};

/** Duration kept in sync with the transition classes below. */
const ANIM_MS = 200;

/**
 * Portal-based overlay used across the app for anything that would otherwise
 * expand inline and push the page around. Renders a centred dialog on desktop
 * and a bottom sheet on mobile (variant "auto"), with body scroll-lock (and
 * scrollbar-width compensation so the page doesn't jump), focus trapping,
 * Esc / backdrop dismissal, and short enter/exit transitions. Honours
 * prefers-reduced-motion via the global rule in globals.css.
 */
export function Overlay({
  open,
  onClose,
  title,
  children,
  icon,
  variant = "auto",
  size = "md",
  hideHeader = false,
}: Props) {
  // Keep mounted through the exit transition: render while open OR animating out.
  const [mounted, setMounted] = useState(open);
  // Drives the enter/exit transition (off → on one frame after mount).
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      setShown(false);
      const t = setTimeout(() => setMounted(false), ANIM_MS);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Trigger the enter transition once the panel is in the DOM.
  useEffect(() => {
    if (!mounted) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  // Body scroll-lock with scrollbar-width compensation (no layout jump).
  useEffect(() => {
    if (!mounted) return;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [mounted]);

  // Move focus into the panel, restore it on unmount.
  useEffect(() => {
    if (!mounted) return;
    panelRef.current?.focus();
    return () => lastFocused.current?.focus?.();
  }, [mounted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus within the panel.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!mounted) return null;

  const isSheet = variant === "sheet";
  const isDialog = variant === "dialog";
  // "auto" → sheet on mobile, dialog on desktop (sm+).
  const containerAlign = isDialog
    ? "items-center justify-center p-4"
    : isSheet
      ? "items-end justify-center"
      : "items-end justify-center sm:items-center sm:p-4";

  const panelShape = isDialog
    ? "rounded-lg"
    : isSheet
      ? "rounded-t-2xl"
      : "rounded-t-2xl sm:rounded-lg";

  // Enter/exit transforms: sheets slide up, dialogs fade + lift.
  const panelMotion = isDialog
    ? shown
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-2 scale-[0.98]"
    : shown
      ? "opacity-100 translate-y-0 sm:scale-100"
      : "translate-y-full opacity-100 sm:translate-y-2 sm:opacity-0 sm:scale-[0.98]";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${containerAlign}`}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-navy/40 backdrop-blur-[1px] transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden border border-hairline bg-surface-0 shadow-md outline-none transition-[transform,opacity] duration-200 ease-out ${panelShape} ${SIZE_CLS[size]} ${panelMotion}`}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
            <h2 id={titleId} className="flex min-w-0 items-center gap-2 font-display text-lg text-navy">
              {icon}
              <span className="truncate">{title}</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-navy-60 transition-colors hover:bg-navy/5 hover:text-navy"
            >
              <X size={18} weight="bold" aria-hidden />
            </button>
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 ${
            // Bottom sheets touch the screen edge — clear the iOS home indicator.
            isDialog ? "" : "pb-safe-4"
          }`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
