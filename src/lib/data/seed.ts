/**
 * In-memory seed data for OFFLINE DEMO mode (no Supabase configured). Lets the
 * whole UI — public and admin — be previewed and exercised without a database.
 * State is module-level and mutable, so admin actions visibly take effect for
 * the duration of the dev server process (not persisted across restarts).
 */
import type { AppSettings, Booking, Room } from "@/lib/types";
import { todayISO, addDays } from "@/lib/time/dates";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const seedSettings: AppSettings = {
  openTime: "08:00",
  closeTime: "00:00",
  maxAdvanceDays: 30,
};

export const seedRooms: Room[] = [
  { id: "room-1", name: "Sala 1", position: 1, active: true },
  { id: "room-2", name: "Sala 2", position: 2, active: true },
  { id: "room-3", name: "Sala 3", position: 3, active: true },
  { id: "room-4", name: "Sala 4", position: 4, active: true },
  { id: "room-5", name: "Sala 5", position: 5, active: true },
  { id: "room-6", name: "Sala 6", position: 6, active: true },
  { id: "room-7", name: "Sala 7", position: 7, active: true },
  { id: "room-8", name: "Sala 8", position: 8, active: true },
  { id: "room-9", name: "Sala Grande", position: 9, active: true },
];

const today = todayISO();
const tomorrow = addDays(today, 1);

export const seedBookings: Booking[] = [
  {
    id: uid("bk"),
    roomId: "room-1",
    bookerName: "Mariana Vasconcelos",
    phone: "+351 912 884 017",
    date: today,
    startTime: "18:00",
    endTime: "19:30",
    state: "aprovada",
    anyRoom: false,
    recurrenceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("bk"),
    roomId: "room-3",
    bookerName: "Quarteto de Cordas do Minho",
    phone: null,
    date: today,
    startTime: "20:00",
    endTime: "22:00",
    state: "aprovada",
    anyRoom: false,
    recurrenceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("bk"),
    roomId: "room-2",
    bookerName: "Tiago Cerqueira",
    phone: "+351 936 201 559",
    date: today,
    startTime: "19:00",
    endTime: "20:00",
    state: "pendente",
    anyRoom: false,
    recurrenceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("bk"),
    roomId: "room-9",
    bookerName: "Banda Juvenil EMM",
    phone: null,
    date: today,
    startTime: "21:00",
    endTime: "23:00",
    state: "aprovada",
    anyRoom: false,
    recurrenceId: "rec-banda",
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("bk"),
    roomId: null,
    bookerName: "Inês Portela",
    phone: "+351 968 743 110",
    date: tomorrow,
    startTime: "17:30",
    endTime: "18:30",
    state: "pendente",
    anyRoom: true,
    recurrenceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("bk"),
    roomId: "room-5",
    bookerName: "Duarte Lebre",
    phone: null,
    date: tomorrow,
    startTime: "10:00",
    endTime: "11:30",
    state: "aprovada",
    anyRoom: false,
    recurrenceId: null,
    createdAt: new Date().toISOString(),
  },
];

/** Mutable demo store shared by the repository functions in offline mode. */
export const demoStore = {
  rooms: [...seedRooms],
  bookings: [...seedBookings],
  settings: { ...seedSettings },
  nextId: () => uid("bk"),
  nextRoomId: () => uid("room"),
};
