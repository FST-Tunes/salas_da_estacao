"use client";

import { useEffect, useState } from "react";
import { CircleNotch, Warning, Check, X } from "@phosphor-icons/react";
import type { Booking, SlotState } from "@/lib/types";
import { getDayAvailability, type DayAvailability, type SlotCell } from "@/app/actions/availability";
import { blockEnd, toMinutes } from "@/lib/time/blocks";
import { STATE_CLS, LOCKED_ICON } from "@/components/schedule/slotVisuals";
import { Legend } from "@/components/schedule/Legend";

interface Props {
  booking: Pick<Booking, "date" | "startTime" | "endTime" | "roomId">;
  /** Room to show, driven by the assignment dropdown in the actions below. */
  selectedRoom: string;
}

/**
 * Read-only slot view for a single booking's day, shown when an admin expands a
 * request card. The requested time range is marked as the "user selection":
 *  - in the booking's own room, filled navy (the wizard's selection visual);
 *  - in any other room, the room's real free/busy state shows through, hugged by
 *    the brace motif so the admin can judge whether the request fits there.
 * The room is chosen via the assignment dropdown in the actions row, so for
 * "qualquer sala" requests (roomId === null) picking a room there immediately
 * shows that room's availability for the same day.
 */
export function BookingSlotPreview({ booking, selectedRoom }: Props) {
  const [avail, setAvail] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getDayAvailability(booking.date)
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
  }, [booking.date]);

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

  // Fit check (only meaningful for a room that isn't the one already holding the
  // booking): are all the requested blocks free in this room?
  const selectionFree = blocks.every(
    (start, idx) => !inSelection(start) || cells[idx]?.state === "free",
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-navy">
          {room?.name ?? "Sala"} · {booking.startTime}–{booking.endTime}
        </span>

        {!ownRoom &&
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

      <div
        role="grid"
        aria-label={`Horários de ${room?.name ?? "sala"} em ${booking.date}`}
        className="grid grid-flow-col grid-rows-[repeat(16,minmax(0,1fr))] gap-2 lg:grid-rows-[repeat(8,minmax(0,1fr))]"
      >
        {blocks.map((start, idx) => {
          const cell = cells[idx] ?? { state: "off" as SlotState, label: null };
          const selected = inSelection(start);
          const free = cell.state === "free";
          const LockedIcon = free ? null : LOCKED_ICON[cell.state as "pending" | "busy" | "off"];
          // Booker name on the first block of an occupied run — shown to the admin
          // too, except on the solid-navy "own room" selection (it's this booking).
          const namedSlot =
            !!cell.label && (cell.state === "busy" || cell.state === "pending") && !(selected && ownRoom);

          // Own room → solid navy selection (matches the booking wizard).
          // Other room → keep real state, hug with a navy brace ring so the
          // underlying free/busy stays readable.
          const cls = selected
            ? ownRoom
              ? "border-navy bg-navy text-text-on-dark"
              : `border-navy ${STATE_CLS[cell.state]} ring-1 ring-navy`
            : `border-transparent ${STATE_CLS[cell.state]}`;

          return (
            <div
              key={start}
              role="gridcell"
              aria-label={`${start} a ${blockEnd(start)}${
                selected ? ", pedido" : free ? ", disponível" : cell.state === "busy" ? `, ocupado por ${cell.label}` : cell.state === "pending" ? `, pendente — ${cell.label}` : ", indisponível"
              }`}
              className={`numeral relative flex h-12 items-center justify-center gap-1.5 rounded-md border px-1.5 text-xs font-medium tabular-nums ${cls}`}
            >
              {selected && !ownRoom && (
                <>
                  <span className="absolute left-1 font-display text-base text-navy" aria-hidden>{`{`}</span>
                  <span className="absolute right-1 font-display text-base text-navy" aria-hidden>{`}`}</span>
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
                  {selected && ownRoom ? (
                    <Check size={12} weight="bold" aria-hidden />
                  ) : (
                    LockedIcon && <LockedIcon size={12} weight="bold" aria-hidden />
                  )}
                  {`${start} – ${blockEnd(start)}`}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}
