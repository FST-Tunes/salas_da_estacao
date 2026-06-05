"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, PencilSimple, Prohibit, FloppyDisk, Warning, Trash } from "@phosphor-icons/react";
import type { Booking, BookingState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Field, Select } from "@/components/ui/Field";
import { BookingSlotPreview } from "./BookingSlotPreview";
import { blockEnd, toMinutes, formatRange } from "@/lib/time/blocks";
import {
  approveAction,
  rejectAction,
  cancelAction,
  deleteAction,
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [localRoom, setLocalRoom] = useState(booking.roomId ?? rooms[0]?.id ?? "");
  const assignRoom = controlledRoom ?? localRoom;
  const setAssignRoom = onAssignRoomChange ?? setLocalRoom;
  const [start, setStart] = useState(booking.startTime);
  const [end, setEnd] = useState(booking.endTime);
  const [error, setError] = useState<string | null>(null);

  const ends = blocks.map(blockEnd);
  const needsAssignment = !booking.roomId; // "qualquer sala" pending
  const isBlock = booking.isBlock; // admin block, not a real booking

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
        {/* Approve / reject only apply to a pending real request (not a block). */}
        {effective === "pendente" && !isBlock && (
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

        {/* Cancel applies to an approved real booking only. */}
        {effective === "aprovada" && !isBlock && (
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => cancelAction(booking.id))}>
            <Prohibit size={15} weight="bold" /> Cancelar
          </Button>
        )}

        {/* Edit / move is available in every state (and for blocks). */}
        <Button size="sm" variant="secondary" onClick={openEditor}>
          <PencilSimple size={15} weight="bold" /> {isBlock ? "Editar bloqueio" : "Editar / Mover"}
        </Button>

        {/* Permanent delete — available in every state, behind a confirmation. */}
        <Button
          size="sm"
          variant="ghost"
          className="text-red hover:bg-red/10"
          disabled={pending}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash size={15} weight="bold" /> {isBlock ? "Remover bloqueio" : "Eliminar"}
        </Button>

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
        title={isBlock ? "Editar bloqueio" : "Editar / mover reserva"}
        icon={<PencilSimple size={18} weight="bold" className="text-gold" aria-hidden />}
        size="lg"
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
                onChange={(e) => {
                  const next = e.target.value;
                  setStart(next);
                  // Keep the end after the start so the preview selection stays valid.
                  if (toMinutes(end) <= toMinutes(next)) {
                    const nextEnd = ends.find((t) => toMinutes(t) > toMinutes(next));
                    if (nextEnd) setEnd(nextEnd);
                  }
                }}
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

          {/* Live availability for the picked room + day, hugging the new range.
              Excludes this booking so its own current slot reads as free. */}
          <div className="rounded-lg border border-hairline bg-surface-1/40 p-3">
            <BookingSlotPreview
              booking={{ date: booking.date, startTime: start, endTime: end, roomId: booking.roomId }}
              selectedRoom={assignRoom}
              excludeBookingId={booking.id}
              editing
            />
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

      <Overlay
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={isBlock ? "Remover bloqueio" : "Eliminar reserva"}
        icon={<Trash size={18} weight="bold" className="text-red" aria-hidden />}
        size="sm"
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-md border border-red/30 bg-red/5 p-3 text-sm text-navy">
            <Warning size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-red" />
            <span>
              Esta ação <strong>não pode ser desfeita</strong>. {isBlock ? "O bloqueio" : "A reserva"}{" "}
              de <strong>{booking.bookerName}</strong> ({formatRange(booking.startTime, booking.endTime)})
              será apagado(a) definitivamente da base de dados.
            </span>
          </p>
          {error && (
            <p className="flex items-center gap-2 text-sm text-busy-ink">
              <Warning size={14} weight="bold" aria-hidden />
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const res = await deleteAction(booking.id);
                  if (res.ok) setConfirmingDelete(false);
                  return res;
                })
              }
            >
              <Trash size={15} weight="bold" /> {pending ? "A eliminar…" : "Eliminar definitivamente"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Overlay>
    </>
  );
}
