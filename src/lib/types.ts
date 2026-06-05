/**
 * Domain types shared across the app. These mirror the database schema in
 * supabase/schema.sql but are intentionally framework-agnostic so the data
 * layer can be swapped (Supabase ↔ seed) behind a thin boundary.
 */

/** Booking lifecycle states (docs/specification.md → Estados da Reserva). */
export type BookingState =
  | "pendente"
  | "aprovada"
  | "rejeitada"
  | "cancelada"
  | "concluida"
  | "expirada";

/**
 * States the schedule grid renders per 30-min block. "blocked" is an admin
 * one-off block (room/day made unavailable) — distinct from "off" (past /
 * outside operating hours) and "busy" (a real approved booking).
 */
export type SlotState = "free" | "pending" | "busy" | "off" | "blocked";

export interface Room {
  id: string;
  name: string;
  /** Lower = listed first. The big downstairs room sorts last by convention. */
  position: number;
  /** Soft-removed rooms stay for history but are hidden from new bookings. */
  active: boolean;
}

export interface Booking {
  id: string;
  /** Null when the request was "Qualquer sala disponível" and not yet assigned. */
  roomId: string | null;
  bookerName: string;
  /** Optional. NEVER exposed in public views — server/RLS enforced. */
  phone: string | null;
  /** Calendar day, ISO "YYYY-MM-DD" in the venue's local timezone. */
  date: string;
  /** Inclusive start, ISO time "HH:MM" aligned to a 30-min block. */
  startTime: string;
  /** Exclusive end, ISO time "HH:MM" aligned to a 30-min block. */
  endTime: string;
  state: BookingState;
  /** True when the request asked for any available room. */
  anyRoom: boolean;
  /**
   * True for an admin one-off block (not a real booking): the slot is made
   * unavailable. Stored as an `aprovada` row so it reuses the overlap lock, but
   * rendered as "blocked" and labelled with `bookerName` (the block reason).
   */
  isBlock: boolean;
  recurrenceId: string | null;
  createdAt: string;
}

/**
 * Public-safe projection of a booking. The phone field does not exist here by
 * construction, so it can never leak into a public view (defence in depth on
 * top of the DB view + RLS).
 */
export type PublicBooking = Omit<Booking, "phone">;

export interface AppSettings {
  /** Operating hours, "HH:MM". End may be "24:00" to mean midnight. */
  openTime: string;
  closeTime: string;
  /** How far ahead the public may request a booking. */
  maxAdvanceDays: number;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday … 6 = Saturday
