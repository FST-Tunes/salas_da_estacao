import "server-only";
/**
 * Booking-decision notifications. Called inline from the admin approve/reject
 * server actions, AFTER the state change has been persisted.
 *
 * Invariants:
 *   - Only notify when the booker provided a phone number (spec → Notificações).
 *   - Never throw: a notification failure must not break the admin action, so
 *     everything here is wrapped and errors are only logged.
 */
import { getBookingById, getRooms } from "@/lib/data/repository";
import { bookingApprovedMessage, bookingRejectedMessage } from "./messages";
import { getNotifyProvider, normalizePhone } from "./provider";

export type BookingDecision = "aprovada" | "rejeitada";

export async function notifyBookingDecision(
  bookingId: string,
  decision: BookingDecision,
): Promise<void> {
  try {
    const booking = await getBookingById(bookingId);
    if (!booking || !booking.phone) return; // no phone → no notification

    const rooms = await getRooms(true); // include inactive so the name still resolves
    const roomName = rooms.find((r) => r.id === booking.roomId)?.name ?? null;

    const body =
      decision === "aprovada"
        ? bookingApprovedMessage(booking, roomName ?? "Sala")
        : bookingRejectedMessage(booking, roomName);

    const provider = getNotifyProvider();
    const result = await provider.send({ to: normalizePhone(booking.phone), body });
    if (!result.ok) {
      console.error(`[notify] envio falhou (${result.provider}): ${result.error}`);
    }
  } catch (err) {
    console.error("[notify] erro inesperado ao notificar a decisão:", err);
  }
}
