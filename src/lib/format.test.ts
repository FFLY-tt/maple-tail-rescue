import { describe, expect, it } from "vitest";

import { formatDateTime } from "@/lib/format";

describe("formatDateTime", () => {
  it("shows a short date and time", () => {
    expect(formatDateTime("2026-10-28T19:42:00Z", "UTC")).toMatch(/^Oct 28, 2026,? 7:42\s?p\.?m\.?$/i);
  });

  it("uses the time zone it is given", () => {
    const toronto = formatDateTime("2026-10-28T19:42:00Z", "America/Toronto");
    expect(toronto).toMatch(/3:42\s?p\.?m\.?/i);
    expect(toronto).not.toEqual(formatDateTime("2026-10-28T19:42:00Z", "UTC"));
  });

  it("rolls over to the next day in later time zones", () => {
    expect(formatDateTime("2026-10-28T23:30:00Z", "Asia/Tokyo")).toMatch(/Oct 29, 2026/);
  });
});
