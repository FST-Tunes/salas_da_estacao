"use client";

import { Check } from "@phosphor-icons/react";

export interface WizardStep {
  /** Short label, e.g. "Data". */
  label: string;
  /** Chosen value once the step is done, e.g. "14 maio". */
  value: string | null;
  /** True once this step has a committed value. */
  done: boolean;
  /** Can the user jump back to this step right now? */
  reachable: boolean;
}

/**
 * Linear progress header for the booking wizard. Shows the four steps with the
 * value chosen so far; completed steps are clickable to step back and change
 * a choice. The current step is framed with the brand brace motif.
 */
export function WizardSteps({
  steps,
  current,
  onJump,
}: {
  steps: WizardStep[];
  /** 1-based index of the active step. */
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Passos da reserva">
      {steps.map((s, i) => {
        const n = i + 1;
        const isCurrent = n === current;
        const clickable = s.reachable && !isCurrent;
        return (
          <li key={s.label} className="min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(n)}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors ${
                isCurrent
                  ? "border-navy bg-navy text-text-on-dark"
                  : s.done
                    ? "border-hairline bg-surface-0 text-navy hover:bg-navy/5"
                    : "border-hairline bg-surface-1/60 text-navy-30"
              } ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold ${
                  isCurrent
                    ? "bg-text-on-dark/20 text-text-on-dark"
                    : s.done
                      ? "bg-free-fill text-free-ink"
                      : "bg-surface-2 text-navy-30"
                }`}
              >
                {s.done && !isCurrent ? <Check size={13} weight="bold" aria-hidden /> : n}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.7rem] uppercase tracking-wide opacity-80">
                  {s.label}
                </span>
                <span className="block truncate text-[0.82rem] font-medium leading-tight">
                  {s.value ?? "–"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
