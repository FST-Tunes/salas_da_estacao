"use client";

import { Stack, ArrowRight, Sparkle, Door } from "@phosphor-icons/react";
import type { RoomAvailability } from "@/app/actions/availability";

export type RoomChoice =
  | { type: "specific"; id: string; name: string }
  | { type: "any" };

function freeTimeLabel(blocks: number): string {
  const mins = blocks * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min livres`;
  return m === 0 ? `${h}h livres` : `${h}h${String(m).padStart(2, "0")} livres`;
}

function tone(ratio: number) {
  if (ratio >= 0.66) return { dot: "bg-free-ink", text: "text-free-ink", label: "Muita disponibilidade" };
  if (ratio >= 0.33) return { dot: "bg-pending-ink", text: "text-pending-ink", label: "Alguma disponibilidade" };
  return { dot: "bg-busy-ink", text: "text-busy-ink", label: "Pouca disponibilidade" };
}

// Row 1 column spans for a 10-column grid: small(3) + wide(4) + small(3)
const ROW1_SPANS = [3, 4, 3] as const;

function FloorRoomButton({
  room,
  colSpan,
  onPick,
}: {
  room: RoomAvailability;
  colSpan?: number;
  onPick: (choice: RoomChoice) => void;
}) {
  const total = room.cells.length || 1;
  const ratio = room.freeBlocks / total;
  const soldOut = room.freeBlocks === 0;
  const t = tone(ratio);

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => onPick({ type: "specific", id: room.id, name: room.name })}
      aria-label={
        soldOut
          ? `${room.name}, esgotada`
          : `${room.name}, ${freeTimeLabel(room.freeBlocks)}`
      }
      style={colSpan ? { gridColumn: `span ${colSpan}` } : undefined}
      className={`group relative flex min-h-[8rem] flex-col justify-between overflow-hidden rounded-lg border p-3 text-left transition-all duration-200 ${
        soldOut
          ? "cursor-default border-hairline bg-surface-1/50 opacity-50"
          : "border-hairline bg-surface-0 shadow-sm hover:border-navy/60 hover:bg-navy hover:shadow-lg"
      }`}
    >
      {/* Availability accent bar — top edge */}
      {!soldOut && (
        <span
          className={`absolute inset-x-0 top-0 h-[3px] rounded-t-lg ${t.dot} opacity-70 group-hover:opacity-0 transition-opacity`}
          aria-hidden
        />
      )}

      {/* Room name */}
      <span
        className={`font-display text-sm font-medium leading-snug ${
          soldOut ? "text-text-muted" : "text-navy group-hover:text-text-on-dark"
        }`}
      >
        {room.name}
      </span>

      {/* Bottom: availability info */}
      <span className="mt-auto block">
        {soldOut ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-off-fill px-1.5 py-0.5 text-[0.65rem] font-medium text-off-ink">
            Esgotada
          </span>
        ) : (
          <span className={`text-[0.72rem] font-medium ${t.text} group-hover:text-text-on-dark/70 transition-colors`}>
            {freeTimeLabel(room.freeBlocks)}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Step 2 — pick a room.
 *
 * Top row: two featured cards side-by-side —
 *   1. "Qualquer sala disponível" (admin assigns on approval)
 *   2. The large downstairs room (last by position convention)
 *
 * Below: a stylised floor plan of the 8 upstairs rooms:
 *   Row 1 — 3 rooms: small | wide | small  (grid-cols-10, spans 3-4-3)
 *   Row 2 — 5 rooms: equal size            (grid-cols-5)
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
  // Last room by position = large downstairs room (CLAUDE.md convention)
  const largeRoom = rooms.length > 0 ? rooms[rooms.length - 1] : null;
  const upstairs = rooms.length > 1 ? rooms.slice(0, rooms.length - 1) : rooms;
  const row1 = upstairs.slice(0, 3);
  const row2 = upstairs.slice(3);

  const largeSoldOut = largeRoom ? largeRoom.freeBlocks === 0 : true;
  const largeTone = largeRoom ? tone(largeRoom.freeBlocks / (largeRoom.cells.length || 1)) : null;

  return (
    <div className="space-y-5">
      {/* Featured cards: any room + large room */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Card 1 — Qualquer sala */}
        <button
          type="button"
          disabled={anyFreeBlocks === 0}
          onClick={() => onPick({ type: "any" })}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-gold/[0.03] p-5 text-left transition-all hover:border-gold/60 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Stack size={24} weight="bold" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 font-display text-lg text-navy">
              Qualquer sala disponível
              <Sparkle size={15} weight="fill" className="text-gold" aria-hidden />
            </span>
            <span className="block text-sm text-text-muted">
              {anyFreeBlocks === 0
                ? "Sem disponibilidade neste dia"
                : "Escolhemos a sala por si, atribuída pelo administrador ao aprovar"}
            </span>
          </span>
          <ArrowRight
            size={20}
            weight="bold"
            className="shrink-0 text-navy-30 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </button>

        {/* Card 2 — Large room */}
        {largeRoom && (
          <button
            type="button"
            disabled={largeSoldOut}
            onClick={() =>
              onPick({ type: "specific", id: largeRoom.id, name: largeRoom.name })
            }
            aria-label={
              largeSoldOut
                ? `${largeRoom.name}, esgotada`
                : `${largeRoom.name}, ${freeTimeLabel(largeRoom.freeBlocks)}`
            }
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-navy/20 bg-gradient-to-br from-navy/5 to-navy/[0.02] p-5 text-left transition-all hover:border-navy/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy group-hover:bg-navy group-hover:text-text-on-dark transition-colors">
              <Door size={24} weight="bold" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display text-lg text-navy">{largeRoom.name}</span>
              <span className="block text-sm text-text-muted">
                {largeSoldOut
                  ? "Sem disponibilidade neste dia"
                  : freeTimeLabel(largeRoom.freeBlocks)}
              </span>
              {!largeSoldOut && largeTone && (
                <span
                  className={`mt-1 block h-1 w-10 rounded-full ${largeTone.dot} opacity-70`}
                  aria-hidden
                />
              )}
            </span>
            <ArrowRight
              size={20}
              weight="bold"
              className="shrink-0 text-navy-30 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </button>
        )}
      </div>

      {/* Divider */}
      {upstairs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-hairline" />
          <span className="label-caps">ou escolha uma sala de cima</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
      )}

      {/* Floor plan of upstairs rooms */}
      {upstairs.length > 0 && (
        <div
          role="group"
          aria-label="Planta do piso de cima"
          className="rounded-xl border border-hairline bg-surface-1/40 p-3 space-y-2"
        >
          {/* Row 1 — small | wide | small */}
          {row1.length > 0 && (
            <div className="grid grid-cols-10 gap-2">
              {row1.map((room, i) => (
                <FloorRoomButton
                  key={room.id}
                  room={room}
                  colSpan={ROW1_SPANS[i] ?? 3}
                  onPick={onPick}
                />
              ))}
            </div>
          )}

          {/* Row 2 — five equal rooms */}
          {row2.length > 0 && (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
            >
              {row2.map((room) => (
                <FloorRoomButton
                  key={room.id}
                  room={room}
                  onPick={onPick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
