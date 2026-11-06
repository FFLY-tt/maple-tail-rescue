/**
 * Sends an adoption application to the rescue by email through Formspree.
 * `buildSubmission` is pure so it can be unit-tested; `submitApplication` does the request.
 */
import {
  ADULT_OPTIONS,
  CHILD_OPTIONS,
  HAS_PETS_OPTIONS,
  HOUSEHOLD_AGREES_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
  optionLabel,
} from "@/lib/application-options";
import { GENERAL_APPLICATION, type ApplicationInput } from "@/lib/application-schema";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** Shown in the email subject and body when the applicant hasn't picked an animal. */
export const NO_SPECIFIC_ANIMAL = "No specific animal";

/**
 * The fields of the email, in reading order, with human field names and answers.
 * `_subject` and `_replyto` are Formspree's own fields: the subject line, and who
 * the rescue's "Reply" goes to. The bot trap is always sent empty: Formspree silently
 * discards anything with `_gotcha` filled, and an autofilled real application must get through.
 */
export function buildSubmission(input: ApplicationInput, animalName?: string): Record<string, string> {
  const animal = input.animalSlug !== GENERAL_APPLICATION && animalName ? animalName : undefined;
  const renting = input.ownership === "rent";
  const hasPets = input.hasPets === "yes";

  return {
    _subject: `Adoption application: ${animal ?? NO_SPECIFIC_ANIMAL}`,
    _replyto: input.email,
    [HONEYPOT_FIELD]: "",
    Animal: animal ?? NO_SPECIFIC_ANIMAL,
    "Full name": input.fullName,
    Email: input.email,
    Phone: input.phone,
    "Own or rent": optionLabel(OWNERSHIP_OPTIONS, input.ownership),
    ...(renting && { "Landlord allows pets": optionLabel(LANDLORD_OPTIONS, input.landlordPermission ?? undefined) }),
    Adults: optionLabel(ADULT_OPTIONS, input.adults),
    Children: optionLabel(CHILD_OPTIONS, input.children),
    "Everyone at home agrees": optionLabel(HOUSEHOLD_AGREES_OPTIONS, input.householdAgrees),
    "Has pets now": optionLabel(HAS_PETS_OPTIONS, input.hasPets),
    ...(hasPets && { "Current pets": input.currentPets ?? "" }),
    "Experience with pets": input.experience,
    "Why they want to adopt": input.whyInterested,
  };
}

/** Sends the application. Throws if there is no endpoint, the network fails, or Formspree refuses it. */
export async function submitApplication(input: ApplicationInput, animalName?: string): Promise<void> {
  // Read directly (not through a variable) so Next.js can inline the value into the build.
  const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
  if (!endpoint) throw new Error("NEXT_PUBLIC_FORMSPREE_ENDPOINT is not set.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(buildSubmission(input, animalName)),
  });
  if (!response.ok) throw new Error(`Formspree answered ${response.status}.`);
}
