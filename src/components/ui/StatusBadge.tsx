import {
  Clock,
  CheckCircle,
  XCircle,
  Prohibit,
  Flag,
  Hourglass,
} from "@phosphor-icons/react/dist/ssr";
import type { BookingState } from "@/lib/types";
import { STATE_LABELS } from "@/lib/domain/booking";

// Badge colours per docs/design-system.md §3. Colour is never the only signal:
// each badge carries an icon and a text label (AA contrast).
const styles: Record<BookingState, { cls: string; Icon: typeof Clock }> = {
  pendente: { cls: "bg-pending-fill text-pending-ink", Icon: Clock },
  aprovada: { cls: "bg-busy-fill text-busy-ink", Icon: CheckCircle },
  rejeitada: { cls: "bg-busy-fill text-red", Icon: XCircle },
  cancelada: { cls: "bg-off-fill text-navy-60", Icon: Prohibit },
  concluida: { cls: "bg-[#f3eedf] text-gold", Icon: Flag },
  expirada: { cls: "bg-off-fill text-off-ink", Icon: Hourglass },
};

export function StatusBadge({ state, size = "md" }: { state: BookingState; size?: "sm" | "md" }) {
  const { cls, Icon } = styles[state];
  const dims = size === "sm" ? "text-[0.7rem] px-2 py-0.5" : "text-[0.75rem] px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm font-medium ${dims} ${cls}`}
    >
      <Icon size={size === "sm" ? 12 : 14} weight="bold" aria-hidden />
      {STATE_LABELS[state]}
    </span>
  );
}
