import { Lock, Clock, MinusCircle } from "@phosphor-icons/react";
import type { SlotState } from "@/lib/types";

/** Per-state cell fill/text classes, shared by the wizard picker and the
 *  admin read-only preview so the two never drift. Interactive hover cues
 *  (e.g. the free-block brighten) are added by the caller, not here. */
export const STATE_CLS: Record<SlotState, string> = {
  free: "bg-free-fill text-free-ink",
  pending: "bg-pending-fill text-pending-ink",
  busy: "bg-busy-fill text-busy-ink",
  off: "bg-off-fill text-off-ink",
};

/** Icon per non-free state — never colour alone (design-system §3). */
export const LOCKED_ICON = { pending: Clock, busy: Lock, off: MinusCircle } as const;
