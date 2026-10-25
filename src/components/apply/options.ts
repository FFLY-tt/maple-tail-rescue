import type { Option } from "@/components/apply/fields";
import type { ApplicationInput } from "@/lib/application-schema";

// Typed by field so a value added to the schema must get a label here.
type OptionsFor<K extends keyof ApplicationInput> = readonly {
  value: ApplicationInput[K];
  label: string;
}[];

export const HOME_TYPE_OPTIONS: OptionsFor<"homeType"> = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo / townhouse" },
  { value: "other", label: "Other" },
];

export const OWNERSHIP_OPTIONS: OptionsFor<"ownership"> = [
  { value: "own", label: "I own my home" },
  { value: "rent", label: "I rent" },
];

export const LANDLORD_OPTIONS: OptionsFor<"landlordPermission"> = [
  { value: "yes", label: "Yes, pets are allowed" },
  { value: "no", label: "No / not sure yet" },
  { value: "not-applicable", label: "Not applicable (I own)" },
];

export const HOUSEHOLD_OPTIONS: OptionsFor<"householdSize"> = [
  { value: "1", label: "Just me" },
  { value: "2", label: "2 people" },
  { value: "3", label: "3 people" },
  { value: "4", label: "4 people" },
  { value: "5-plus", label: "5 or more" },
];

export const YES_NO_OPTIONS: OptionsFor<"hasChildren"> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const EXPERIENCE_OPTIONS: OptionsFor<"experience"> = [
  { value: "first-time", label: "This would be my first pet" },
  { value: "some", label: "I’ve had pets before" },
  { value: "experienced", label: "I’m very experienced with this species" },
];

export const HOURS_ALONE_OPTIONS: OptionsFor<"hoursAlone"> = [
  { value: "under-4", label: "Under 4 hours" },
  { value: "4-to-8", label: "4 to 8 hours" },
  { value: "over-8", label: "More than 8 hours" },
];

/** Label for a stored value, falling back to the raw value. */
export function optionLabel(options: readonly Option[], value: string | undefined): string {
  return options.find((option) => option.value === value)?.label ?? value ?? "";
}
