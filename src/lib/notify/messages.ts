/**
 * Notification copy (pt-PT). Kept separate from delivery so the wording can be
 * tuned without touching provider logic. Messages are intentionally short so a
 * single SMS segment usually suffices.
 */
import type { Booking } from "@/lib/types";

const VENUE = "Estação Musical de Monção";

/** ISO "YYYY-MM-DD" → "DD/MM/YYYY" (Portuguese date format). */
function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function slot(b: Booking): string {
  return `${formatDatePt(b.date)}, ${b.startTime}–${b.endTime}`;
}

export function bookingApprovedMessage(b: Booking, roomName: string): string {
  return [
    `Olá ${b.bookerName}, a sua reserva foi APROVADA.`,
    `Sala: ${roomName}`,
    `Quando: ${slot(b)}`,
    `— Salas da Estação · ${VENUE}`,
  ].join("\n");
}

export function bookingRejectedMessage(b: Booking, roomName: string | null): string {
  return [
    `Olá ${b.bookerName}, lamentamos: a sua reserva foi REJEITADA.`,
    roomName ? `Sala: ${roomName}` : null,
    `Quando: ${slot(b)}`,
    `Pode submeter um novo pedido noutro horário.`,
    `— Salas da Estação · ${VENUE}`,
  ]
    .filter(Boolean)
    .join("\n");
}
