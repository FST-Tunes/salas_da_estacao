import { Header } from "@/components/brand/Header";
import { Footer } from "@/components/brand/Footer";
import { SectionTitle } from "@/components/brand/SectionTitle";
import { Legend } from "@/components/schedule/Legend";
import { DateNav } from "@/components/schedule/DateNav";
import { BookingPlanner } from "@/components/schedule/BookingPlanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRooms, getSettings, getPublicBookingsForDate } from "@/lib/data/repository";
import { buildGridModel } from "@/lib/grid";
import type { DisplayCell } from "@/components/schedule/ScheduleGrid";
import { todayISO, addDays } from "@/lib/time/dates";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = todayISO();
  const [settings, rooms] = await Promise.all([getSettings(), getRooms()]);
  const maxDate = addDays(today, settings.maxAdvanceDays);

  // Clamp the requested date to [today, today + maxAdvanceDays].
  let date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  if (date < today) date = today;
  if (date > maxDate) date = maxDate;

  const bookings = await getPublicBookingsForDate(date);
  const model = buildGridModel(rooms, bookings, settings, date);

  const anyCells: DisplayCell[] = model.anyCells.map((c) => ({
    state: c.state,
    label: c.freeCount > 0 ? `${c.freeCount} ${c.freeCount === 1 ? "livre" : "livres"}` : null,
  }));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-8 max-w-2xl">
          <p className="label-caps mb-2">Salas de ensaio · EMM</p>
          <SectionTitle as="h1" className="text-3xl sm:text-4xl text-navy">
            Reservar
          </SectionTitle>
          <p className="mt-3 text-text-muted">
            Consulte a disponibilidade das salas e submeta o seu pedido. Os horários organizam-se em
            blocos de 30 minutos.
          </p>
        </section>

        <div className="mb-5 flex flex-col gap-4 border-b border-hairline pb-5">
          <DateNav date={date} minDate={today} maxDate={maxDate} />
          <Legend />
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            title="Ainda não há salas configuradas"
            description="O administrador precisa de adicionar salas antes de aceitar reservas."
          />
        ) : (
          <BookingPlanner
            date={date}
            rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
            blocks={model.blocks}
            roomCells={model.roomCells}
            anyCells={anyCells}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
