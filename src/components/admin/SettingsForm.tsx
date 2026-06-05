"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { updateSettingsAction } from "@/app/actions/admin";
import type { AppSettings } from "@/lib/types";

// Half-hour options for operating hours (00:00 … 24:00).
const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const m = i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [open, setOpen] = useState(settings.openTime);
  const [close, setClose] = useState(settings.closeTime === "00:00" ? "24:00" : settings.closeTime);
  const [advance, setAdvance] = useState(settings.maxAdvanceDays);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateSettingsAction({
        openTime: open,
        // store midnight as "00:00" per schema convention
        closeTime: close === "24:00" ? "00:00" : close,
        maxAdvanceDays: advance,
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-6">
      <fieldset className="space-y-3 rounded-lg border border-hairline bg-surface-0 p-5">
        <legend className="px-1 text-sm font-medium text-gold">Horário de funcionamento</legend>
        <p className="text-sm text-text-muted">
          O horário pode depender da disponibilidade de alguém para abrir as instalações.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Abertura">
            <Select value={open} onChange={(e) => setOpen(e.target.value)} className="numeral">
              {TIME_OPTIONS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Encerramento">
            <Select value={close} onChange={(e) => setClose(e.target.value)} className="numeral">
              {TIME_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{t === "24:00" ? "24:00 (meia-noite)" : t}</option>)}
            </Select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-hairline bg-surface-0 p-5">
        <legend className="px-1 text-sm font-medium text-gold">Antecedência máxima de reserva</legend>
        <Field label="Dias" className="max-w-28">
          <Input
            type="number"
            min={1}
            max={365}
            value={advance}
            onChange={(e) => setAdvance(Number(e.target.value))}
            className="numeral"
          />
        </Field>
        <p className="text-sm text-text-muted">Até quantos dias no futuro o público pode pedir uma reserva.</p>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "A guardar…" : "Guardar definições"}</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-free-ink">
            <CheckCircle size={16} weight="fill" aria-hidden /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}
