"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, PencilSimple, Prohibit, FloppyDisk, Warning } from "@phosphor-icons/react";
import type { Booking, BookingState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
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
}

export function BookingActions({ booking, effective, rooms, blocks }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [assignRoom, setAssignRoom] = useState(booking.roomId ?? rooms[0]?.id ?? "");
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

  if (editing) {
    return (
      <div className="mt-3 space-y-3 rounded-md border border-hairline bg-surface-1 p-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Sala
            <select
              value={assignRoom}
              onChange={(e) => setAssignRoom(e.target.value)}
              className="rounded-sm border border-navy/20 bg-surface-0 px-2 py-1.5 text-sm text-navy"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Início
            <select
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-sm border border-navy/20 bg-surface-0 px-2 py-1.5 text-sm text-navy numeral"
            >
              {blocks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Fim
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-sm border border-navy/20 bg-surface-0 px-2 py-1.5 text-sm text-navy numeral"
            >
              {ends
                .filter((t) => toMinutes(t) > toMinutes(start))
                .map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
            </select>
          </label>
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
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {effective === "pendente" && (
        <>
          {needsAssignment && (
            <select
              value={assignRoom}
              onChange={(e) => setAssignRoom(e.target.value)}
              aria-label="Atribuir sala"
              className="rounded-sm border border-navy/20 bg-surface-0 px-2 py-1.5 text-sm text-navy"
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
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
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
  );
}
