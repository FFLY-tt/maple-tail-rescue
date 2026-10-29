import { describe, expect, it } from "vitest";

import { PHOTO_PATH, cardPhoto, ogPhoto } from "@/lib/photos";

describe("photo variants", () => {
  it("derives the card and link-preview paths from the large one", () => {
    expect(cardPhoto("/animals/mochi/main-800.webp")).toBe("/animals/mochi/main-400.webp");
    expect(ogPhoto("/animals/mochi/main-800.webp")).toBe("/animals/mochi/main-og.jpg");
    expect(cardPhoto("/animals/mochi/photo-2-800.webp")).toBe("/animals/mochi/photo-2-400.webp");
  });

  it("leaves a path that isn't a large version unchanged", () => {
    expect(cardPhoto("/animals/mochi/main.jpg")).toBe("/animals/mochi/main.jpg");
    expect(ogPhoto("/x/y.png")).toBe("/x/y.png");
  });
});

describe("PHOTO_PATH", () => {
  it.each(["/animals/mochi/main-800.webp", "/animals/earl-grey/photo-2-800.webp"])("accepts %s", (path) => {
    expect(PHOTO_PATH.test(path)).toBe(true);
  });

  it.each([
    "/animals/mochi/main.jpg",
    "/animals/mochi/main-400.webp",
    "animals/mochi/main-800.webp",
    "/animals/Mochi/main-800.webp",
    "/animals/mochi/../x-800.webp",
    "https://example.com/animals/mochi/main-800.webp",
    "",
  ])("rejects %s", (path) => {
    expect(PHOTO_PATH.test(path)).toBe(false);
  });
});
