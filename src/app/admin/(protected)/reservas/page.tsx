import Link from "next/link";
import { SectionTitle } from "@/components/brand/SectionTitle";
import { DateNav } from "@/components/schedule/DateNav";
import { BookingCard } from "@/components/admin/BookingCard";
import { RecurringForm } from "@/components/admin/RecurringForm";
import { BlockForm } from "@/components/admin/BlockForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBookingsForDate, getRooms, getSettings, effectiveState } from "@/lib/data/repository";
import { STATE_LABELS } from "@/lib/domain/booking";
import { blockStarts, blockEnd } from "@/lib/time/blocks";
import { todayISO, addDays } from "@/lib/time/dates";
import type { BookingState } from "@/lib/types";

export const metadata = { title: "Reservas" };

const FILTERS: { key: string; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendente", label: "Pendentes" },
  { key: "aprovada", label: "Aprovadas" },
  { key: "rejeitada", label: "Rejeitadas" },
  { key: "cancelada", label: "Canceladas" },
  { key: "expirada", label: "Expiradas" },
];

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; state?: string }>;
}) {
  const { date: dateParam, state: stateParam } = await searchParams;
  const today = todayISO();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const filter = stateParam ?? "todas";

  const [settings, rooms, bookings] = await Promise.all([
    getSettings(),
    getRooms(true),
    getBookingsForDate(date),
  ]);

  const blocks = blockStarts(settings.openTime, settings.closeTime);
  const ends = blocks.map(blockEnd);
  const now = new Date();
  const activeRooms = rooms.filter((r) => r.active).map((r) => ({ id: r.id, name: r.name }));
  const roomName = (id: string | null) =>
    id ? rooms.find((r) => r.id === id)?.name ?? "Sala removida" : null;

  const rows = bookings
    .map((b) => ({ b, eff: effectiveState(b, now) }))
    .filter(({ eff }) => filter === "todas" || eff === (filter as BookingState))
    .sort((a, b) => a.b.startTime.localeCompare(b.b.startTime));

  const qs = (extra: Record<string, string>) =>
    `/admin/reservas?${new URLSearchParams({ date, state: filter, ...extra }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl text-navy">Reservas</h1>
        <div className="flex flex-wrap gap-2">
          <BlockForm rooms={activeRooms} blocks={blocks} ends={ends} defaultDate={date} />
          <RecurringForm rooms={activeRooms} blocks={blocks} ends={ends} />
        </div>
      </div>

      <DateNav date={date} minDate="2000-01-01" maxDate={addDays(today, 365)} basePath="/admin/reservas" />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={qs({ state: f.key })}
            aria-current={filter === f.key ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-navy text-text-on-dark" : "border border-navy/20 text-navy hover:bg-navy/5"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <SectionTitle as="h2" className="text-lg text-navy">
        {filter === "todas" ? "Todas as reservas" : STATE_LABELS[filter as BookingState]}
      </SectionTitle>

      {rows.length === 0 ? (
        <EmptyState title="Sem reservas neste dia" description="Mude de dia ou de filtro para ver mais." glyph="♪" />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ b, eff }) => (
            <BookingCard
              key={b.id}
              booking={b}
              effective={eff}
              roomName={roomName(b.roomId)}
              activeRooms={activeRooms}
              blocks={blocks}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
