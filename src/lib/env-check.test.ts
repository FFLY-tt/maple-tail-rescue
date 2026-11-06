import { describe, expect, it } from "vitest";

import { SKIP_FLAG, assertProductionEnv, findEnvProblems } from "@/lib/env-check";

const good = {
  NEXT_PUBLIC_FORMSPREE_ENDPOINT: "https://formspree.io/f/abcdwxyz".replace(" ", ""),
  NEXT_PUBLIC_SITE_URL: "https://www.mapletailrescue.org",
};

describe("findEnvProblems", () => {
  it("accepts real values", () => {
    expect(findEnvProblems(good)).toEqual([]);
  });

  it.each(Object.keys(good))("reports %s when it is missing or blank", (name) => {
    expect(findEnvProblems({ ...good, [name]: undefined })).toEqual([`${name} is not set`]);
    expect(findEnvProblems({ ...good, [name]: "   " })).toEqual([`${name} is not set`]);
  });

  it("reports every problem at once", () => {
    expect(findEnvProblems({})).toHaveLength(2);
  });

  it("rejects the placeholders from .env.example", () => {
    const problems = findEnvProblems({
      NEXT_PUBLIC_FORMSPREE_ENDPOINT: "https://formspree.io/f/your-form-id",
      NEXT_PUBLIC_SITE_URL: "https://www.example.org",
    });
    expect(problems).toHaveLength(2);
    expect(problems.join("\n")).toMatch(/placeholder/);
  });

  it("rejects the default site address from src/content/site.ts", () => {
    const problems = findEnvProblems({ ...good, NEXT_PUBLIC_SITE_URL: "https://www.mapletailrescue.example" });
    expect(problems).toEqual([expect.stringContaining("NEXT_PUBLIC_SITE_URL still points at a placeholder")]);
  });

  it.each(["http://localhost:3000", "https://127.0.0.1", "https://example.com", "https://shop.example.net"])(
    "rejects %s as a site address",
    (url) => {
      expect(findEnvProblems({ ...good, NEXT_PUBLIC_SITE_URL: url })).toHaveLength(1);
    },
  );

  it("requires https and a valid URL", () => {
    expect(findEnvProblems({ ...good, NEXT_PUBLIC_SITE_URL: "http://www.mapletailrescue.org" })).toEqual([
      expect.stringContaining("must start with https://"),
    ]);
    expect(findEnvProblems({ ...good, NEXT_PUBLIC_FORMSPREE_ENDPOINT: "not a url" })).toEqual([
      expect.stringContaining("not a valid URL"),
    ]);
  });
});

describe("assertProductionEnv", () => {
  it("passes with good values", () => {
    expect(assertProductionEnv(good)).toEqual({ skipped: false });
  });

  it("throws one clear error naming each problem and the escape hatch", () => {
    expect(() => assertProductionEnv({})).toThrow(/NEXT_PUBLIC_FORMSPREE_ENDPOINT is not set/);
    expect(() => assertProductionEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
    expect(() => assertProductionEnv({})).toThrow(new RegExp(`${SKIP_FLAG}=1`));
  });

  it("can be skipped explicitly, and only with exactly 1", () => {
    expect(assertProductionEnv({ [SKIP_FLAG]: "1" })).toEqual({ skipped: true });
    expect(() => assertProductionEnv({ [SKIP_FLAG]: "true" })).toThrow();
    expect(() => assertProductionEnv({ [SKIP_FLAG]: "0" })).toThrow();
  });
});
