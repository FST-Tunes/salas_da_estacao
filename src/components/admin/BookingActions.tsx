"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, PencilSimple, Prohibit, FloppyDisk, Warning } from "@phosphor-icons/react";
import type { Booking, BookingState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Field, Select } from "@/components/ui/Field";
import { blockEnd, toMinutes } from "@/lib/time/blocks";
import {
  approveAction,
  rejectAction,
  cancelAction,
  updateBookingAction,
} from "@/app/actions/admin";

interface Props {
  booking: Booking;
  effective: BookingState;
  rooms: { id: string; name: string }[];
  blocks: string[];
  /** Optionally lift the selected room so a sibling (the slot preview) can react
   *  to it. When omitted, the component keeps its own room state. */
  assignRoom?: string;
  onAssignRoomChange?: (id: string) => void;
}

export function BookingActions({
  booking,
  effective,
  rooms,
  blocks,
  assignRoom: controlledRoom,
  onAssignRoomChange,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [localRoom, setLocalRoom] = useState(booking.roomId ?? rooms[0]?.id ?? "");
  const assignRoom = controlledRoom ?? localRoom;
  const setAssignRoom = onAssignRoomChange ?? setLocalRoom;
  const [start, setStart] = useState(booking.startTime);
  const [end, setEnd] = useState(booking.endTime);
  const [error, setError] = useState<string | null>(null);

  const ends = blocks.map(blockEnd);
  const needsAssignment = !booking.roomId; // "qualquer sala" pending

  function run(fn: () => Promise<{ ok: boolean; error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "ok" in res && !res.ok) setError(res.error ?? "Ocorreu um erro.");
      else router.refresh();
    });
  }

  function openEditor() {
    // Reset the form to the booking's current values each time it opens.
    setAssignRoom(booking.roomId ?? rooms[0]?.id ?? "");
    setStart(booking.startTime);
    setEnd(booking.endTime);
    setError(null);
    setEditing(true);
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {effective === "pendente" && (
          <>
            {needsAssignment && (
              <select
                value={assignRoom}
                onChange={(e) => setAssignRoom(e.target.value)}
                aria-label="Atribuir sala"
                className="h-9 rounded-md border border-navy/20 bg-surface-0 px-2.5 text-sm text-navy outline-none transition-colors focus:border-navy"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => approveAction(booking.id, needsAssignment ? assignRoom : undefined))}
            >
              <Check size={15} weight="bold" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => rejectAction(booking.id))}>
              <X size={15} weight="bold" /> Rejeitar
            </Button>
          </>
        )}

        {effective === "aprovada" && (
          <>
            <Button size="sm" variant="secondary" onClick={openEditor}>
              <PencilSimple size={15} weight="bold" /> Editar / Mover
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => cancelAction(booking.id))}>
              <Prohibit size={15} weight="bold" /> Cancelar
            </Button>
          </>
        )}

        {error && (
          <p className="flex w-full items-center gap-2 text-sm text-busy-ink">
            <Warning size={14} weight="bold" aria-hidden />
            {error}
          </p>
        )}
      </div>

      <Overlay
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar / mover reserva"
        icon={<PencilSimple size={18} weight="bold" className="text-gold" aria-hidden />}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Sala">
              <Select value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Início">
              <Select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="numeral"
              >
                {blocks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fim">
              <Select
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="numeral"
              >
                {ends
                  .filter((t) => toMinutes(t) > toMinutes(start))
                  .map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
              </Select>
            </Field>
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-busy-ink">
              <Warning size={14} weight="bold" aria-hidden />
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const res = await updateBookingAction(booking.id, {
                    roomId: assignRoom,
                    startTime: start,
                    endTime: end,
                  });
                  if (res.ok) setEditing(false);
                  return res;
                })
              }
            >
              <FloppyDisk size={15} weight="bold" /> Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Overlay>
    </>
  );
}
