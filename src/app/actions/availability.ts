"use server";

/**
 * Public availability for a single day, used by the booking wizard. Reuses the
 * server-side grid model (which is built from phone-free PublicBookings) so the
 * wizard never touches Supabase directly and can never leak the phone field.
 */
import type { SlotState } from "@/lib/types";
import { getRooms, getSettings, getPublicBookingsForDate } from "@/lib/data/repository";
import { buildGridModel } from "@/lib/grid";
import { todayISO, addDays } from "@/lib/time/dates";

/** One 30-min block for a single column (room or the aggregate). */
export interface SlotCell {
  state: SlotState;
  /** Booker name on the first block of a run (public-safe); null otherwise. */
  label: string | null;
}

export interface RoomAvailability {
  id: string;
  name: string;
  /** How many 30-min blocks are free this day. 0 → "Esgotada". */
  freeBlocks: number;
  /** Per-block cells, aligned 1:1 with `blocks`. */
  cells: SlotCell[];
}

export interface DayAvailability {
  date: string;
  /** Ordered "HH:MM" block starts for the operating window. */
  blocks: string[];
  rooms: RoomAvailability[];
  /** Aggregate "Qualquer sala" column: free if any room is free in the block. */
  anyCells: SlotCell[];
  /** How many blocks have at least one free room (for the "any room" card). */
  anyFreeBlocks: number;
}

/**
 * Clamp + fetch the availability model for a day. Date is validated server-side.
 * `excludeBookingId` drops one booking from the calculation — used by the admin
 * edit/move preview so a booking's own slots read as free to itself (the admin
 * can see where it can move/extend without colliding with its current position).
 */
export async function getDayAvailability(
  dateInput: string,
  excludeBookingId?: string,
): Promise<DayAvailability> {
  const today = todayISO();
  const [settings, rooms] = await Promise.all([getSettings(), getRooms()]);
  const maxDate = addDays(today, settings.maxAdvanceDays);

  let date = /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : today;
  if (date < today) date = today;
  if (date > maxDate) date = maxDate;

  const allBookings = await getPublicBookingsForDate(date);
  const bookings = excludeBookingId
    ? allBookings.filter((b) => b.id !== excludeBookingId)
    : allBookings;
  const model = buildGridModel(rooms, bookings, settings, date);

  const roomAvail: RoomAvailability[] = rooms.map((room) => {
    const cells = model.roomCells[room.id] ?? [];
    return {
      id: room.id,
      name: room.name,
      freeBlocks: cells.filter((c) => c.state === "free").length,
      cells,
    };
  });

  const anyCells: SlotCell[] = model.anyCells.map((c) => ({
    state: c.state,
    label: c.freeCount > 0 ? `${c.freeCount} ${c.freeCount === 1 ? "livre" : "livres"}` : null,
  }));

  return {
    date,
    blocks: model.blocks,
    rooms: roomAvail,
    anyCells,
    anyFreeBlocks: anyCells.filter((c) => c.state === "free").length,
  };
}
