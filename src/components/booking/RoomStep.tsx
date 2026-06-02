"use client";

import { Buildings, Stack, ArrowRight } from "@phosphor-icons/react";
import type { RoomAvailability } from "@/app/actions/availability";

export type RoomChoice =
  | { type: "specific"; id: string; name: string }
  | { type: "any" };

/**
 * Step 2 — pick a room. Each room shows how many 30-min blocks are free that
 * day; a room with none is greyed out and labelled "Esgotada". A first-class
 * "Qualquer sala disponível" card lets the admin assign the room on approval.
 */
export function RoomStep({
  rooms,
  anyFreeBlocks,
  onPick,
}: {
  rooms: RoomAvailability[];
  anyFreeBlocks: number;
  onPick: (choice: RoomChoice) => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={anyFreeBlocks === 0}
        onClick={() => onPick({ type: "any" })}
        className="group flex w-full items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 p-4 text-left transition-colors hover:bg-gold/10 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
          <Stack size={22} weight="bold" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base text-navy">Qualquer sala disponível</span>
          <span className="block text-sm text-text-muted">
            {anyFreeBlocks === 0
              ? "Sem disponibilidade neste dia"
              : "A sala é atribuída pelo administrador ao aprovar"}
          </span>
        </span>
        <ArrowRight size={18} weight="bold" className="shrink-0 text-navy-30 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rooms.map((room) => {
          const soldOut = room.freeBlocks === 0;
          return (
            <button
              key={room.id}
              type="button"
              disabled={soldOut}
              onClick={() => onPick({ type: "specific", id: room.id, name: room.name })}
              aria-label={soldOut ? `${room.name}, esgotada` : `${room.name}, ${room.freeBlocks} blocos livres`}
              className={`group flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors ${
                soldOut
                  ? "cursor-default border-hairline bg-surface-1/50 opacity-60"
                  : "border-hairline bg-surface-0 shadow-sm hover:border-navy/40 hover:bg-navy/[0.03]"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-md ${
                  soldOut ? "bg-off-fill text-off-ink" : "bg-surface-1 text-navy"
                }`}
              >
                <Buildings size={18} weight="bold" aria-hidden />
              </span>
              <span className="font-display text-[0.95rem] text-navy">{room.name}</span>
              {soldOut ? (
                <span className="inline-flex w-fit items-center rounded-sm bg-off-fill px-1.5 py-0.5 text-[0.7rem] font-medium text-off-ink">
                  Esgotada
                </span>
              ) : (
                <span className="text-[0.78rem] text-text-muted">
                  {room.freeBlocks} {room.freeBlocks === 1 ? "bloco livre" : "blocos livres"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
