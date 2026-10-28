import { describe, expect, it } from "vitest";

import {
  APPLICATION_STEP_FIELDS,
  GENERAL_APPLICATION,
  applicationSchema,
  type ApplicationInput,
} from "@/lib/application-schema";

const valid = {
  fullName: "Sam Lee",
  email: "sam@example.com",
  phone: "416-555-0123",
  ownership: "own",
  adults: "2",
  children: "0",
  householdAgrees: "yes",
  hasPets: "no",
  experience: "Grew up with dogs",
  animalSlug: GENERAL_APPLICATION,
  whyInterested: "We have the time and space for a friend",
};

/** First error message for a field, or undefined when the field is fine. */
function errorFor(input: object, field: keyof ApplicationInput) {
  const result = applicationSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("applicationSchema: valid data", () => {
  it("accepts a complete application", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
  });

  it("trims text fields", () => {
    const result = applicationSchema.parse({ ...valid, fullName: "  Sam Lee  ", experience: "  lots  " });
    expect(result.fullName).toBe("Sam Lee");
    expect(result.experience).toBe("lots");
  });
});

describe("fullName", () => {
  it("rejects a name with no letters", () => {
    expect(errorFor({ ...valid, fullName: "645" }, "fullName")).toBe("Please enter your name using letters");
    expect(errorFor({ ...valid, fullName: "---" }, "fullName")).toBeDefined();
  });

  it("rejects empty and whitespace-only names", () => {
    expect(errorFor({ ...valid, fullName: "" }, "fullName")).toBe("Please enter your full name");
    expect(errorFor({ ...valid, fullName: "   " }, "fullName")).toBe("Please enter your full name");
  });

  it("rejects a name over 100 characters", () => {
    expect(errorFor({ ...valid, fullName: "a".repeat(101) }, "fullName")).toBe("That name is too long");
  });

  it.each(["Zoë O’Brien-Li", "李小龙", "Dr. Ana María", "R2D2 Smith"])("accepts %s", (fullName) => {
    expect(errorFor({ ...valid, fullName }, "fullName")).toBeUndefined();
  });
});

describe("email", () => {
  it.each(["sam@", "sam", "@example.com", "sam@example", "a b@c.com"])("rejects %s", (email) => {
    expect(errorFor({ ...valid, email }, "email")).toBe("Please enter a valid email address, like name@example.com");
  });

  it("accepts a normal address", () => {
    expect(errorFor({ ...valid, email: "first.last+tag@mail.example.org" }, "email")).toBeUndefined();
  });
});

describe("phone", () => {
  it.each(["416-555-0123", "(416) 555-0123", "+1 416 555 0123", "4165550123", "416.555.0123"])(
    "accepts %s",
    (phone) => {
      expect(errorFor({ ...valid, phone }, "phone")).toBeUndefined();
    },
  );

  it("rejects numbers that are too short or too long", () => {
    expect(errorFor({ ...valid, phone: "555-0123" }, "phone")).toMatch(/area code/);
    expect(errorFor({ ...valid, phone: "1".repeat(16) }, "phone")).toMatch(/area code/);
  });

  it("rejects letters and other characters", () => {
    expect(errorFor({ ...valid, phone: "416-CALL-NOW" }, "phone")).toBeDefined();
  });

  it("rejects an empty phone number", () => {
    expect(errorFor({ ...valid, phone: "" }, "phone")).toBe("Please enter a phone number");
  });
});

describe("landlord permission (only when renting)", () => {
  it("is required when renting", () => {
    expect(errorFor({ ...valid, ownership: "rent" }, "landlordPermission")).toBe(
      "Please tell us whether your landlord allows pets",
    );
    expect(errorFor({ ...valid, ownership: "rent", landlordPermission: null }, "landlordPermission")).toBeDefined();
  });

  it("is accepted when renting and answered either way", () => {
    for (const landlordPermission of ["yes", "no"]) {
      expect(applicationSchema.safeParse({ ...valid, ownership: "rent", landlordPermission }).success).toBe(true);
    }
  });

  it("is not required when owning, and a leftover answer is ignored", () => {
    expect(applicationSchema.safeParse({ ...valid, ownership: "own" }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...valid, ownership: "own", landlordPermission: null }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...valid, ownership: "own", landlordPermission: "no" }).success).toBe(true);
  });

  it("still reports the landlord error when other fields are also invalid", () => {
    // The form validates one step at a time, so this must not be hidden by other errors.
    const input = { ...valid, ownership: "rent", whyInterested: "" };
    expect(errorFor(input, "landlordPermission")).toBeDefined();
    expect(errorFor(input, "whyInterested")).toBeDefined();
  });
});

describe("current pets (only when the household has pets)", () => {
  it("requires a description when there are pets", () => {
    expect(errorFor({ ...valid, hasPets: "yes" }, "currentPets")).toBe("Please tell us a little about your pets");
    expect(errorFor({ ...valid, hasPets: "yes", currentPets: "   " }, "currentPets")).toBeDefined();
  });

  it("accepts a description when there are pets", () => {
    expect(applicationSchema.safeParse({ ...valid, hasPets: "yes", currentPets: "A 5-year-old beagle" }).success).toBe(
      true,
    );
  });

  it("does not require one when there are no pets", () => {
    expect(applicationSchema.safeParse({ ...valid, hasPets: "no" }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...valid, hasPets: "no", currentPets: "" }).success).toBe(true);
  });

  it("rejects a description over 500 characters", () => {
    const input = { ...valid, hasPets: "yes", currentPets: "x".repeat(501) };
    expect(errorFor(input, "currentPets")).toBe("Please keep this under 500 characters");
  });
});

describe("other required fields", () => {
  it.each([
    ["ownership", { ownership: undefined }],
    ["adults", { adults: "9" }],
    ["children", { children: undefined }],
    ["householdAgrees", { householdAgrees: "maybe" }],
    ["hasPets", { hasPets: undefined }],
    ["experience", { experience: "" }],
    ["animalSlug", { animalSlug: "" }],
    ["whyInterested", { whyInterested: "too short" }],
  ] as const)("rejects an invalid %s", (field, override) => {
    expect(errorFor({ ...valid, ...override }, field)).toBeDefined();
  });

  it("treats radio buttons nobody picked (null) as missing, not as a crash", () => {
    expect(errorFor({ ...valid, ownership: null, hasPets: null }, "ownership")).toBe("Please tell us if you own or rent");
    expect(errorFor({ ...valid, ownership: null, hasPets: null }, "hasPets")).toBe("Please choose yes or no");
  });
});

describe("APPLICATION_STEP_FIELDS", () => {
  it("covers every schema field exactly once, so no step can skip a field", () => {
    const stepFields = APPLICATION_STEP_FIELDS.flat().sort();
    const schemaFields = Object.keys(applicationSchema.shape).sort();
    expect(stepFields).toEqual(schemaFields);
  });
});
