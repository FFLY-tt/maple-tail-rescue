import { getStatusLabel } from "@/lib/labels";
import type { AdoptionStatus } from "@/types/animal";

// Dark text on a light tint of each hue (all pairs exceed WCAG AA 4.5:1).
const STATUS_STYLES: Record<AdoptionStatus, string> = {
  available: "bg-green-100 text-green-900 ring-green-700/30",
  pending: "bg-amber-100 text-amber-900 ring-amber-700/30",
  adopted: "bg-stone-200 text-stone-800 ring-stone-600/30",
};

export function StatusBadge({ status }: { status: AdoptionStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
