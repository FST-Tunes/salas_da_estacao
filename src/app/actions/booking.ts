"use server";

import { revalidatePath } from "next/cache";
import { createBookingRequest } from "@/lib/data/repository";

export interface SubmitBookingInput {
  bookerName: string;
  phone: string | null;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string | null;
  anyRoom: boolean;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/** Public booking submission. Enters as Pendente; never auto-approved. */
export async function submitBooking(input: SubmitBookingInput): Promise<SubmitResult> {
  const name = input.bookerName.trim();
  if (name.length < 2) return { ok: false, error: "Indique o seu nome." };
  if (!input.date || !input.startTime || !input.endTime) {
    return { ok: false, error: "Selecione um horário no quadro." };
  }

  const phone = input.phone?.trim() ? input.phone.trim() : null;

  const result = await createBookingRequest({
    bookerName: name,
    phone,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    roomId: input.anyRoom ? null : input.roomId,
    anyRoom: input.anyRoom,
  });

  if (result.ok) revalidatePath("/");
  return result;
}
