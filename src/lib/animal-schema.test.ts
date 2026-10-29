import { describe, expect, it } from "vitest";

import animalsData from "@/data/animals.json";
import { AnimalDataError, parseAnimals } from "@/lib/animal-schema";

const mochi = {
  id: 22,
  slug: "mochi",
  name: "Mochi",
  species: "cat",
  ageGroup: "baby",
  size: "small",
  sex: "female",
  goodWith: ["cats", "kids"],
  personality: "Curious and playful.",
  status: "available",
  photos: ["/animals/mochi/main-800.webp"],
};
const hazel = { ...mochi, id: 17, slug: "hazel", name: "Hazel", species: "dog", photos: [] };

/** The message of the error parseAnimals throws for this data. */
function messageFor(data: unknown): string {
  try {
    parseAnimals(data);
  } catch (error) {
    expect(error).toBeInstanceOf(AnimalDataError);
    return (error as Error).message;
  }
  throw new Error("expected parseAnimals to throw");
}

describe("the real src/data/animals.json", () => {
  it("is valid (so the build can't be broken by a bad sync going unnoticed)", () => {
    expect(() => parseAnimals(animalsData)).not.toThrow();
  });
});

describe("parseAnimals: valid data", () => {
  it("returns the animals", () => {
    expect(parseAnimals([mochi, hazel])).toEqual([mochi, hazel]);
  });

  it("accepts an empty list, an animal with no photos and an empty personality", () => {
    expect(parseAnimals([])).toEqual([]);
    expect(parseAnimals([{ ...mochi, photos: [], personality: "", goodWith: [] }])).toHaveLength(1);
  });
});

describe("parseAnimals: errors point to the bad record", () => {
  it("names the record, its slug and id, and the field", () => {
    const message = messageFor([mochi, { ...hazel, species: "hamster" }]);
    expect(message).toContain("src/data/animals.json is not valid:");
    expect(message).toContain('record 2 (slug "hazel", id 17)');
    expect(message).toContain("species:");
    expect(message).not.toContain("record 1");
    expect(message).toContain("npm run sync");
  });

  it("lists every problem, across records and fields", () => {
    const message = messageFor([{ ...mochi, size: "huge", status: "lost" }, { ...hazel, sex: "x" }]);
    expect(message).toMatch(/record 1 \(slug "mochi", id 22\): size:/);
    expect(message).toMatch(/record 1 \(slug "mochi", id 22\): status:/);
    expect(message).toMatch(/record 2 \(slug "hazel", id 17\): sex:/);
  });

  it("rejects a missing field and an unknown one", () => {
    const noName: Partial<typeof mochi> = { ...mochi };
    delete noName.name;
    expect(messageFor([noName])).toMatch(/record 1 \(slug "mochi", id 22\): name:/);
    expect(messageFor([{ ...mochi, colour: "orange" }])).toMatch(/record 1 .*colour|Unrecognized key/i);
  });

  it("rejects a bad goodWith value", () => {
    expect(messageFor([{ ...mochi, goodWith: ["cats", "horses"] }])).toMatch(/goodWith\.1:/);
  });

  it("rejects a photo path from before the resize (or any other shape)", () => {
    expect(messageFor([{ ...mochi, photos: ["/animals/mochi/main.jpg"] }])).toMatch(/photos\.0: must be a/);
    expect(messageFor([{ ...mochi, photos: ["https://example.com/a-800.webp"] }])).toMatch(/photos\.0:/);
  });

  it("rejects an unusable slug or id", () => {
    expect(messageFor([{ ...mochi, slug: "Mochi Cat" }])).toMatch(/slug:/);
    expect(messageFor([{ ...mochi, id: 1.5 }])).toMatch(/id:/);
    expect(messageFor([{ ...mochi, id: "22" }])).toMatch(/id:/);
  });

  it("rejects duplicate slugs and ids, naming the later record and the earlier one", () => {
    expect(messageFor([mochi, { ...hazel, slug: "mochi" }])).toMatch(
      /record 2 \(slug "mochi", id 17\): slug: duplicates slug "mochi" of record 1/,
    );
    expect(messageFor([mochi, { ...hazel, id: 22 }])).toMatch(/record 2 .*id: duplicates id "22" of record 1/);
  });

  it("still names the record when it is badly broken", () => {
    expect(messageFor([mochi, { slug: "hazel" }])).toContain('record 2 (slug "hazel")');
    expect(messageFor([mochi, null])).toContain("record 2:");
    expect(messageFor([mochi, "oops"])).toContain("record 2:");
  });

  it("rejects data that isn't a list", () => {
    expect(messageFor({ animals: [] })).toMatch(/is not valid/);
    expect(messageFor(null)).toMatch(/is not valid/);
  });

  it("says which file it was reading", () => {
    expect(() => parseAnimals(null, ".sync-staging/animals.json")).toThrow(/^\.sync-staging\/animals\.json is not valid/);
  });
});
