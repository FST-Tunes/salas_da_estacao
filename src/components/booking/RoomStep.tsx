"use client";

import { Buildings, Stack, ArrowRight, Sparkle } from "@phosphor-icons/react";
import type { RoomAvailability } from "@/app/actions/availability";

export type RoomChoice =
  | { type: "specific"; id: string; name: string }
  | { type: "any" };

/** "n blocos livres" → friendly free-time label, e.g. "3h livres", "2h30 livres". */
function freeTimeLabel(blocks: number): string {
  const mins = blocks * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min livres`;
  return m === 0 ? `${h}h livres` : `${h}h${String(m).padStart(2, "0")} livres`;
}

/** Map a free/total ratio to a desaturated availability tone (design-system §3). */
function tone(ratio: number) {
  if (ratio >= 0.66) return { fill: "bg-free-ink", text: "text-free-ink", word: "Muita disponibilidade" };
  if (ratio >= 0.33) return { fill: "bg-pending-ink", text: "text-pending-ink", word: "Alguma disponibilidade" };
  return { fill: "bg-busy-ink", text: "text-busy-ink", word: "Pouca disponibilidade" };
}

/**
 * Step 2 — pick a room. Each room shows a slim availability meter (free vs. total
 * blocks) plus the free time in hours; a sold-out room is greyed and labelled
 * "Esgotada". The first-class "Qualquer sala disponível" option is featured on
 * top — the admin assigns the actual room on approval.
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
    <div className="space-y-5">
      {/* Featured "any room" option */}
      <button
        type="button"
        disabled={anyFreeBlocks === 0}
        onClick={() => onPick({ type: "any" })}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-gold/[0.03] p-5 text-left transition-all hover:border-gold/60 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
      >
        <span aria-hidden className="pointer-events-none absolute -right-4 -top-4 font-display text-7xl leading-none text-gold/10 select-none">
          {"}"}
        </span>
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
              : "Escolhemos a sala por si — atribuída pelo administrador ao aprovar"}
          </span>
        </span>
        <ArrowRight size={20} weight="bold" className="shrink-0 text-navy-30 transition-transform group-hover:translate-x-1" aria-hidden />
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="label-caps">ou escolha uma sala</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rooms.map((room) => {
          const total = room.cells.length || 1;
          const ratio = room.freeBlocks / total;
          const soldOut = room.freeBlocks === 0;
          const t = tone(ratio);

          return (
            <button
              key={room.id}
              type="button"
              disabled={soldOut}
              onClick={() => onPick({ type: "specific", id: room.id, name: room.name })}
              aria-label={soldOut ? `${room.name}, esgotada` : `${room.name}, ${freeTimeLabel(room.freeBlocks)}`}
              className={`group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all ${
                soldOut
                  ? "cursor-default border-hairline bg-surface-1/50 opacity-60"
                  : "border-hairline bg-surface-0 shadow-sm hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    soldOut ? "bg-off-fill text-off-ink" : "bg-surface-1 text-navy group-hover:bg-navy group-hover:text-text-on-dark"
                  }`}
                >
                  <Buildings size={20} weight="bold" aria-hidden />
                </span>
                {!soldOut && (
                  <span title={t.word} className={`flex h-2.5 w-2.5 rounded-full ${t.fill}`} aria-hidden />
                )}
              </div>

              <span className="font-display text-base leading-tight text-navy">{room.name}</span>

              {soldOut ? (
                <span className="inline-flex w-fit items-center rounded-sm bg-off-fill px-1.5 py-0.5 text-[0.7rem] font-medium text-off-ink">
                  Esgotada
                </span>
              ) : (
                <div className="space-y-1.5">
                  {/* Availability meter */}
                  <span className="block h-1.5 overflow-hidden rounded-full bg-surface-1" aria-hidden>
                    <span className={`block h-full rounded-full ${t.fill}`} style={{ width: `${Math.max(8, ratio * 100)}%` }} />
                  </span>
                  <span className={`block text-[0.78rem] font-medium ${t.text}`}>
                    {freeTimeLabel(room.freeBlocks)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
