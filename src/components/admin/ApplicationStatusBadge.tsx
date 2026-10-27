import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/application-mapping";

// Dark text on a light tint of each hue (all pairs exceed WCAG AA 4.5:1).
const STYLES: Record<ApplicationStatus, string> = {
  new: "bg-sky-100 text-sky-900 ring-sky-700/30",
  in_review: "bg-amber-100 text-amber-900 ring-amber-700/30",
  interviewed: "bg-violet-100 text-violet-900 ring-violet-700/30",
  approved: "bg-green-100 text-green-900 ring-green-700/30",
  declined: "bg-red-100 text-red-900 ring-red-700/30",
  withdrawn: "bg-stone-200 text-stone-800 ring-stone-600/30",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status]}`}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
