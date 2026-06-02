"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Buildings, Stack, Warning } from "@phosphor-icons/react";
import { ScheduleGrid, type DisplayCell, type GridSelection } from "./ScheduleGrid";
import { Button } from "@/components/ui/Button";
import { blockEnd, formatRange } from "@/lib/time/blocks";
import { formatLongDate } from "@/lib/time/dates";
import { submitBooking } from "@/app/actions/booking";

const ANY_COL = "__any__";

interface BookingPlannerProps {
  date: string;
  rooms: { id: string; name: string }[];
  blocks: string[];
  roomCells: Record<string, DisplayCell[]>;
  anyCells: DisplayCell[];
}

type Mode = "specific" | "any";

export function BookingPlanner({ date, rooms, blocks, roomCells, anyCells }: BookingPlannerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("specific");
  const [anchor, setAnchor] = useState<{ col: string; idx: number } | null>(null);
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const columns =
    mode === "any" ? [{ id: ANY_COL, name: "Qualquer sala" }] : rooms;
  const cellsByCol = mode === "any" ? { [ANY_COL]: anyCells } : roomCells;

  function switchMode(next: Mode) {
    setMode(next);
    setAnchor(null);
    setSelection(null);
    setError(null);
  }

  function handleCellClick(colId: string, idx: number) {
    const cells = cellsByCol[colId];
    const inCurrent =
      selection?.colId === colId && idx >= selection.startIdx && idx <= selection.endIdx;
    if (cells[idx].state !== "free" && !inCurrent) return;
    setError(null);

    if (!anchor || anchor.col !== colId) {
      setAnchor({ col: colId, idx });
      setSelection({ colId, startIdx: idx, endIdx: idx });
      return;
    }
    if (selection && selection.startIdx === selection.endIdx && selection.startIdx === idx) {
      setAnchor(null);
      setSelection(null);
      return;
    }
    const lo = Math.min(anchor.idx, idx);
    const hi = Math.max(anchor.idx, idx);
    let contiguous = true;
    for (let i = lo; i <= hi; i++) {
      if (cells[i].state !== "free") {
        contiguous = false;
        break;
      }
    }
    if (contiguous) {
      setSelection({ colId, startIdx: lo, endIdx: hi });
    } else {
      setAnchor({ col: colId, idx });
      setSelection({ colId, startIdx: idx, endIdx: idx });
    }
  }

  const startTime = selection ? blocks[selection.startIdx] : null;
  const endTime = selection ? blockEnd(blocks[selection.endIdx]) : null;
  const roomName =
    selection && mode === "specific"
      ? rooms.find((r) => r.id === selection.colId)?.name ?? ""
      : "Qualquer sala disponível";

  function reset() {
    setAnchor(null);
    setSelection(null);
    setName("");
    setPhone("");
    setError(null);
    setDone(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selection || !startTime || !endTime) {
      setError("Selecione um horário no quadro.");
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
        roomId: mode === "specific" ? selection.colId : null,
        anyRoom: mode === "any",
      });
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error ?? "Não foi possível submeter o pedido.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Grid + mode toggle */}
      <div className="space-y-4">
        <ModeToggle mode={mode} onChange={switchMode} />
        <p className="text-sm text-text-muted">
          {mode === "specific"
            ? "Toque num bloco livre da sala pretendida e depois no fim do intervalo. O conjunto é abraçado por uma chaveta."
            : "Toque nos blocos de 30 min pretendidos. O administrador atribui a sala disponível ao aprovar."}
        </p>
        <ScheduleGrid
          blocks={blocks}
          columns={columns}
          cellsByCol={cellsByCol}
          selection={selection}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Summary + form */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border border-hairline bg-surface-0 p-5 shadow-sm">
          {done ? (
            <Confirmation onAgain={reset} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display text-lg text-navy">O seu pedido</h3>

              <SummaryRow
                Icon={mode === "any" ? Stack : Buildings}
                label="Sala"
                value={selection ? roomName : "—"}
              />
              <SummaryRow
                Icon={ArrowRight}
                label="Horário"
                value={
                  selection ? (
                    <span className="brace-frame numeral text-navy">
                      {formatRange(startTime!, endTime!)}
                    </span>
                  ) : (
                    "Selecione no quadro"
                  )
                }
              />
              <p className="text-xs text-text-muted">{formatLongDate(date)}</p>

              <div className="h-px bg-hairline" />

              <Field id="name" label="Nome" required>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none placeholder:text-navy-30 focus:border-navy"
                  placeholder="O seu nome"
                />
              </Field>

              <Field id="phone" label="Telemóvel (opcional)">
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none placeholder:text-navy-30 focus:border-navy"
                  placeholder="+351 ..."
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Se fornecer o seu número de telemóvel poderá ser notificado quando o pedido for
                  aprovado, rejeitado ou alterado.
                </p>
              </Field>

              {error && (
                <p className="flex items-start gap-2 rounded-md bg-busy-fill px-3 py-2 text-sm text-busy-ink">
                  <Warning size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
                  {error}
                </p>
              )}

              <Button type="submit" disabled={!selection || pending} className="w-full">
                {pending ? "A submeter…" : "Submeter pedido"}
              </Button>
              <p className="text-center text-xs text-text-muted">
                O pedido fica pendente até aprovação.
              </p>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const opt = (m: Mode, Icon: typeof Buildings, label: string) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      aria-pressed={mode === m}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
        mode === m ? "bg-navy text-text-on-dark" : "text-navy hover:bg-navy/5"
      }`}
    >
      <Icon size={16} weight="bold" aria-hidden />
      {label}
    </button>
  );
  return (
    <div className="inline-flex w-full gap-1 rounded-lg border border-hairline bg-surface-0 p-1 sm:w-auto">
      {opt("specific", Buildings, "Sala específica")}
      {opt("any", Stack, "Qualquer sala disponível")}
    </div>
  );
}

function SummaryRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof Buildings;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-text-muted">
        <Icon size={15} weight="bold" aria-hidden />
        {label}
      </span>
      <span className="text-right text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Confirmation({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CheckCircle size={40} weight="fill" className="text-free-ink" aria-hidden />
      <h3 className="font-display text-lg text-navy">Pedido submetido</h3>
      <p className="text-sm text-text-muted">
        Fica pendente até aprovação. Se indicou o telemóvel, será notificado da decisão.
      </p>
      <Button variant="secondary" size="sm" onClick={onAgain} className="mt-1">
        Fazer outro pedido
      </Button>
    </div>
  );
}
