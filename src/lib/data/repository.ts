import "server-only";
/**
 * Data-access boundary. Every read/write goes through here so the rest of the
 * app never imports Supabase directly. When Supabase is unconfigured we serve
 * (and mutate) the in-memory seed, keeping the platform dependency isolated.
 */
import type {
  AppSettings,
  Booking,
  BookingState,
  PublicBooking,
  Room,
} from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { effectiveState, freeRoomsForRange, validateRequest } from "@/lib/domain/booking";
import { demoStore } from "./seed";

const hhmm = (t: string) => t.slice(0, 5);

// ── Row mappers ──────────────────────────────────────────────────────────────
type RoomRow = { id: string; name: string; position: number; active: boolean };
function mapRoom(r: RoomRow): Room {
  return { id: r.id, name: r.name, position: r.position, active: r.active };
}

type BookingRow = {
  id: string;
  room_id: string | null;
  booker_name: string;
  phone?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  state: BookingState;
  any_room: boolean;
  recurrence_id: string | null;
  created_at: string;
};
function mapBooking(b: BookingRow): Booking {
  return {
    id: b.id,
    roomId: b.room_id,
    bookerName: b.booker_name,
    phone: b.phone ?? null,
    date: b.date,
    startTime: hhmm(b.start_time),
    endTime: hhmm(b.end_time),
    state: b.state,
    anyRoom: b.any_room,
    recurrenceId: b.recurrence_id,
    createdAt: b.created_at,
  };
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  if (!isSupabaseConfigured) return { ...demoStore.settings };
  const sb = await createSupabaseServerClient();
  const { data } = await sb.from("app_settings").select("*").single();
  if (!data) return { openTime: "08:00", closeTime: "00:00", maxAdvanceDays: 30 };
  return {
    openTime: hhmm(data.open_time),
    closeTime: hhmm(data.close_time),
    maxAdvanceDays: data.max_advance_days,
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  if (!isSupabaseConfigured) {
    demoStore.settings = { ...demoStore.settings, ...patch };
    return;
  }
  const sb = createSupabaseAdminClient();
  await sb
    .from("app_settings")
    .update({
      ...(patch.openTime ? { open_time: patch.openTime } : {}),
      ...(patch.closeTime ? { close_time: patch.closeTime } : {}),
      ...(patch.maxAdvanceDays ? { max_advance_days: patch.maxAdvanceDays } : {}),
    })
    .eq("id", true);
}

// ── Rooms ───────────────────────────────────────────────────────────────────
export async function getRooms(includeInactive = false): Promise<Room[]> {
  if (!isSupabaseConfigured) {
    return demoStore.rooms
      .filter((r) => includeInactive || r.active)
      .sort((a, b) => a.position - b.position);
  }
  const sb = await createSupabaseServerClient();
  let query = sb.from("rooms").select("*").order("position");
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return (data ?? []).map(mapRoom);
}

export async function createRoom(name: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const position = Math.max(0, ...demoStore.rooms.map((r) => r.position)) + 1;
    demoStore.rooms.push({ id: demoStore.nextRoomId(), name, position, active: true });
    return;
  }
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("rooms").select("position").order("position", { ascending: false }).limit(1);
  const position = (data?.[0]?.position ?? 0) + 1;
  await sb.from("rooms").insert({ name, position });
}

export async function renameRoom(id: string, name: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const room = demoStore.rooms.find((r) => r.id === id);
    if (room) room.name = name;
    return;
  }
  const sb = createSupabaseAdminClient();
  await sb.from("rooms").update({ name }).eq("id", id);
}

/** Soft-remove: history is permanent, so we deactivate rather than delete. */
export async function deactivateRoom(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const room = demoStore.rooms.find((r) => r.id === id);
    if (room) room.active = false;
    return;
  }
  const sb = createSupabaseAdminClient();
  await sb.from("rooms").update({ active: false }).eq("id", id);
}

export async function reactivateRoom(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const room = demoStore.rooms.find((r) => r.id === id);
    if (room) room.active = true;
    return;
  }
  const sb = createSupabaseAdminClient();
  await sb.from("rooms").update({ active: true }).eq("id", id);
}

// ── Bookings: public reads (NO phone) ─────────────────────────────────────────
export async function getPublicBookingsForDate(date: string): Promise<PublicBooking[]> {
  if (!isSupabaseConfigured) {
    return demoStore.bookings
      .filter((b) => b.date === date)
      .map(({ phone: _phone, ...safe }) => safe);
  }
  const sb = await createSupabaseServerClient();
  const { data } = await sb.from("public_bookings").select("*").eq("date", date);
  return (data ?? []).map(mapBooking).map(({ phone: _phone, ...safe }) => safe);
}

// ── Bookings: admin reads (WITH phone) ────────────────────────────────────────
export async function getBookingsForDate(date: string): Promise<Booking[]> {
  if (!isSupabaseConfigured) {
    return demoStore.bookings.filter((b) => b.date === date);
  }
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("bookings").select("*").eq("date", date);
  return (data ?? []).map(mapBooking);
}

/** Admin read: every booking (all states) whose date is in [from, to]. */
export async function getBookingsInRange(from: string, to: string): Promise<Booking[]> {
  if (!isSupabaseConfigured) {
    return demoStore.bookings.filter((b) => b.date >= from && b.date <= to);
  }
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("bookings")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("start_time");
  return (data ?? []).map(mapBooking);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured) {
    return demoStore.bookings.find((b) => b.id === id) ?? null;
  }
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("bookings").select("*").eq("id", id).single();
  return data ? mapBooking(data) : null;
}

export async function getAllBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured) return [...demoStore.bookings];
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("bookings").select("*").order("date").order("start_time");
  return (data ?? []).map(mapBooking);
}

// ── Bookings: writes ──────────────────────────────────────────────────────────
export interface NewBookingInput {
  bookerName: string;
  phone: string | null;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string | null;
  anyRoom: boolean;
}

export async function createBookingRequest(
  input: NewBookingInput,
): Promise<{ ok: boolean; error?: string }> {
  // Server-side overlap validation (the DB exclusion constraint is the final
  // guard, but we pre-check for a friendly message and to cover "any room").
  const rooms = await getRooms();
  const sameDay = isSupabaseConfigured
    ? (await getPublicBookingsForDate(input.date)).map((b) => ({ ...b, phone: null }) as Booking)
    : demoStore.bookings.filter((b) => b.date === input.date);

  const error = validateRequest(rooms, sameDay, {
    roomId: input.roomId,
    anyRoom: input.anyRoom,
    start: input.startTime,
    end: input.endTime,
  });
  if (error) return { ok: false, error };

  if (!isSupabaseConfigured) {
    demoStore.bookings.push({
      id: demoStore.nextId(),
      roomId: input.anyRoom ? null : input.roomId,
      bookerName: input.bookerName,
      phone: input.phone,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      state: "pendente",
      anyRoom: input.anyRoom,
      recurrenceId: null,
      createdAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  const sb = await createSupabaseServerClient();
  const { error: dbError } = await sb.from("bookings").insert({
    room_id: input.anyRoom ? null : input.roomId,
    booker_name: input.bookerName,
    phone: input.phone,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    state: "pendente",
    any_room: input.anyRoom,
  });
  if (dbError) {
    // 23P01 = exclusion_violation → the slot was taken between check and insert.
    if (dbError.code === "23P01") {
      return { ok: false, error: "Este horário já está reservado. Escolha outro bloco disponível." };
    }
    return { ok: false, error: "Não foi possível submeter o pedido. Tente novamente." };
  }
  return { ok: true };
}

async function setState(id: string, state: BookingState): Promise<void> {
  if (!isSupabaseConfigured) {
    const b = demoStore.bookings.find((x) => x.id === id);
    if (b) b.state = state;
    return;
  }
  const sb = createSupabaseAdminClient();
  await sb.from("bookings").update({ state }).eq("id", id);
}

export interface BookingPatch {
  roomId?: string | null;
  startTime?: string;
  endTime?: string;
}

/** Approve, optionally assigning a room (required for "any room" requests). */
export async function approveBooking(id: string, roomId?: string): Promise<{ ok: boolean; error?: string }> {
  const booking = await getBookingById(id);
  if (!booking) return { ok: false, error: "Reserva não encontrada." };
  const targetRoom = roomId ?? booking.roomId;
  if (!targetRoom) return { ok: false, error: "Atribua uma sala antes de aprovar." };

  if (!isSupabaseConfigured) {
    const b = demoStore.bookings.find((x) => x.id === id)!;
    b.roomId = targetRoom;
    b.anyRoom = false;
    b.state = "aprovada";
    return { ok: true };
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("bookings")
    .update({ state: "aprovada", room_id: targetRoom, any_room: false })
    .eq("id", id);
  if (error?.code === "23P01") {
    return { ok: false, error: "Conflito de horário nessa sala." };
  }
  return error ? { ok: false, error: "Não foi possível aprovar." } : { ok: true };
}

export const rejectBooking = (id: string) => setState(id, "rejeitada");
export const cancelBooking = (id: string) => setState(id, "cancelada");

/** Move room / change time / shorten duration. */
export async function updateBooking(id: string, patch: BookingPatch): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const b = demoStore.bookings.find((x) => x.id === id);
    if (!b) return { ok: false, error: "Reserva não encontrada." };
    if (patch.roomId !== undefined) b.roomId = patch.roomId;
    if (patch.startTime) b.startTime = patch.startTime;
    if (patch.endTime) b.endTime = patch.endTime;
    return { ok: true };
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("bookings")
    .update({
      ...(patch.roomId !== undefined ? { room_id: patch.roomId } : {}),
      ...(patch.startTime ? { start_time: patch.startTime } : {}),
      ...(patch.endTime ? { end_time: patch.endTime } : {}),
    })
    .eq("id", id);
  if (error?.code === "23P01") return { ok: false, error: "Conflito de horário nessa sala." };
  return error ? { ok: false, error: "Não foi possível atualizar." } : { ok: true };
}

/** Admin-only recurring bookings, e.g. every Tuesday 20:00–22:00. */
export async function createRecurringBookings(input: {
  roomId: string;
  bookerName: string;
  startTime: string;
  endTime: string;
  dates: string[];
}): Promise<{ created: number }> {
  const recurrenceId = `rec-${Math.random().toString(36).slice(2, 10)}`;
  let created = 0;
  for (const date of input.dates) {
    if (!isSupabaseConfigured) {
      demoStore.bookings.push({
        id: demoStore.nextId(),
        roomId: input.roomId,
        bookerName: input.bookerName,
        phone: null,
        date,
        startTime: input.startTime,
        endTime: input.endTime,
        state: "aprovada",
        anyRoom: false,
        recurrenceId,
        createdAt: new Date().toISOString(),
      });
      created++;
    } else {
      const sb = createSupabaseAdminClient();
      const { error } = await sb.from("bookings").insert({
        room_id: input.roomId,
        booker_name: input.bookerName,
        date,
        start_time: input.startTime,
        end_time: input.endTime,
        state: "aprovada",
        any_room: false,
        recurrence_id: recurrenceId,
      });
      if (!error) created++;
    }
  }
  return { created };
}

// ── Derived admin views ───────────────────────────────────────────────────────
export async function getDashboardData(date: string) {
  const [rooms, bookingsToday] = await Promise.all([
    getRooms(),
    getBookingsForDate(date),
  ]);
  const now = new Date();
  const all = await getAllBookings();

  const pending = all.filter((b) => effectiveState(b, now) === "pendente");
  const expired = all.filter((b) => effectiveState(b, now) === "expirada");
  return { rooms, bookingsToday, pending, expired };
}

export { effectiveState, freeRoomsForRange };
