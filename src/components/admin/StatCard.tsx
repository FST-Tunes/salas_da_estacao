import type { ReactNode } from "react";

/** Dashboard metric card — gold label, big Nocturne numeral. Sober, tabular. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "pending" | "alert";
}) {
  const valueTone =
    tone === "pending" ? "text-pending-ink" : tone === "alert" ? "text-off-ink" : "text-navy";
  return (
    <div className="rounded-lg border border-hairline bg-surface-0 p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-gold">{label}</p>
      <p className={`mt-2 font-display text-4xl leading-none ${valueTone}`}>
        <span className="numeral">{value}</span>
      </p>
      {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
