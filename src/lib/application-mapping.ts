/**
 * The one place that translates between the app's camelCase application
 * (see application-schema.ts, the source of truth for the field rules) and the
 * snake_case columns of the `applications` table. Plain TypeScript, no framework
 * imports, so scripts can use it too.
 */
import { GENERAL_APPLICATION, type ApplicationInput } from "@/lib/application-schema";

export const APPLICATION_STATUSES = [
  "new",
  "in_review",
  "interviewed",
  "approved",
  "declined",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  in_review: "In review",
  interviewed: "Interviewed",
  approved: "Approved",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/** What the public form may insert. Everything else (id, status, notes, dates) takes its database default. */
export type NewApplicationRow = {
  full_name: string;
  email: string;
  phone: string;
  ownership: "own" | "rent";
  landlord_permission: "yes" | "no" | null;
  adults: string;
  children: string;
  household_agrees: "yes" | "no";
  has_pets: "yes" | "no";
  current_pets: string | null;
  experience: string;
  animal_slug: string | null;
  animal_name: string | null;
  why_interested: string;
};

/** A full row as staff read it back. */
export type ApplicationRow = NewApplicationRow & {
  id: string;
  created_at: string;
  updated_at: string;
  status: ApplicationStatus;
  staff_notes: string;
};

/** The same application in the app's camelCase shape. */
export type StoredApplication = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  email: string;
  phone: string;
  ownership: NewApplicationRow["ownership"];
  landlordPermission: NewApplicationRow["landlord_permission"];
  adults: string;
  children: string;
  householdAgrees: NewApplicationRow["household_agrees"];
  hasPets: NewApplicationRow["has_pets"];
  currentPets: string | null;
  experience: string;
  animalSlug: string | null;
  animalName: string | null;
  whyInterested: string;
  status: ApplicationStatus;
  staffNotes: string;
};

/**
 * Form values to a database row. Answers that only apply in some cases are
 * stored as NULL otherwise (the database constraints require it), and "No
 * specific animal yet" becomes a NULL animal.
 */
export function toApplicationRow(input: ApplicationInput, animalName?: string): NewApplicationRow {
  const renting = input.ownership === "rent";
  const hasPets = input.hasPets === "yes";
  const specificAnimal = input.animalSlug !== GENERAL_APPLICATION && animalName !== undefined;

  return {
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    ownership: input.ownership,
    landlord_permission: renting ? (input.landlordPermission ?? null) : null,
    adults: input.adults,
    children: input.children,
    household_agrees: input.householdAgrees,
    has_pets: input.hasPets,
    current_pets: hasPets ? (input.currentPets ?? null) : null,
    experience: input.experience,
    animal_slug: specificAnimal ? input.animalSlug : null,
    animal_name: specificAnimal ? animalName : null,
    why_interested: input.whyInterested,
  };
}

export function fromApplicationRow(row: ApplicationRow): StoredApplication {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    ownership: row.ownership,
    landlordPermission: row.landlord_permission,
    adults: row.adults,
    children: row.children,
    householdAgrees: row.household_agrees,
    hasPets: row.has_pets,
    currentPets: row.current_pets,
    experience: row.experience,
    animalSlug: row.animal_slug,
    animalName: row.animal_name,
    whyInterested: row.why_interested,
    status: row.status,
    staffNotes: row.staff_notes,
  };
}
