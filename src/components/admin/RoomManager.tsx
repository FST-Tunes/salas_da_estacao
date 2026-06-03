"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, FloppyDisk, EyeSlash, ArrowCounterClockwise, Door, CalendarBlank } from "@phosphor-icons/react";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  createRoomAction,
  renameRoomAction,
  deactivateRoomAction,
  reactivateRoomAction,
} from "@/app/actions/admin";
import type { Room } from "@/lib/types";

export function RoomManager({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  const active = rooms.filter((r) => r.active);
  const inactive = rooms.filter((r) => !r.active);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      await createRoomAction(newName);
      setNewName("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-lg border border-hairline bg-surface-0 p-4">
        <label className="flex flex-1 flex-col gap-1 text-xs text-text-muted">
          Nome da nova sala
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex.: Sala 9 · Estúdio"
            className="rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none focus:border-navy"
          />
        </label>
        <Button type="submit" disabled={pending || !newName.trim()}>
          <Plus size={16} weight="bold" /> Adicionar
        </Button>
      </form>

      <ul className="space-y-2">
        {active.map((room) => (
          <RoomRow key={room.id} room={room} onChange={() => router.refresh()} />
        ))}
      </ul>

      {inactive.length > 0 && (
        <div className="space-y-2">
          <p className="label-caps">Salas removidas (histórico preservado)</p>
          <ul className="space-y-2">
            {inactive.map((room) => (
              <RoomRow key={room.id} room={room} onChange={() => router.refresh()} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RoomRow({ room, onChange }: { room: Room; onChange: () => void }) {
  const [name, setName] = useState(room.name);
  const [pending, startTransition] = useTransition();
  const dirty = name.trim() !== room.name;

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn(); onChange(); });

  return (
    <li className={`flex flex-wrap items-center gap-2 rounded-md border border-hairline p-3 ${room.active ? "bg-surface-0" : "bg-surface-1 opacity-80"}`}>
      <Door size={18} weight="bold" className="text-navy-60" aria-hidden />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!room.active}
        className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 py-1.5 text-navy outline-none hover:border-navy/20 focus:border-navy disabled:text-text-muted"
      />
      <LinkButton size="sm" variant="secondary" href={`/admin/salas/${room.id}`}>
        <CalendarBlank size={14} weight="bold" /> Ver horário
      </LinkButton>
      {room.active ? (
        <>
          <Button size="sm" variant="secondary" disabled={!dirty || pending} onClick={() => act(() => renameRoomAction(room.id, name))}>
            <FloppyDisk size={14} weight="bold" /> Guardar
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(() => deactivateRoomAction(room.id))}>
            <EyeSlash size={14} weight="bold" /> Remover
          </Button>
        </>
      ) : (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(() => reactivateRoomAction(room.id))}>
          <ArrowCounterClockwise size={14} weight="bold" /> Restaurar
        </Button>
      )}
    </li>
  );
}
