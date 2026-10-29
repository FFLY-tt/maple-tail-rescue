import { describe, expect, it } from "vitest";

import {
  ADULT_OPTIONS,
  CHILD_OPTIONS,
  HAS_PETS_OPTIONS,
  HOUSEHOLD_AGREES_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
  optionLabel,
} from "@/lib/application-options";
import { ADULT_COUNTS, CHILD_COUNTS, HOME_OWNERSHIP, YES_NO } from "@/lib/application-schema";

describe("every value the schema allows has a label", () => {
  const cases = [
    ["ownership", OWNERSHIP_OPTIONS, HOME_OWNERSHIP],
    ["landlordPermission", LANDLORD_OPTIONS, YES_NO],
    ["adults", ADULT_OPTIONS, ADULT_COUNTS],
    ["children", CHILD_OPTIONS, CHILD_COUNTS],
    ["householdAgrees", HOUSEHOLD_AGREES_OPTIONS, YES_NO],
    ["hasPets", HAS_PETS_OPTIONS, YES_NO],
  ] as const;

  it.each(cases)("%s", (_field, options, allowed) => {
    expect(options.map((option) => option.value)).toEqual([...allowed]);
    for (const option of options) expect(option.label.trim()).not.toBe("");
  });
});

describe("optionLabel", () => {
  it("finds the label of a value", () => {
    expect(optionLabel(OWNERSHIP_OPTIONS, "rent")).toBe("I rent");
  });

  it("falls back to the raw value, or an empty string", () => {
    expect(optionLabel(OWNERSHIP_OPTIONS, "squat")).toBe("squat");
    expect(optionLabel(OWNERSHIP_OPTIONS, undefined)).toBe("");
  });
});
