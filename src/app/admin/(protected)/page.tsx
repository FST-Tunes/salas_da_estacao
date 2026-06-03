import { SectionTitle } from "@/components/brand/SectionTitle";
import { StatCard } from "@/components/admin/StatCard";
import { BookingCard } from "@/components/admin/BookingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardData, getSettings, effectiveState } from "@/lib/data/repository";
import { blockStarts, blockCount } from "@/lib/time/blocks";
import { todayISO, formatLongDate } from "@/lib/time/dates";

export const metadata = { title: "Painel" };

export default async function AdminDashboard() {
  const today = todayISO();
  const [settings, data] = await Promise.all([getSettings(), getDashboardData(today)]);
  const { rooms, bookingsToday, pending, expired } = data;
  const blocks = blockStarts(settings.openTime, settings.closeTime);
  const now = new Date();

  const roomName = (id: string | null) =>
    id ? rooms.find((r) => r.id === id)?.name ?? "Sala removida" : null;
  const activeRooms = rooms.map((r) => ({ id: r.id, name: r.name }));

  // Occupancy today: approved block-slots / total available block-slots.
  const approvedToday = bookingsToday.filter((b) => effectiveState(b, now) === "aprovada");
  const totalSlots = blocks.length * Math.max(rooms.length, 1);
  const occupiedSlots = approvedToday.reduce(
    (sum, b) => sum + blockCount(b.startTime, b.endTime),
    0,
  );
  const occupancy = totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pendentes" value={pending.length} tone="pending" hint="A aguardar decisão" />
        <StatCard label="Reservas hoje" value={approvedToday.length} hint="Aprovadas para hoje" />
        <StatCard label="Expiradas" value={expired.length} tone="alert" hint="Sem decisão a tempo" />
        <StatCard label="Ocupação hoje" value={`${occupancy}%`} hint={`${rooms.length} salas ativas`} />
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
