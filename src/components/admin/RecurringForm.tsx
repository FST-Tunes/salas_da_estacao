"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Field, Input, Select } from "@/components/ui/Field";
import { addDays, weekdayOf, WEEKDAY_LABELS } from "@/lib/time/dates";
import { toMinutes } from "@/lib/time/blocks";
import { createRecurringAction } from "@/app/actions/admin";

interface Props {
  rooms: { id: string; name: string }[];
  blocks: string[];
  ends: string[];
}

/** Admin-only recurring bookings, e.g. every Tuesday 20:00–22:00. */
export function RecurringForm({ rooms, blocks, ends }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [name, setName] = useState("");
  const [weekday, setWeekday] = useState(2); // Tuesday by default
  const [start, setStart] = useState(blocks[0] ?? "20:00");
  const [end, setEnd] = useState(ends[ends.length - 1] ?? "22:00");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");

  /** Keep `end` after `start`: changing the start must re-clamp a now-stale end
   *  so its (filtered-out) old value can't linger in state and block submit. */
  function changeStart(next: string) {
    setStart(next);
    if (toMinutes(end) <= toMinutes(next)) {
      setEnd(ends.find((t) => toMinutes(t) > toMinutes(next)) ?? end);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !roomId) {
      setError("Indique a sala e o nome ou grupo.");
      return;
    }
    if (!from || !until) {
      setError("Indique o intervalo de datas (de / até).");
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      setError("A hora de fim tem de ser depois da de início.");
      return;
    }
    const dates: string[] = [];
    let cursor = from;
    let guard = 0;
    while (cursor <= until && guard < 800) {
      if (weekdayOf(cursor) === weekday) dates.push(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
    startTransition(async () => {
      const res = await createRecurringAction({ roomId, bookerName: name.trim(), startTime: start, endTime: end, dates });
      setCreated(res.created);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <ArrowsClockwise size={15} weight="bold" /> Adicionar reserva semanal
      </Button>

      <Overlay
        open={open}
        onClose={() => { setOpen(false); setCreated(null); }}
        title="Reserva semanal"
        icon={<ArrowsClockwise size={18} weight="bold" className="text-gold" aria-hidden />}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sala">
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nome / grupo">
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Banda Juvenil EMM" />
            </Field>
            <Field label="Dia da semana">
              <Select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                {WEEKDAY_LABELS.map((w, i) => (
                  <option key={w} value={i}>{w}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Select value={start} onChange={(e) => changeStart(e.target.value)} className="numeral">
                  {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Fim">
                <Select value={end} onChange={(e) => setEnd(e.target.value)} className="numeral">
                  {ends.filter((t) => toMinutes(t) > toMinutes(start)).map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="De">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required className="numeral" />
            </Field>
            <Field label="Até">
              <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} required className="numeral" />
            </Field>
          </div>

          {error !== null && <p className="text-sm text-red">{error}</p>}

          {created !== null && (
            <p className="flex items-center gap-2 text-sm text-free-ink">
              <CheckCircle size={16} weight="fill" aria-hidden />
              {created} reserva(s) criada(s).
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "A criar…" : "Criar reservas"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setCreated(null); }}>Fechar</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
