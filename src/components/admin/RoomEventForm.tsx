"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Field, Input, Select } from "@/components/ui/Field";
import { addDays, todayISO, weekdayOf, WEEKDAY_LABELS } from "@/lib/time/dates";
import { toMinutes } from "@/lib/time/blocks";
import { createRecurringAction } from "@/app/actions/admin";

/** How many weeks ahead a weekly event is materialised. Comfortably past the
 *  public booking horizon (maxAdvanceDays, default 30), so it behaves as
 *  "every week" for conflict-prevention. */
const HORIZON_WEEKS = 52;

interface Props {
  roomId: string;
  roomName: string;
  blocks: string[];
  ends: string[];
}

/**
 * Adds a weekly recurring occupation ("acontecimento") to this room: the same
 * weekday + time range every week. Materialised as approved bookings sharing a
 * recurrenceId via the existing recurring machinery, so the DB exclusion
 * constraint protects the slots and the public grid reflects them automatically.
 */
export function RoomEventForm({ roomId, roomName, blocks, ends }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ created: number; weeks: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [weekday, setWeekday] = useState(2); // Tuesday by default
  const [start, setStart] = useState(blocks[0] ?? "20:00");
  const [end, setEnd] = useState(ends.find((t) => toMinutes(t) > toMinutes(blocks[0] ?? "20:00")) ?? "22:00");

  /** Keep `end` after `start`: changing the start time must re-clamp a now-stale
   *  end, otherwise the (filtered-out) old value lingers in state and submit
   *  silently rejects it. */
  function changeStart(next: string) {
    setStart(next);
    if (toMinutes(end) <= toMinutes(next)) {
      setEnd(ends.find((t) => toMinutes(t) > toMinutes(next)) ?? end);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Indique o nome ou grupo.");
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      setError("A hora de fim tem de ser depois da de início.");
      return;
    }

    const from = todayISO();
    const until = addDays(from, HORIZON_WEEKS * 7);
    const dates: string[] = [];
    let cursor = from;
    let guard = 0;
    while (cursor <= until && guard < 800) {
      if (weekdayOf(cursor) === weekday) dates.push(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }

    startTransition(async () => {
      const res = await createRecurringAction({
        roomId,
        bookerName: name.trim(),
        startTime: start,
        endTime: end,
        dates,
      });
      setResult({ created: res.created, weeks: dates.length });
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <ArrowsClockwise size={15} weight="bold" /> Adicionar acontecimento semanal
      </Button>

      <Overlay
        open={open}
        onClose={() => { setOpen(false); setResult(null); }}
        title={`Acontecimento semanal · ${roomName}`}
        icon={<ArrowsClockwise size={18} weight="bold" className="text-gold" aria-hidden />}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-text-muted">
            Ocupa o mesmo dia e horário todas as semanas. São criadas reservas aprovadas para as
            próximas {HORIZON_WEEKS} semanas.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome / grupo">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex.: Ensaio Banda Juvenil"
              />
            </Field>
            <Field label="Dia da semana">
              <Select
                value={String(weekday)}
                onChange={(v) => setWeekday(Number(v))}
                aria-label="Dia da semana"
                options={WEEKDAY_LABELS.map((w, i) => ({ value: String(i), label: w }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Select
                  value={start}
                  onChange={changeStart}
                  numeral
                  aria-label="Hora de início"
                  options={blocks.map((b) => ({ value: b, label: b }))}
                />
              </Field>
              <Field label="Fim">
                <Select
                  value={end}
                  onChange={setEnd}
                  numeral
                  aria-label="Hora de fim"
                  options={ends.filter((t) => toMinutes(t) > toMinutes(start)).map((t) => ({ value: t, label: t }))}
                />
              </Field>
            </div>
          </div>

          {error !== null && <p className="text-sm text-red">{error}</p>}

          {result !== null && (
            <p className="flex items-center gap-2 text-sm text-free-ink">
              <CheckCircle size={16} weight="fill" aria-hidden />
              {result.created} de {result.weeks} semana(s) criada(s)
              {result.created < result.weeks && ". As restantes já tinham o horário ocupado."}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "A criar…" : "Criar acontecimento"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setResult(null); }}>Fechar</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
