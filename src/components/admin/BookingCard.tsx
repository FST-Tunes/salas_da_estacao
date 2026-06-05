"use client";

import { useState } from "react";
import { User, Phone, Door, Stack, ArrowsClockwise, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import type { Booking, BookingState } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Overlay } from "@/components/ui/Overlay";
import { BookingActions } from "./BookingActions";
import { BookingSlotPreview } from "./BookingSlotPreview";
import { formatRange } from "@/lib/time/blocks";

interface Props {
  booking: Booking;
  effective: BookingState;
  roomName: string | null;
  activeRooms: { id: string; name: string }[];
  blocks: string[];
  showActions?: boolean;
  /** When true, clicking the card header reveals the day's slot view for the
   *  booking's room (and lets the admin switch rooms). Used on the dashboard. */
  expandable?: boolean;
}

/**
 * Admin booking row. Shows the phone number (admin-only — never rendered in
 * public surfaces). Embeds the action controls for actionable states, and an
 * optional click-to-expand slot preview.
 */
export function BookingCard({
  booking,
  effective,
  roomName,
  activeRooms,
  blocks,
  showActions = true,
  expandable = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  // Shared between the assignment dropdown (in the actions) and the slot
  // preview, so picking a room there shows that room's availability.
  const [selectedRoom, setSelectedRoom] = useState(booking.roomId ?? activeRooms[0]?.id ?? "");

  const info = (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="numeral text-base text-navy">
          {formatRange(booking.startTime, booking.endTime)}
        </span>
        <StatusBadge state={effective} size="sm" />
        {booking.recurrenceId && (
          <span className="inline-flex items-center gap-1 text-xs text-gold" title="Reserva recorrente">
            <ArrowsClockwise size={12} weight="bold" aria-hidden /> Recorrente
          </span>
        )}
        {expandable && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-navy-60">
            <CalendarBlank size={13} weight="bold" aria-hidden />
            <span className="hidden sm:inline">Ver horário</span>
            <CaretRight size={12} weight="bold" aria-hidden />
          </span>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-sm text-navy">
        {booking.roomId ? (
          <Door size={14} weight="bold" className="text-navy-60" aria-hidden />
        ) : (
          <Stack size={14} weight="bold" className="text-navy-60" aria-hidden />
        )}
        {roomName ?? "Qualquer sala disponível"}
      </p>
      <p className="flex items-center gap-1.5 text-sm text-text-muted">
        <User size={14} weight="bold" aria-hidden />
        {booking.bookerName}
      </p>
      {booking.phone && (
        <p className="flex items-center gap-1.5 text-sm text-text-muted">
          <Phone size={14} weight="bold" aria-hidden />
          {booking.phone}
          <span className="text-xs text-navy-30">· apenas para notificações</span>
        </p>
      )}
    </div>
  );

  return (
    <li className="rounded-md border border-hairline bg-surface-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {expandable ? (
          <div
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            onClick={() => setExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(true);
              }
            }}
            className="-m-1 min-w-0 flex-1 cursor-pointer rounded-md p-1 transition-colors hover:bg-navy/5"
          >
            {info}
          </div>
        ) : (
          info
        )}
      </div>

      {expandable && (
        <Overlay
          open={expanded}
          onClose={() => setExpanded(false)}
          title={`Horário · ${formatRange(booking.startTime, booking.endTime)}`}
          icon={<CalendarBlank size={18} weight="bold" className="text-gold" aria-hidden />}
          size="lg"
        >
          <BookingSlotPreview booking={booking} selectedRoom={selectedRoom} />
        </Overlay>
      )}

      {showActions && (effective === "pendente" || effective === "aprovada") && (
        <BookingActions
          booking={booking}
          effective={effective}
          rooms={activeRooms}
          blocks={blocks}
          assignRoom={selectedRoom}
          onAssignRoomChange={setSelectedRoom}
        />
      )}
    </li>
  );
}
