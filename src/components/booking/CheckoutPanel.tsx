"use client";

import { Buildings, Stack, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export interface CheckoutSummary {
  roomName: string;
  anyRoom: boolean;
  dateLabel: string;
  rangeLabel: string;
  durationLabel: string;
}

/**
 * Step 4 — checkout. Docks to the bottom on mobile and to the side on desktop
 * once at least one slot is selected. Shows a one-line résumé above a single
 * confirm button (spec: "Sala 2 • 14 Maio • 10:00 - 11:30 (1h30)").
 */
export function CheckoutPanel({
  summary,
  name,
  phone,
  onNameChange,
  onPhoneChange,
  onSubmit,
  pending,
  error,
}: {
  summary: CheckoutSummary;
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error: string | null;
}) {
  const RoomIcon = summary.anyRoom ? Stack : Buildings;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="flex items-start gap-2.5 rounded-md bg-surface-1 px-3.5 py-3">
        <RoomIcon size={18} weight="bold" className="mt-0.5 shrink-0 text-navy" aria-hidden />
        <p className="text-sm leading-snug text-navy">
          <span className="font-medium">{summary.roomName}</span>
          <span className="text-navy-30"> • </span>
          {summary.dateLabel}
          <br />
          <span className="numeral text-navy">{summary.rangeLabel}</span>{" "}
          <span className="text-text-muted">({summary.durationLabel})</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bk-name" className="text-sm font-medium text-navy">
          Nome <span className="text-red">*</span>
        </label>
        <input
          id="bk-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          autoComplete="name"
          placeholder="O seu nome"
          className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none placeholder:text-navy-30 focus:border-navy"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bk-phone" className="text-sm font-medium text-navy">
          Telemóvel <span className="text-text-muted">(opcional)</span>
        </label>
        <input
          id="bk-phone"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="+351 …"
          className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none placeholder:text-navy-30 focus:border-navy"
        />
        <p className="text-xs text-text-muted">
          Usado apenas para o notificar da decisão. Nunca é mostrado publicamente.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-md bg-busy-fill px-3 py-2 text-sm text-busy-ink">
          <Warning size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "A confirmar…" : "Confirmar reserva"}
      </Button>
      <p className="text-center text-xs text-text-muted">O pedido fica pendente até aprovação.</p>
    </form>
  );
}
