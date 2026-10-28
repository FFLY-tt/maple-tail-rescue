import { describe, expect, it } from "vitest";

import { sortAnimals } from "@/lib/animals";
import type { AdoptionStatus, Animal } from "@/types/animal";

function animal(name: string, status: AdoptionStatus): Animal {
  return {
    id: name.length,
    slug: name.toLowerCase(),
    name,
    species: "dog",
    ageGroup: "adult",
    size: "medium",
    sex: "male",
    goodWith: [],
    personality: "",
    status,
    photos: [],
  };
}

const names = (animals: readonly Animal[]) => animals.map((a) => a.name);

describe("sortAnimals", () => {
  it("puts available first, then pending, then adopted", () => {
    const sorted = sortAnimals([
      animal("Cleo", "adopted"),
      animal("Bo", "pending"),
      animal("Al", "available"),
    ]);
    expect(names(sorted)).toEqual(["Al", "Bo", "Cleo"]);
  });

  it("sorts by name within a status, ignoring case", () => {
    const sorted = sortAnimals([
      animal("maple", "available"),
      animal("Biscuit", "available"),
      animal("hazel", "available"),
    ]);
    expect(names(sorted)).toEqual(["Biscuit", "hazel", "maple"]);
  });

  it("sorts accented names alongside plain ones", () => {
    const sorted = sortAnimals([animal("Zoe", "available"), animal("Émile", "available"), animal("Eve", "available")]);
    expect(names(sorted)).toEqual(["Émile", "Eve", "Zoe"]);
  });

  it("returns a new array and leaves the input untouched", () => {
    const input = [animal("B", "adopted"), animal("A", "available")];
    const sorted = sortAnimals(input);
    expect(sorted).not.toBe(input);
    expect(names(input)).toEqual(["B", "A"]);
  });

  it("handles an empty list", () => {
    expect(sortAnimals([])).toEqual([]);
  });
});
