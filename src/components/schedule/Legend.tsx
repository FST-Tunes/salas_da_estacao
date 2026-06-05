import { Check, Clock, Lock, MinusCircle, Prohibit } from "@phosphor-icons/react/dist/ssr";

// Availability legend (design-system.md §3). Colour + icon + label — never
// colour alone. Mirrors the cell rendering in BlockCell.
const items = [
  { label: "Disponível", cls: "bg-free-fill text-free-ink", Icon: Check },
  { label: "Pendente", cls: "bg-pending-fill text-pending-ink", Icon: Clock },
  { label: "Ocupada", cls: "bg-busy-fill text-busy-ink", Icon: Lock },
  { label: "Indisponível", cls: "bg-navy/10 text-navy", Icon: Prohibit },
  { label: "Fora de horário", cls: "bg-off-fill text-off-ink", Icon: MinusCircle },
];

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Legenda dos estados">
      {items.map(({ label, cls, Icon }) => (
        <li key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm ${cls}`}>
            <Icon size={12} weight="bold" aria-hidden />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
