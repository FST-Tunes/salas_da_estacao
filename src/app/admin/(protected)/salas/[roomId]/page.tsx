import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { Legend } from "@/components/schedule/Legend";
import { WeekNav } from "@/components/admin/WeekNav";
import { RoomWeekGrid } from "@/components/admin/RoomWeekGrid";
import { RoomEventForm } from "@/components/admin/RoomEventForm";
import { BlockForm } from "@/components/admin/BlockForm";
import { getRooms, getSettings, getBookingsInRange } from "@/lib/data/repository";
import { buildRoomWeekModel } from "@/lib/grid";
import { blockStarts, blockEnd } from "@/lib/time/blocks";
import { todayISO, startOfWeekISO, weekDates } from "@/lib/time/dates";

export const metadata = { title: "Horário da sala" };

export default async function RoomSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { roomId } = await params;
  const { week: weekParam } = await searchParams;

  const rooms = await getRooms(true);
  const room = rooms.find((r) => r.id === roomId);
  if (!room) notFound();

  const today = todayISO();
  const anchor = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : today;
  const week = startOfWeekISO(anchor);
  const dates = weekDates(week);

  const [settings, bookings] = await Promise.all([
    getSettings(),
    getBookingsInRange(dates[0], dates[6]),
  ]);

  const model = buildRoomWeekModel(room.id, bookings, settings, dates, new Date());
  const blocks = blockStarts(settings.openTime, settings.closeTime);
  const ends = blocks.map(blockEnd);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/salas"
          className="inline-flex items-center gap-1.5 text-sm text-navy-60 hover:text-navy"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden /> Salas
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl text-navy">{room.name}</h1>
          {!room.active && (
            <span className="rounded-full border border-navy/20 px-2.5 py-1 text-xs text-text-muted">
              Sala removida
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Horário semanal da sala. Adicione acontecimentos que se repetem todas as semanas.
        </p>
      </div>

      <WeekNav week={week} basePath={`/admin/salas/${room.id}`} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Legend />
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <ArrowsClockwise size={13} weight="bold" aria-hidden className="text-gold" />
          Acontecimento recorrente
        </span>
      </div>

      {room.active ? (
        <div className="flex flex-wrap gap-2">
          <RoomEventForm roomId={room.id} roomName={room.name} blocks={blocks} ends={ends} />
          <BlockForm
            rooms={[]}
            blocks={blocks}
            ends={ends}
            defaultDate={today}
            fixedRoom={{ id: room.id, name: room.name }}
          />
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Esta sala foi removida — restaure-a na lista de salas para adicionar acontecimentos.
        </p>
      )}

      <RoomWeekGrid model={model} today={today} />
    </div>
  );
}
