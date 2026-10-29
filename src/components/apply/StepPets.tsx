import { RadioField, TextareaField } from "@/components/apply/fields";
import { HAS_PETS_OPTIONS } from "@/lib/application-options";
import type { StepProps } from "@/components/apply/types";

export function StepPets({ form }: StepProps) {
  const { register, watch, clearErrors, setValue, formState: { errors } } = form;
  const hasPets = watch("hasPets") === "yes";

  return (
    <div className="space-y-5">
      <RadioField
        registration={register("hasPets", {
          // The description only applies to people who have pets; switching to "No" forgets it and any error.
          onChange: (event) => {
            if (event.target.value !== "yes") {
              clearErrors("currentPets");
              setValue("currentPets", "");
            }
          },
        })}
        label="Do you have pets right now?"
        options={HAS_PETS_OPTIONS}
        error={errors.hasPets?.message}
      />
      {hasPets && (
        <TextareaField
          registration={register("currentPets")}
          label="Tell us about your pets"
          hint="For example: a 5-year-old beagle who is friendly with other dogs."
          rows={3}
          error={errors.currentPets?.message}
        />
      )}
      <TextareaField
        registration={register("experience")}
        label="Your experience with pets"
        hint="Past pets, fostering, volunteering. If this would be your first pet, just say so."
        rows={4}
        error={errors.experience?.message}
      />
    </div>
  );
}
