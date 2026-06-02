import Image from "next/image";

/** Sober institutional footer with a subtle musical ornament. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-surface-1">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Image
          src="/brand/emm-symbol.png"
          alt=""
          aria-hidden
          width={40}
          height={52}
          className="h-11 w-auto opacity-90"
        />
        <p className="label-caps">Estação Musical de Monção</p>
        <p className="max-w-sm text-sm text-text-muted">
          Salas de ensaio. Consulte a disponibilidade e submeta o seu pedido de reserva.
        </p>
        <p className="text-xs text-navy-30">
          {new Date().getFullYear()} · Antiga Estação Ferroviária de Monção
        </p>
      </div>
    </footer>
  );
}
