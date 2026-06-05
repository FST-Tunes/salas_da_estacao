import type { ComponentProps, ReactNode } from "react";

/**
 * Shared form primitives. Centralise the input/select styling that was
 * previously copy-pasted as `inputCls` / `selectCls` across the admin forms,
 * so every control looks and focuses the same way.
 */

const controlBase =
  "w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2 text-sm text-navy " +
  "outline-none transition-colors placeholder:text-navy-30 focus:border-navy disabled:opacity-60";

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${controlBase} ${className}`.trim()} {...rest} />;
}

export function Select({ className = "", children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={`${controlBase} ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
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
