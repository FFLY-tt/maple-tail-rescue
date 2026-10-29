/**
 * Labels for the application's answers, shared by the form and the admin pages.
 * Typed by field, so a value added to the schema must get a label here.
 */
import type { ApplicationInput } from "@/lib/application-schema";

export type Option = { value: string; label: string };

type OptionsFor<K extends keyof ApplicationInput> = readonly {
  value: NonNullable<ApplicationInput[K]>;
  label: string;
}[];

export const OWNERSHIP_OPTIONS: OptionsFor<"ownership"> = [
  { value: "own", label: "I own my home" },
  { value: "rent", label: "I rent" },
];

export const LANDLORD_OPTIONS: OptionsFor<"landlordPermission"> = [
  { value: "yes", label: "Yes, pets are allowed" },
  { value: "no", label: "No, or I’m not sure yet" },
];

export const ADULT_OPTIONS: OptionsFor<"adults"> = [
  { value: "1", label: "1 adult" },
  { value: "2", label: "2 adults" },
  { value: "3", label: "3 adults" },
  { value: "4-plus", label: "4 or more adults" },
];

export const CHILD_OPTIONS: OptionsFor<"children"> = [
  { value: "0", label: "No children" },
  { value: "1", label: "1 child" },
  { value: "2", label: "2 children" },
  { value: "3-plus", label: "3 or more children" },
];

export const HOUSEHOLD_AGREES_OPTIONS: OptionsFor<"householdAgrees"> = [
  { value: "yes", label: "Yes, everyone is on board" },
  { value: "no", label: "Not yet" },
];

export const HAS_PETS_OPTIONS: OptionsFor<"hasPets"> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Label for a stored value, falling back to the raw value. */
export function optionLabel(options: readonly Option[], value: string | undefined): string {
  return options.find((option) => option.value === value)?.label ?? value ?? "";
}
