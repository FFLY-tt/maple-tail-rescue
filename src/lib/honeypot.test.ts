import { describe, expect, it } from "vitest";

import { HONEYPOT_FIELD, MIN_HUMAN_MS, judgeHoneypot } from "@/lib/honeypot";

describe("judgeHoneypot", () => {
  it("treats an empty trap as a normal submission, however fast", () => {
    expect(judgeHoneypot("", 10_000)).toBe("clean");
    expect(judgeHoneypot("", 1)).toBe("clean");
    expect(judgeHoneypot("   ", 1)).toBe("clean");
  });

  it("drops a filled trap submitted faster than a person could", () => {
    expect(judgeHoneypot("http://spam.example", 0)).toBe("bot");
    expect(judgeHoneypot("x", MIN_HUMAN_MS - 1)).toBe("bot");
  });

  it("never drops a filled trap once a person-length time has passed (autofill)", () => {
    expect(judgeHoneypot("Sam Lee", MIN_HUMAN_MS)).toBe("filled-but-human");
    expect(judgeHoneypot("Sam Lee", 45_000)).toBe("filled-but-human");
  });

  it("uses a field name that autofill does not recognise", () => {
    expect(HONEYPOT_FIELD).not.toMatch(/website|url|email|phone|fax|name|address|company|nickname/i);
  });
});
