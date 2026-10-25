import { RadioField, SelectField, TextField, TextareaField } from "@/components/apply/fields";
import {
  HOME_TYPE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
  YES_NO_OPTIONS,
} from "@/components/apply/options";
import type { StepProps } from "@/components/apply/types";

export function StepHome({ form }: StepProps) {
  const { register, watch, formState: { errors } } = form;
  const hasChildren = watch("hasChildren") === "yes";

  return (
    <div className="space-y-5">
      <SelectField
        registration={register("homeType")}
        label="Type of home"
        options={HOME_TYPE_OPTIONS}
        error={errors.homeType?.message}
      />
      <RadioField
        registration={register("ownership")}
        label="Do you own or rent?"
        options={OWNERSHIP_OPTIONS}
        error={errors.ownership?.message}
      />
      <SelectField
        registration={register("landlordPermission")}
        label="If you rent, does your landlord allow pets?"
        options={LANDLORD_OPTIONS}
        error={errors.landlordPermission?.message}
      />
      <SelectField
        registration={register("householdSize")}
        label="How many people live in your home?"
        options={HOUSEHOLD_OPTIONS}
        error={errors.householdSize?.message}
      />
      <RadioField
        registration={register("hasChildren")}
        label="Are there children under 16 in your home?"
        options={YES_NO_OPTIONS}
        error={errors.hasChildren?.message}
      />
      {hasChildren && (
        <TextField
          registration={register("childrenAges")}
          label="How old are they?"
          hint="Optional."
          error={errors.childrenAges?.message}
        />
      )}
      <RadioField
        registration={register("hasYard")}
        label="Do you have a yard or outdoor space?"
        options={YES_NO_OPTIONS}
        error={errors.hasYard?.message}
      />
      <TextareaField
        registration={register("otherPets")}
        label="Other pets in your home"
        hint="Optional. Tell us about any dogs, cats or other animals you live with."
        rows={3}
        error={errors.otherPets?.message}
      />
    </div>
  );
}
