"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { WizardSteps, type WizardStep } from "./WizardSteps";
import { MonthCalendar } from "./MonthCalendar";
import { RoomStep, type RoomChoice } from "./RoomStep";
import { TimeStep } from "./TimeStep";
import { CheckoutPanel, type CheckoutSummary } from "./CheckoutPanel";
import { Legend } from "@/components/schedule/Legend";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/brand/SectionTitle";
import { getDayAvailability, type DayAvailability } from "@/app/actions/availability";
import { submitBooking } from "@/app/actions/booking";
import { blockEnd, blockCount, formatRange } from "@/lib/time/blocks";
import { fromISODate } from "@/lib/time/dates";
import type { SlotRun } from "@/lib/time/selection";

const STEP_SHORT = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" });
const DATE_LONG = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long" });

function durationLabel(nBlocks: number): string {
  const mins = nBlocks * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

type Screen = 1 | 2 | 3;

export function BookingWizard({ today, maxDate }: { today: string; maxDate: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(1);
  const [date, setDate] = useState<string | null>(null);
  const [avail, setAvail] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<RoomChoice | null>(null);
  const [selection, setSelection] = useState<SlotRun | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Mobile only: gates the name/phone form behind a "Selecionar" confirmation
  // so picking a slot doesn't immediately cover the grid and block more picks.
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  // ── Derived view data ───────────────────────────────────────────────────────
  const columnCells =
    room?.type === "any" ? (avail?.anyCells ?? []) : room?.type === "specific"
      ? (avail?.rooms.find((r) => r.id === room.id)?.cells ?? [])
      : [];
  const roomName = room?.type === "any" ? "Qualquer sala disponível" : room?.type === "specific" ? room.name : "";
  const blocks = avail?.blocks ?? [];
  const startTime = selection ? blocks[selection.lo] : null;
  const endTime = selection ? blockEnd(blocks[selection.hi]) : null;

  // ── Navigation ──────────────────────────────────────────────────────────────
  async function selectDate(iso: string) {
    setLoading(true);
    setError(null);
    setRoom(null);
    setSelection(null);
    setTimeConfirmed(false);
    const data = await getDayAvailability(iso);
    setAvail(data);
    setDate(data.date);
    setLoading(false);
    setScreen(2);
  }

  function pickRoom(choice: RoomChoice) {
    setRoom(choice);
    setSelection(null);
    setTimeConfirmed(false);
    setError(null);
    setScreen(3);
  }

  // Clearing the selection drops back out of the confirmed (name/phone) state.
  function changeSelection(run: SlotRun | null) {
    setSelection(run);
    if (!run) setTimeConfirmed(false);
  }

  function jumpTo(step: number) {
    setError(null);
    setTimeConfirmed(false);
    if (step === 1) {
      setScreen(1);
    } else if (step === 2) {
      setRoom(null);
      setSelection(null);
      setScreen(2);
    } else if (step >= 3) {
      setScreen(3);
    }
  }

  function submit() {
    if (!selection || !startTime || !endTime || !date || !room) return;
    if (name.trim().length < 2) {
      setError("Indique o seu nome.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitBooking({
        bookerName: name,
        phone: phone || null,
        date,
        startTime,
        endTime,
        roomId: room.type === "specific" ? room.id : null,
        anyRoom: room.type === "any",
      });
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error ?? "Não foi possível submeter o pedido.");
      }
    });
  }

  function startOver() {
    setScreen(1);
    setDate(null);
    setAvail(null);
    setRoom(null);
    setSelection(null);
    setName("");
    setPhone("");
    setError(null);
    setDone(false);
    setTimeConfirmed(false);
  }

  // ── Stepper model ────────────────────────────────────────────────────────────
  const currentStep = screen === 1 ? 1 : screen === 2 ? 2 : selection ? 4 : 3;
  const steps: WizardStep[] = [
    {
      label: "Data",
      value: date ? cap(STEP_SHORT.format(fromISODate(date)).replace(".", "")) : null,
      done: !!date,
      reachable: true,
    },
    {
      label: "Sala",
      value: room ? roomName : null,
      done: !!room,
      reachable: !!avail,
    },
    {
      label: "Horário",
      value: selection ? formatRange(startTime!, endTime!) : null,
      done: !!selection,
      reachable: !!room,
    },
    {
      label: "Dados",
      value: name.trim() ? name.trim() : null,
      done: done,
      reachable: !!selection,
    },
  ];

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-hairline bg-surface-0 p-8 text-center shadow-sm">
        <CheckCircle size={48} weight="fill" className="mx-auto text-free-ink" aria-hidden />
        <SectionTitle as="h2" className="mt-3 text-2xl text-navy">
          Pedido submetido
        </SectionTitle>
        <p className="mt-2 text-sm text-text-muted">
          O seu pedido fica <strong className="text-navy">pendente</strong> até aprovação. Se indicou
          o telemóvel, será notificado da decisão.
        </p>
        <Button variant="secondary" onClick={startOver} className="mt-5">
          Fazer outro pedido
        </Button>
      </div>
    );
  }

  const summary: CheckoutSummary | null =
    selection && date
      ? {
          roomName,
          anyRoom: room?.type === "any",
          dateLabel: DATE_LONG.format(fromISODate(date)),
          rangeLabel: formatRange(startTime!, endTime!),
          durationLabel: durationLabel(blockCount(startTime!, endTime!)),
        }
      : null;

  return (
    <div className="space-y-6">
      <WizardSteps steps={steps} current={currentStep} onJump={jumpTo} />

      {/* Step 1 — date */}
      {screen === 1 && (
        <StepShell title="Escolha o dia">
          <MonthCalendar today={today} maxDate={maxDate} selected={date} onPick={selectDate} />
        </StepShell>
      )}

      {/* Step 2 — room */}
      {screen === 2 &&
        (loading || !avail ? (
          <Loading />
        ) : (
          <StepShell title="Escolha a sala">
            <RoomStep rooms={avail.rooms} anyFreeBlocks={avail.anyFreeBlocks} onPick={pickRoom} />
          </StepShell>
        ))}

      {/* Step 3 + 4 — time + checkout */}
      {screen === 3 && avail && room && (
        <StepShell title="Escolha o horário">
          <div className="mb-4">
            <Legend />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <TimeStep
              key={room.type === "any" ? "any" : room.id}
              blocks={blocks}
              cells={columnCells}
              selection={selection}
              onSelectionChange={changeSelection}
              roomLabel={roomName}
            />
            {/* Desktop: sticky side panel — never covers the grid. */}
            {summary && (
              <aside className="z-30 hidden lg:sticky lg:top-20 lg:block lg:self-start">
                <div className="rounded-lg border border-hairline bg-surface-0 p-5 shadow-sm">
                  <h3 className="mb-3 font-display text-lg text-navy">O seu pedido</h3>
                  <CheckoutPanel
                    summary={summary}
                    name={name}
                    phone={phone}
                    onNameChange={setName}
                    onPhoneChange={setPhone}
                    onSubmit={submit}
                    pending={pending}
                    error={error}
                  />
                </div>
              </aside>
            )}
          </div>

          {/* Mobile: while a slot is selected but not confirmed, show a floating
              "Selecionar" bar so the user can keep picking more slots. */}
          {summary && !timeConfirmed && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface-0 p-4 shadow-md lg:hidden">
              <Button onClick={() => setTimeConfirmed(true)} className="w-full">
                Selecionar · {summary.rangeLabel}
              </Button>
            </div>
          )}

          {/* Mobile: only after confirming does the name/phone sheet appear. */}
          {summary && timeConfirmed && (
            <aside className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
              <div className="max-h-[80vh] overflow-y-auto rounded-t-xl border border-hairline bg-surface-0 p-5 shadow-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-navy">O seu pedido</h3>
                  <button
                    type="button"
                    onClick={() => setTimeConfirmed(false)}
                    className="text-sm text-text-muted underline underline-offset-2"
                  >
                    Alterar horário
                  </button>
                </div>
                <CheckoutPanel
                  summary={summary}
                  name={name}
                  phone={phone}
                  onNameChange={setName}
                  onPhoneChange={setPhone}
                  onSubmit={submit}
                  pending={pending}
                  error={error}
                />
              </div>
            </aside>
          )}

          {/* Spacer so the fixed mobile bottom UI never hides the last chips. */}
          {summary && <div aria-hidden className="h-24 lg:hidden" />}
        </StepShell>
      )}
    </div>
  );
}

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionTitle as="h2" className="mb-4 text-xl text-navy">
        {title}
      </SectionTitle>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-text-muted">
      <CircleNotch size={20} weight="bold" className="animate-spin" aria-hidden />
      A carregar disponibilidade…
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
