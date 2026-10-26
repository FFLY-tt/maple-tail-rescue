import { RadioField, SelectField } from "@/components/apply/fields";
import {
  ADULT_OPTIONS,
  CHILD_OPTIONS,
  HOUSEHOLD_AGREES_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
} from "@/components/apply/options";
import type { StepProps } from "@/components/apply/types";

export function StepHome({ form }: StepProps) {
  const { register, watch, formState: { errors } } = form;
  const renting = watch("ownership") === "rent";

  return (
    <div className="space-y-5">
      <RadioField
        registration={register("ownership")}
        label="Do you own or rent your home?"
        options={OWNERSHIP_OPTIONS}
        error={errors.ownership?.message}
      />
      {renting && (
        <RadioField
          registration={register("landlordPermission")}
          label="Does your landlord allow pets?"
          options={LANDLORD_OPTIONS}
          error={errors.landlordPermission?.message}
        />
      )}
      <SelectField
        registration={register("adults")}
        label="How many adults live in your home?"
        options={ADULT_OPTIONS}
        error={errors.adults?.message}
      />
      <SelectField
        registration={register("children")}
        label="How many children live in your home?"
        options={CHILD_OPTIONS}
        error={errors.children?.message}
      />
      <RadioField
        registration={register("householdAgrees")}
        label="Does everyone in your home agree to adopting?"
        options={HOUSEHOLD_AGREES_OPTIONS}
        error={errors.householdAgrees?.message}
      />
    </div>
  );
}
