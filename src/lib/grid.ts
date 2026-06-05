/**
 * Builds the schedule-grid view model on the server: for each room and each
 * 30-min block, the slot state and an optional label (booker name on the first
 * block of a run). Also computes the aggregate "Qualquer sala" column.
 */
import type { Booking, PublicBooking, Room, SlotState } from "@/lib/types";
import { blockStarts, blockEnd, rangesOverlap, toMinutes } from "@/lib/time/blocks";
import { effectiveState, slotStateFor } from "@/lib/domain/booking";
import { todayISO } from "@/lib/time/dates";

export interface GridCell {
  state: SlotState;
  /** Booker name, set only on the first block of a booking run. */
  label: string | null;
}

export interface AnyCell {
  state: SlotState;
  freeCount: number;
}

export interface GridModel {
  blocks: string[];
  /** roomId → cell per block (same order/length as `blocks`). */
  roomCells: Record<string, GridCell[]>;
  /** Aggregate availability across all active rooms, per block. */
  anyCells: AnyCell[];
}

export function buildGridModel(
  rooms: Room[],
  bookings: (Booking | PublicBooking)[],
  settings: { openTime: string; closeTime: string },
  date: string,
  now: Date = new Date(),
): GridModel {
  const blocks = blockStarts(settings.openTime, settings.closeTime);
  // Treat phone-less PublicBookings as Bookings (phone unused by domain logic).
  const bks = bookings as Booking[];

  const isToday = date === todayISO();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isPastBlock = (start: string) => isToday && toMinutes(blockEnd(start)) <= nowMinutes;

  const roomCells: Record<string, GridCell[]> = {};
  for (const room of rooms) {
    roomCells[room.id] = blocks.map((start) => {
      const end = blockEnd(start);
      const state = slotStateFor(bks, room.id, start, end, { isPast: isPastBlock(start), now });
      let label: string | null = null;
      if (state === "busy" || state === "pending" || state === "blocked") {
        const owner = bks.find(
          (b) =>
            b.roomId === room.id &&
            (effectiveState(b, now) === "aprovada" || effectiveState(b, now) === "pendente") &&
            b.startTime === start,
        );
        label = owner ? owner.bookerName : null;
      }
      return { state, label };
    });
  }

  const anyCells: AnyCell[] = blocks.map((start) => {
    const end = blockEnd(start);
    if (isPastBlock(start)) return { state: "off", freeCount: 0 };
    let freeCount = 0;
    let anyPending = false;
    for (const room of rooms) {
      if (!room.active) continue;
      const s = slotStateFor(bks, room.id, start, end, { isPast: false, now });
      if (s === "free") freeCount++;
      else if (s === "pending") anyPending = true;
    }
    const state: SlotState = freeCount > 0 ? "free" : anyPending ? "pending" : "busy";
    return { state, freeCount };
  });

  return { blocks, roomCells, anyCells };
}

export interface RoomWeekCell {
  state: SlotState;
  /** Booker / event name on the first block of a run; null otherwise. */
  label: string | null;
  /** True when the occupying booking belongs to a recurring series. */
  recurring: boolean;
}

export interface RoomWeekDay {
  date: string;
  cells: RoomWeekCell[];
}

export interface RoomWeekModel {
  blocks: string[];
  days: RoomWeekDay[];
}

/**
 * Weekly schedule for a single room: for each day in `weekDates` and each
 * 30-min block, the slot state plus — on the first block of a run — the booker
 * name and whether it is part of a recurring series. Reuses the same domain
 * primitives as the daily grid so the two views never drift.
 */
export function buildRoomWeekModel(
  roomId: string,
  bookings: Booking[],
  settings: { openTime: string; closeTime: string },
  weekDates: string[],
  now: Date = new Date(),
): RoomWeekModel {
  const blocks = blockStarts(settings.openTime, settings.closeTime);
  const today = todayISO();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const days: RoomWeekDay[] = weekDates.map((date) => {
    const dayBookings = bookings.filter((b) => b.date === date && b.roomId === roomId);
    const isToday = date === today;
    const isPastDay = date < today;

    const cells: RoomWeekCell[] = blocks.map((start) => {
      const end = blockEnd(start);
      const isPast = isPastDay || (isToday && toMinutes(end) <= nowMinutes);
      const state = slotStateFor(dayBookings, roomId, start, end, { isPast, now });
      let label: string | null = null;
      let recurring = false;
      if (state === "busy" || state === "pending" || state === "blocked") {
        const owner = dayBookings.find(
          (b) =>
            (effectiveState(b, now) === "aprovada" || effectiveState(b, now) === "pendente") &&
            b.startTime === start,
        );
        if (owner) {
          label = owner.bookerName;
          recurring = owner.recurrenceId !== null;
        }
      }
      return { state, label, recurring };
    });

    return { date, cells };
  });

  return { blocks, days };
}
