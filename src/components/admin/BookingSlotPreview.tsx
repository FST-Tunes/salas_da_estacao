"use client";

import { useEffect, useState } from "react";
import { CircleNotch, Warning, Check, X } from "@phosphor-icons/react";
import type { Booking, SlotState } from "@/lib/types";
import { getDayAvailability, type DayAvailability, type SlotCell } from "@/app/actions/availability";
import { blockEnd, toMinutes } from "@/lib/time/blocks";
import { nextRun, type SlotRun } from "@/lib/time/selection";
import { STATE_CLS, LOCKED_ICON } from "@/components/schedule/slotVisuals";
import { Legend } from "@/components/schedule/Legend";

interface Props {
  booking: Pick<Booking, "date" | "startTime" | "endTime" | "roomId">;
  /** Room to show, driven by the assignment dropdown in the actions below. */
  selectedRoom: string;
  /**
   * Edit/move mode: always show the fit badge and let the real free/busy show
   * through the selection (instead of the solid-navy "own room" fill), so the
   * admin can judge the new room/time as they change it.
   */
  editing?: boolean;
  /** Drop this booking from the availability calc (its own slots read as free). */
  excludeBookingId?: string;
  /**
   * Interactive edit mode: the requested range (`booking.startTime/endTime`)
   * becomes a click-to-pick selection — exactly like the public schedule. The
   * chosen blocks fill solid navy; clicking calls `onRangeChange`. The booking's
   * *original* range (`originalStart/originalEnd`) is drawn with the navy outline
   * + braces, so the admin always sees where it sat before.
   */
  editable?: boolean;
  onRangeChange?: (startTime: string, endTime: string) => void;
  originalStart?: string;
  originalEnd?: string;
}

/**
 * Slot view for a single booking's day, shown when an admin expands or edits a
 * request. Read-only by default; with `editable`, the requested time range is a
 * click-to-pick selection (shared gesture with the public TimeStep).
 */
export function BookingSlotPreview({
  booking,
  selectedRoom,
  editing = false,
  excludeBookingId,
  editable = false,
  onRangeChange,
  originalStart,
  originalEnd,
}: Props) {
  const [avail, setAvail] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getDayAvailability(booking.date, excludeBookingId)
      .then((data) => {
        if (alive) setAvail(data);
      })
      .catch(() => {
        if (alive) setError("Não foi possível carregar a disponibilidade.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [booking.date, excludeBookingId]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <CircleNotch size={15} weight="bold" className="animate-spin" aria-hidden />
        A carregar disponibilidade…
      </p>
    );
  }

  if (error || !avail) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-busy-ink">
        <Warning size={14} weight="bold" aria-hidden />
        {error ?? "Sem dados de disponibilidade."}
      </p>
    );
  }

  // getDayAvailability clamps to the public window [hoje, hoje+maxAdvanceDays].
  // If it returned a different day, the request falls outside that window — show
  // the request's own data is unavailable rather than the wrong day's slots.
  if (avail.date !== booking.date) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-busy-ink">
        <Warning size={14} weight="bold" aria-hidden />
        Esta data está fora da janela de disponibilidade pública.
      </p>
    );
  }

  const { blocks } = avail;
  const room = avail.rooms.find((r) => r.id === selectedRoom);
  const cells: SlotCell[] = room?.cells ?? [];
  const ownRoom = booking.roomId != null && selectedRoom === booking.roomId;

  const selStart = toMinutes(booking.startTime);
  const selEnd = toMinutes(booking.endTime);
  const inSelection = (start: string) => {
    const m = toMinutes(start);
    return m >= selStart && m < selEnd;
  };

  // Original requested range (edit mode): drawn with the navy outline + braces.
  const origStart = originalStart != null ? toMinutes(originalStart) : null;
  const origEnd = originalEnd != null ? toMinutes(originalEnd) : null;
  const inOriginal = (start: string) => {
    if (origStart == null || origEnd == null) return false;
    const m = toMinutes(start);
    return m >= origStart && m < origEnd;
  };

  // Fit check (only meaningful for a room that isn't the one already holding the
  // booking): are all the requested blocks free in this room?
  const selectionFree = blocks.every(
    (start, idx) => !inSelection(start) || cells[idx]?.state === "free",
  );

  // Click-to-pick: convert the current selection to block indices, run the
  // shared gesture, and report the new range back as start/end times.
  const run: SlotRun | null = (() => {
    const lo = blocks.indexOf(booking.startTime);
    const hi = blocks.findIndex((b) => blockEnd(b) === booking.endTime);
    return lo >= 0 && hi >= 0 ? { lo, hi } : null;
  })();
  const handleClick = (i: number) => {
    if (!editable || !onRangeChange) return;
    const next = nextRun(i, run, cells);
    if (!next || next === run) return; // null = would empty the booking → ignore
    onRangeChange(blocks[next.lo], blockEnd(blocks[next.hi]));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-navy">
          {room?.name ?? "Sala"} · {booking.startTime}–{booking.endTime}
        </span>

        {(editing || !ownRoom) &&
          (selectionFree ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-free-ink">
              <Check size={13} weight="bold" aria-hidden /> Livre nesta sala
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-busy-ink">
              <X size={13} weight="bold" aria-hidden /> Em conflito nesta sala
            </span>
          ))}
      </div>

      {editable && (
        <p className="text-xs text-text-muted">
          Clique nos blocos para escolher o novo horário. A azul-escuro fica a nova seleção; as
          chavetas marcam o horário pedido originalmente.
        </p>
      )}

      <div
        role="grid"
        aria-label={`Horários de ${room?.name ?? "sala"} em ${booking.date}`}
        className="grid grid-flow-col grid-rows-[repeat(16,minmax(0,1fr))] gap-2 lg:grid-rows-[repeat(8,minmax(0,1fr))]"
      >
        {blocks.map((start, idx) => {
          const cell = cells[idx] ?? { state: "off" as SlotState, label: null };
          const selected = inSelection(start);
          const free = cell.state === "free";
          const LockedIcon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off" | "blocked"];

          // ── Visual state ────────────────────────────────────────────────
          // Read-only own-room view fills the booking's slots solid navy.
          // Edit mode fills the *new* selection solid navy (only where free, so
          // conflicts in another room stay visible) and braces the original.
          const original = editable && inOriginal(start);
          // Edit mode fills only *free* selected blocks (so a conflict in another
          // room stays visible); the read-only own-room view fills regardless.
          const solidNavy = selected && (editable ? free : ownRoom && !editing);
          // Brace the slots that should read as the "selection" but aren't solid:
          // the original range in edit mode, or the requested range in view mode.
          const braced = editable ? original : selected && !solidNavy;

          const namedSlot =
            !!cell.label && (cell.state === "busy" || cell.state === "pending") && !solidNavy;
          const braceTone = solidNavy ? "text-text-on-dark/80" : "text-navy";

          const cls = solidNavy
            ? "border-navy bg-navy text-text-on-dark"
            : braced
              ? `border-navy ${STATE_CLS[cell.state]} ring-1 ring-navy`
              : selected && !free
                ? `border-busy-ink ${STATE_CLS[cell.state]} ring-1 ring-busy-ink`
                : `border-transparent ${STATE_CLS[cell.state]}`;

          const interactive = editable && free;
          const Tag = interactive ? "button" : "div";

          return (
            <Tag
              key={start}
              {...(interactive
                ? { type: "button" as const, onClick: () => handleClick(idx) }
                : { role: "gridcell" as const })}
              aria-label={`${start} a ${blockEnd(start)}${
                selected ? (editing ? ", selecionado" : ", pedido") : free ? ", disponível" : cell.state === "busy" ? `, ocupado por ${cell.label}` : cell.state === "pending" ? `, pendente, ${cell.label}` : ", indisponível"
              }`}
              className={`numeral relative flex h-12 items-center justify-center gap-1.5 rounded-md border px-1.5 text-xs font-medium tabular-nums ${cls} ${interactive ? "cursor-pointer transition-colors hover:brightness-[0.97]" : ""}`}
            >
              {(braced || (solidNavy && original)) && (
                <>
                  <span className={`absolute left-1 font-display text-base ${braceTone}`} aria-hidden>{`{`}</span>
                  <span className={`absolute right-1 font-display text-base ${braceTone}`} aria-hidden>{`}`}</span>
                </>
              )}
              {namedSlot ? (
                <span className="flex w-full min-w-0 flex-col items-center justify-center leading-tight">
                  <span className="flex items-center gap-1">
                    {LockedIcon && <LockedIcon size={11} weight="bold" aria-hidden />}
                    {`${start} – ${blockEnd(start)}`}
                  </span>
                  <span className="block w-full truncate text-center text-[0.6rem] font-medium opacity-90">
                    {cell.label}
                  </span>
                </span>
              ) : (
                <>
                  {solidNavy && !original ? (
                    <Check size={12} weight="bold" aria-hidden />
                  ) : (
                    !braced && LockedIcon && <LockedIcon size={12} weight="bold" aria-hidden />
                  )}
                  {`${start} – ${blockEnd(start)}`}
                </>
              )}
            </Tag>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}
