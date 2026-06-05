"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export interface FloatingStyle {
  top: number;
  left: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
  /** "bottom" → panel drops below the anchor; "top" → it rises above it. */
  placement: "top" | "bottom";
}

/**
 * Anchors a portal-rendered popover (custom Select / DatePicker) to a trigger.
 * Uses fixed positioning so the panel is never clipped by an overflow-hidden or
 * scrollable ancestor (e.g. the Overlay sheet body). Recomputes on scroll/resize
 * — including scrolls inside any container (capture phase) — and flips above the
 * trigger when there isn't room below. Also wires Esc and outside-click to close.
 */
export function useFloating(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): FloatingStyle | null {
  const [style, setStyle] = useState<FloatingStyle | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const margin = 8;
    const gap = 4;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const below = spaceBelow >= 220 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(140, Math.min(320, below ? spaceBelow : spaceAbove));
    const left = Math.min(r.left, vw - margin - r.width);
    setStyle({
      left: Math.max(margin, left),
      top: below ? r.bottom + gap : r.top - gap,
      minWidth: r.width,
      maxWidth: vw - margin * 2,
      maxHeight,
      placement: below ? "bottom" : "top",
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    reposition();
    const handler = () => reposition();
    // Capture phase catches scrolls in nested containers (Overlay sheet body).
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, onClose, anchorRef, panelRef]);

  return style;
}
