import type { ReactNode } from "react";

/**
 * Section title framed by the brand's { } brace motif (design-system.md §5).
 * Discreet — a seasoning, not the main dish. `as` controls the heading level.
 */
export function SectionTitle({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`flex items-baseline gap-2 ${className}`}>
      <span aria-hidden className="font-display text-gold text-[0.85em] leading-none">
        {"{"}
      </span>
      {children}
      <span aria-hidden className="font-display text-gold text-[0.85em] leading-none">
        {"}"}
      </span>
    </Tag>
  );
}
