/**
 * Core booking rules (docs/specification.md). Pure functions, no I/O — the
 * data layer feeds them rows and "now", they decide states and conflicts.
 */
import type { Booking, BookingState, Room, SlotState } from "@/lib/types";
import { fromISODate } from "@/lib/time/dates";
import { rangesOverlap, toMinutes } from "@/lib/time/blocks";

/** States that occupy a slot and forbid new overlapping requests. */
const BLOCKING: BookingState[] = ["pendente", "aprovada"];

/** A booking's start as a local Date (date + startTime). */
function startDateTime(b: Booking): Date {
  const d = fromISODate(b.date);
  const [h, m] = b.startTime.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Lazy auto-expiry: a still-pending booking whose start time has passed is
 * treated as Expirada and stops blocking the slot. This is the portable
 * "compute on read" mechanism (a cron can persist it later).
 */
export function effectiveState(b: Booking, now: Date = new Date()): BookingState {
  if (b.state === "pendente" && startDateTime(b) <= now) {
    return "expirada";
  }
  return b.state;
}

/** Does this booking currently block its slot? */
export function isBlocking(b: Booking, now: Date = new Date()): boolean {
  return BLOCKING.includes(effectiveState(b, now));
}

/**
 * Resolve the grid state for one room at one 30-min block.
 * Precedence: approved (busy) > pending > off (past / out of hours) > free.
 * `isPast` marks blocks earlier than "now" on the current day.
 */
export function slotStateFor(
  bookings: Booking[],
  roomId: string,
  blockStart: string,
  blockEnd: string,
  opts: { isPast: boolean; now?: Date },
): SlotState {
  const now = opts.now ?? new Date();
  let pending = false;

  for (const b of bookings) {
    if (b.roomId !== roomId) continue;
    if (!rangesOverlap(b.startTime, b.endTime, blockStart, blockEnd)) continue;
    const state = effectiveState(b, now);
    if (state === "aprovada") return b.isBlock ? "blocked" : "busy";
    if (state === "pendente") pending = true;
  }

  if (pending) return "pending";
  if (opts.isPast) return "off";
  return "free";
}

/**
 * Rooms that are entirely free for a [start,end) range on a given day — used
 * by the "Qualquer sala disponível" option and by admin assignment.
 */
export function freeRoomsForRange(
  rooms: Room[],
  bookings: Booking[],
  start: string,
  end: string,
  now: Date = new Date(),
): Room[] {
  return rooms.filter((room) => {
    if (!room.active) return false;
    const clash = bookings.some(
      (b) =>
        b.roomId === room.id &&
        isBlocking(b, now) &&
        rangesOverlap(b.startTime, b.endTime, start, end),
    );
    return !clash;
  });
}

/**
 * Validate a new request: it must not overlap an approved or pending booking
 * for the same room (pending acts as a hard lock). For "any room", it must
 * have at least one free room. Returns an error message or null.
 */
export function validateRequest(
  rooms: Room[],
  bookings: Booking[],
  req: { roomId: string | null; anyRoom: boolean; start: string; end: string },
  now: Date = new Date(),
): string | null {
  if (toMinutes(req.end) <= toMinutes(req.start)) {
    return "O horário de fim tem de ser posterior ao de início.";
  }

  if (req.anyRoom) {
    const free = freeRoomsForRange(rooms, bookings, req.start, req.end, now);
    return free.length > 0
      ? null
      : "Não há salas disponíveis para este horário. Escolha outro bloco disponível.";
  }

  if (!req.roomId) return "Selecione uma sala.";
  const clash = bookings.some(
    (b) =>
      b.roomId === req.roomId &&
      isBlocking(b, now) &&
      rangesOverlap(b.startTime, b.endTime, req.start, req.end),
  );
  return clash
    ? "Este horário já está reservado. Escolha outro bloco disponível."
    : null;
}

/** Human label for each lifecycle state (pt-PT). */
export const STATE_LABELS: Record<BookingState, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
  concluida: "Concluída",
  expirada: "Expirada",
};
