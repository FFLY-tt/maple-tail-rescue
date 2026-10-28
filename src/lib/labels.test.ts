import { describe, expect, it } from "vitest";

import {
  AGE_GROUP_VALUES,
  SIZE_VALUES,
  SPECIES_VALUES,
  getAgeGroupLabel,
  getAgeLabel,
  getGoodWithLabel,
  getSexLabel,
  getSizeLabel,
  getSpeciesLabel,
  getStatusLabel,
} from "@/lib/labels";

describe("getAgeLabel", () => {
  it("says Puppy for a baby dog and Kitten for a baby cat", () => {
    expect(getAgeLabel({ ageGroup: "baby", species: "dog" })).toBe("Puppy");
    expect(getAgeLabel({ ageGroup: "baby", species: "cat" })).toBe("Kitten");
  });

  it.each([
    ["young", "Young"],
    ["adult", "Adult"],
    ["senior", "Senior"],
  ] as const)("labels %s as %s for either species", (ageGroup, label) => {
    expect(getAgeLabel({ ageGroup, species: "dog" })).toBe(label);
    expect(getAgeLabel({ ageGroup, species: "cat" })).toBe(label);
  });
});

describe("getAgeGroupLabel (species-agnostic, for filters)", () => {
  it("combines Puppy / Kitten for baby", () => {
    expect(getAgeGroupLabel("baby")).toBe("Puppy / Kitten");
  });

  it("labels the other groups", () => {
    expect(getAgeGroupLabel("young")).toBe("Young");
    expect(getAgeGroupLabel("adult")).toBe("Adult");
    expect(getAgeGroupLabel("senior")).toBe("Senior");
  });
});

describe("simple label helpers", () => {
  it("labels species, size, sex, good-with and status", () => {
    expect(getSpeciesLabel("dog")).toBe("Dog");
    expect(getSpeciesLabel("cat")).toBe("Cat");
    expect(getSizeLabel("medium")).toBe("Medium");
    expect(getSexLabel("female")).toBe("Female");
    expect(getGoodWithLabel("kids")).toBe("Kids");
    expect(getStatusLabel("pending")).toBe("Pending");
  });
});

describe("option lists", () => {
  it("are in display order and every value has a label", () => {
    expect(SPECIES_VALUES).toEqual(["dog", "cat"]);
    expect(SIZE_VALUES).toEqual(["small", "medium", "large"]);
    expect(AGE_GROUP_VALUES).toEqual(["baby", "young", "adult", "senior"]);
    for (const value of AGE_GROUP_VALUES) expect(getAgeGroupLabel(value)).toBeTruthy();
    for (const value of SIZE_VALUES) expect(getSizeLabel(value)).toBeTruthy();
  });
});
