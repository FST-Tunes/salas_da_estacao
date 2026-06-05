import type { ComponentProps, ReactNode } from "react";

/**
 * Shared form primitives. Centralise the input styling that was previously
 * copy-pasted across the admin forms so every control looks and focuses the
 * same way. Dropdowns/calendars use the custom Select / DatePicker (no native
 * controls) — Select is re-exported here for ergonomics.
 */

export { Select } from "./Select";
export type { SelectOption } from "./Select";
export { DatePicker } from "./DatePicker";

const controlBase =
  "w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2 text-sm text-navy " +
  "outline-none transition-colors placeholder:text-navy-30 focus:border-navy disabled:opacity-60";

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${controlBase} ${className}`.trim()} {...rest} />;
}

/** Label + control stack. `label` may be omitted for a bare wrapper. */
export function Field({
  label,
  children,
  className = "",
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-text-muted ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}
