"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Prohibit, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Field, Input, Select } from "@/components/ui/Field";
import { toMinutes } from "@/lib/time/blocks";
import { createBlocksAction } from "@/app/actions/admin";

interface Props {
  /** Active rooms offered in the picker. Ignored when `fixedRoom` is set. */
  rooms: { id: string; name: string }[];
  blocks: string[];
  ends: string[];
  /** Pre-selected day. */
  defaultDate: string;
  /** When set, the block targets this room only (room picker is hidden). */
  fixedRoom?: { id: string; name: string };
}

/**
 * Create a one-off block (not recurring): makes a room — or every active room —
 * unavailable for a slot or the whole day. Reuses the booking overlap lock, so
 * a room already booked in that range is skipped and reported.
 */
export function BlockForm({ rooms, blocks, ends, defaultDate, fixedRoom }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(defaultDate);
  // "" = todas as salas; otherwise a room id.
  const [roomId, setRoomId] = useState<string>(fixedRoom?.id ?? "");
  const [fullDay, setFullDay] = useState(false);
  const [start, setStart] = useState(blocks[0] ?? "08:00");
  const [end, setEnd] = useState(ends.find((t) => toMinutes(t) > toMinutes(blocks[0] ?? "08:00")) ?? ends[0] ?? "09:00");
  const [reason, setReason] = useState("");

  function changeStart(next: string) {
    setStart(next);
    if (toMinutes(end) <= toMinutes(next)) {
      setEnd(ends.find((t) => toMinutes(t) > toMinutes(next)) ?? end);
    }
  }

  function reset() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const startTime = fullDay ? (blocks[0] ?? start) : start;
    const endTime = fullDay ? (ends[ends.length - 1] ?? end) : end;
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError("A hora de fim tem de ser depois da de início.");
      return;
    }

    startTransition(async () => {
      const res = await createBlocksAction({
        roomId: fixedRoom?.id ?? (roomId || null),
        date,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
      });
      setResult(res);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Prohibit size={15} weight="bold" /> Bloquear {fixedRoom ? "horário" : "dia / sala"}
      </Button>

      <Overlay
        open={open}
        onClose={reset}
        title={fixedRoom ? `Bloquear · ${fixedRoom.name}` : "Bloquear dia / sala"}
        icon={<Prohibit size={18} weight="bold" className="text-navy" aria-hidden />}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-text-muted">
            Torna o horário indisponível para novos pedidos (bloqueio pontual, não se repete).
            {!fixedRoom && " Escolha uma sala específica ou todas as salas ativas."}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dia">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>

            {fixedRoom ? (
              <Field label="Sala">
                <Input value={fixedRoom.name} disabled />
              </Field>
            ) : (
              <Field label="Sala">
                <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                  <option value="">Todas as salas ativas</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={fullDay}
              onChange={(e) => setFullDay(e.target.checked)}
              className="h-4 w-4 rounded border-navy/30 text-navy accent-navy"
            />
            Dia inteiro
          </label>

          {!fullDay && (
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
          )}

          <Field label="Motivo (opcional)">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Manutenção, Evento privado"
              maxLength={60}
            />
          </Field>

          {error !== null && <p className="text-sm text-red">{error}</p>}

          {result !== null && (
            <p className="flex items-start gap-2 text-sm text-free-ink">
              <CheckCircle size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
              <span>
                {result.created} bloqueio(s) criado(s)
                {result.skipped > 0 && `. ${result.skipped} sala(s) ignorada(s) por já terem reservas neste horário.`}
              </span>
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "A bloquear…" : "Bloquear"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>Fechar</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
