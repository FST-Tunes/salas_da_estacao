import Link from "next/link";
import { Logo } from "./Logo";

/**
 * Public header — azul-claro surface, navy ink, single-line nav.
 * Sticky so availability stays reachable while scrolling the grid on mobile.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface-2/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
          <Link
            href="/"
            className="rounded-sm px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Disponibilidade
          </Link>
          <Link
            href="/admin/login"
            className="rounded-sm px-3 py-2 text-sm font-medium text-text-muted hover:text-navy hover:bg-navy/5"
          >
            Área reservada
          </Link>
        </nav>
      </div>
    </header>
  );
}
