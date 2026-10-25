/**
 * Adoption application schema. Pure Zod, no UI or framework imports, so the
 * same file can validate the form in the browser and rows on the server/DB.
 */
import { z } from "zod";

export const HOME_TYPES = ["house", "apartment", "condo", "other"] as const;
export const HOME_OWNERSHIP = ["own", "rent"] as const;
export const LANDLORD_PERMISSION = ["yes", "no", "not-applicable"] as const;
export const HOUSEHOLD_SIZES = ["1", "2", "3", "4", "5-plus"] as const;
export const YES_NO = ["yes", "no"] as const;
export const EXPERIENCE_LEVELS = ["first-time", "some", "experienced"] as const;
export const HOURS_ALONE = ["under-4", "4-to-8", "over-8"] as const;

/** `animalSlug` value for people who haven't picked a specific animal. */
export const GENERAL_APPLICATION = "general";

const required = (message: string) => z.string().trim().min(1, message);
const choice = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.enum(values, { error: message });
const mustBeTrue = (message: string) => z.boolean().refine((value) => value, message);

export const applicationSchema = z.object({
  // Step 1: applicant
  fullName: required("Please enter your full name").max(100, "That name is too long"),
  email: z.email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Please enter a 10-digit phone number")
    .refine((value) => /^[\d\s()+.-]+$/.test(value), "Phone numbers can only contain digits, spaces and + ( ) - ."),
  city: required("Please enter your city").max(100),
  isAdult: mustBeTrue("You must be 18 or older to adopt"),

  // Step 2: home and household
  homeType: choice(HOME_TYPES, "Please choose your type of home"),
  ownership: choice(HOME_OWNERSHIP, "Please tell us if you own or rent"),
  landlordPermission: choice(LANDLORD_PERMISSION, "Please choose an option"),
  householdSize: choice(HOUSEHOLD_SIZES, "Please choose how many people live with you"),
  hasChildren: choice(YES_NO, "Please choose yes or no"),
  childrenAges: z.string().trim().max(200, "Please keep this under 200 characters"),
  hasYard: choice(YES_NO, "Please choose yes or no"),
  otherPets: z.string().trim().max(500, "Please keep this under 500 characters"),

  // Step 3: experience and which animal
  animalSlug: required("Please choose an animal, or “No specific animal yet”"),
  experience: choice(EXPERIENCE_LEVELS, "Please choose your experience level"),
  hoursAlone: choice(HOURS_ALONE, "Please choose an option"),
  whyAdopt: z
    .string()
    .trim()
    .min(20, "Please tell us a little more (at least 20 characters)")
    .max(1000, "Please keep this under 1000 characters"),
  vetReference: z.string().trim().max(200, "Please keep this under 200 characters"),
  homeVisitOk: mustBeTrue("A home visit or video tour is part of our process"),

  // Step 4: review
  confirmAccurate: mustBeTrue("Please confirm your answers are accurate"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Fields validated at each form step, in order. */
export const APPLICATION_STEP_FIELDS = [
  ["fullName", "email", "phone", "city", "isAdult"],
  [
    "homeType",
    "ownership",
    "landlordPermission",
    "householdSize",
    "hasChildren",
    "childrenAges",
    "hasYard",
    "otherPets",
  ],
  ["animalSlug", "experience", "hoursAlone", "whyAdopt", "vetReference", "homeVisitOk"],
  ["confirmAccurate"],
] as const satisfies readonly (readonly (keyof ApplicationInput)[])[];
