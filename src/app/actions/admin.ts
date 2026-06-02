"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  approveBooking,
  cancelBooking,
  createRecurringBookings,
  createRoom,
  deactivateRoom,
  reactivateRoom,
  rejectBooking,
  renameRoom,
  updateBooking,
  updateSettings,
} from "@/lib/data/repository";
import type { AppSettings } from "@/lib/types";

/**
 * Guard for every admin mutation. Middleware protects the /admin *pages*, but
 * Server Actions can be invoked directly, so we re-check the session here.
 * Offline demo mode (no Supabase) is intentionally open.
 */
async function requireAdmin() {
  if (!isSupabaseConfigured) return;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Não autorizado.");
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath("/"); // public grid reflects approvals/rejections
}

export async function approveAction(id: string, roomId?: string) {
  await requireAdmin();
  const result = await approveBooking(id, roomId);
  revalidateAdmin();
  return result;
}

export async function rejectAction(id: string) {
  await requireAdmin();
  await rejectBooking(id);
  revalidateAdmin();
  return { ok: true };
}

export async function cancelAction(id: string) {
  await requireAdmin();
  await cancelBooking(id);
  revalidateAdmin();
  return { ok: true };
}

export async function updateBookingAction(
  id: string,
  patch: { roomId?: string | null; startTime?: string; endTime?: string },
) {
  await requireAdmin();
  const result = await updateBooking(id, patch);
  revalidateAdmin();
  return result;
}

export async function createRecurringAction(input: {
  roomId: string;
  bookerName: string;
  startTime: string;
  endTime: string;
  dates: string[];
}) {
  await requireAdmin();
  const result = await createRecurringBookings(input);
  revalidateAdmin();
  return result;
}

// ── Rooms ──────────────────────────────────────────────────────────────────--
export async function createRoomAction(name: string) {
  await requireAdmin();
  await createRoom(name.trim());
  revalidatePath("/admin/salas");
  revalidatePath("/");
}

export async function renameRoomAction(id: string, name: string) {
  await requireAdmin();
  await renameRoom(id, name.trim());
  revalidatePath("/admin/salas");
  revalidatePath("/");
}

export async function deactivateRoomAction(id: string) {
  await requireAdmin();
  await deactivateRoom(id);
  revalidatePath("/admin/salas");
  revalidatePath("/");
}

export async function reactivateRoomAction(id: string) {
  await requireAdmin();
  await reactivateRoom(id);
  revalidatePath("/admin/salas");
  revalidatePath("/");
}

// ── Settings ─────────────────────────────────────────────────────────────────
export async function updateSettingsAction(patch: Partial<AppSettings>) {
  await requireAdmin();
  await updateSettings(patch);
  revalidatePath("/admin/definicoes");
  revalidatePath("/");
}
