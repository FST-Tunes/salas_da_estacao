import type { ReactNode } from "react";

/**
 * Empty state with a large Noto Music glyph watermark (decorative only) in
 * navy-30, per design-system.md §7. `glyph` is a musical symbol character.
 */
export function EmptyState({
  title,
  description,
  glyph = "𝄞",
  action,
}: {
  title: string;
  description?: string;
  glyph?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-0/60 px-6 py-14 text-center">
      <span
        aria-hidden
        className="font-music text-6xl leading-none text-navy-30 select-none"
      >
        {glyph}
      </span>
      <p className="mt-5 font-display text-lg text-navy">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
