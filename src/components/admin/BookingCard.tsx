import { Clock, User, Phone, Door, Stack, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import type { Booking, BookingState } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingActions } from "./BookingActions";
import { formatRange } from "@/lib/time/blocks";

interface Props {
  booking: Booking;
  effective: BookingState;
  roomName: string | null;
  activeRooms: { id: string; name: string }[];
  blocks: string[];
  showActions?: boolean;
}

/**
 * Admin booking row. Shows the phone number (admin-only — never rendered in
 * public surfaces). Embeds the action controls for actionable states.
 */
export function BookingCard({ booking, effective, roomName, activeRooms, blocks, showActions = true }: Props) {
  return (
    <li className="rounded-md border border-hairline bg-surface-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
      </div>

      {showActions && (effective === "pendente" || effective === "aprovada") && (
        <BookingActions booking={booking} effective={effective} rooms={activeRooms} blocks={blocks} />
      )}
    </li>
  );
}
