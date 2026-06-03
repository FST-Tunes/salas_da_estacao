import { Header } from "@/components/brand/Header";
import { Footer } from "@/components/brand/Footer";
import { SectionTitle } from "@/components/brand/SectionTitle";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRooms, getSettings } from "@/lib/data/repository";
import { todayISO, addDays } from "@/lib/time/dates";

export default async function HomePage() {
  const today = todayISO();
  const [settings, rooms] = await Promise.all([getSettings(), getRooms()]);
  const maxDate = addDays(today, settings.maxAdvanceDays);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-8 max-w-2xl">
          <p className="label-caps mb-2">Salas de ensaio · EMM</p>
          <SectionTitle as="h1" className="text-3xl sm:text-4xl text-navy">
            Reservar
          </SectionTitle>
        </section>

        {rooms.length === 0 ? (
          <EmptyState
            title="Ainda não há salas configuradas"
            description="O administrador precisa de adicionar salas antes de aceitar reservas."
          />
        ) : (
          <BookingWizard today={today} maxDate={maxDate} />
        )}
      </main>

      <Footer />
    </div>
  );
}
