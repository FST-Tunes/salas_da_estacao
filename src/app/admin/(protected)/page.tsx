import { SectionTitle } from "@/components/brand/SectionTitle";
import { BookingCard } from "@/components/admin/BookingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardData, getSettings, effectiveState } from "@/lib/data/repository";
import { blockStarts } from "@/lib/time/blocks";
import { todayISO, formatLongDate } from "@/lib/time/dates";

export const metadata = { title: "Painel" };

export default async function AdminDashboard() {
  const today = todayISO();
  const [settings, data] = await Promise.all([getSettings(), getDashboardData(today)]);
  const { rooms, bookingsToday, pending } = data;
  const blocks = blockStarts(settings.openTime, settings.closeTime);
  const now = new Date();

  const roomName = (id: string | null) =>
    id ? rooms.find((r) => r.id === id)?.name ?? "Sala removida" : null;
  const activeRooms = rooms.map((r) => ({ id: r.id, name: r.name }));

  const pendingSorted = [...pending].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
  const todaySorted = [...bookingsToday]
    .filter((b) => {
      const s = effectiveState(b, now);
      return s === "aprovada" || s === "pendente";
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-navy">Painel</h1>
        <p className="mt-1 text-sm text-text-muted">{formatLongDate(today)}</p>
      </div>

      <section className="space-y-4">
        <SectionTitle as="h2" className="text-xl text-navy">Pedidos pendentes</SectionTitle>
        {pendingSorted.length === 0 ? (
          <EmptyState title="Sem pedidos pendentes" description="Tudo tratado. Os novos pedidos aparecem aqui." glyph="♪" />
        ) : (
          <ul className="space-y-3">
            {pendingSorted.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                effective={effectiveState(b, now)}
                roomName={roomName(b.roomId)}
                activeRooms={activeRooms}
                blocks={blocks}
                expandable
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle as="h2" className="text-xl text-navy">Reservas de hoje</SectionTitle>
        {todaySorted.length === 0 ? (
          <EmptyState title="Ainda sem reservas para hoje" glyph="𝄞" />
        ) : (
          <ul className="space-y-3">
            {todaySorted.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                effective={effectiveState(b, now)}
                roomName={roomName(b.roomId)}
                activeRooms={activeRooms}
                blocks={blocks}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
