/**
 * A timestamp from the database (ISO 8601, UTC) as a short local date and time,
 * e.g. "Oct 28, 2026, 3:42 p.m.". Uses the viewer's time zone unless one is given.
 */
export function formatDateTime(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone });
}
