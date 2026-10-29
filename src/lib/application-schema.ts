/**
 * Adoption application schema. Pure Zod, no UI or framework imports, so the
 * same file can validate the form in the browser and rows on the server/DB.
 */
import { z } from "zod";

export const HOME_OWNERSHIP = ["own", "rent"] as const;
export const YES_NO = ["yes", "no"] as const;
export const ADULT_COUNTS = ["1", "2", "3", "4-plus"] as const;
export const CHILD_COUNTS = ["0", "1", "2", "3-plus"] as const;

/** `animalSlug` value for people who haven't picked a specific animal. */
export const GENERAL_APPLICATION = "general";

const required = (message: string) => z.string().trim().min(1, message);
const choice = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.enum(values, { error: message });

export const applicationSchema = z
  .object({
    // Contact
    fullName: required("Please enter your full name")
      .max(100, "That name is too long")
      .refine((value) => /\p{L}/u.test(value), "Please enter your name using letters"),
    email: z
      .email("Please enter a valid email address, like name@example.com")
      .max(200, "That email address is too long")
      // Zod's email check already refuses these; stated here so the rule doesn't depend on its
      // default, and mirrored by the database (002_*.sql). They are what turns an address into a mailto: header.
      .refine((value) => !/[?&]/.test(value), "Please enter a valid email address, like name@example.com"),
    phone: z
      .string()
      .trim()
      .min(1, "Please enter a phone number")
      .refine(
        (value) => /^[\d\s()+.-]+$/.test(value),
        "Phone numbers can only contain digits, spaces and + ( ) - .",
      )
      .refine((value) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 10 && digits <= 15;
      }, "Please enter a phone number with area code, like 416-555-0123"),

    // Home
    ownership: choice(HOME_OWNERSHIP, "Please tell us if you own or rent"),
    /** Only asked, and only required, when renting. */
    landlordPermission: z.enum(YES_NO).nullish(),

    // Household
    adults: choice(ADULT_COUNTS, "Please choose how many adults live in your home"),
    children: choice(CHILD_COUNTS, "Please choose how many children live in your home"),
    householdAgrees: choice(YES_NO, "Please tell us whether everyone in your home agrees"),

    // Current pets
    hasPets: choice(YES_NO, "Please choose yes or no"),
    /** Only asked, and only required, when you have pets. */
    currentPets: z.string().trim().max(500, "Please keep this under 500 characters").optional(),

    // Experience
    experience: required("Please tell us about your experience, or say it would be your first pet").max(
      1000,
      "Please keep this under 1000 characters",
    ),

    // Animal
    animalSlug: required("Please choose an animal, or “No specific animal yet”"),
    whyInterested: z
      .string()
      .trim()
      .min(10, "Please tell us a little more (at least 10 characters)")
      .max(1000, "Please keep this under 1000 characters"),
  })
  .superRefine((value, ctx) => {
    if (value.ownership === "rent" && !value.landlordPermission) {
      ctx.addIssue({
        code: "custom",
        path: ["landlordPermission"],
        message: "Please tell us whether your landlord allows pets",
      });
    }
    if (value.hasPets === "yes" && !value.currentPets) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPets"],
        message: "Please tell us a little about your pets",
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Fields validated at each form step, in order. */
export const APPLICATION_STEP_FIELDS = [
  ["fullName", "email", "phone"],
  ["ownership", "landlordPermission", "adults", "children", "householdAgrees"],
  ["hasPets", "currentPets", "experience"],
  ["animalSlug", "whyInterested"],
] as const satisfies readonly (readonly (keyof ApplicationInput)[])[];
