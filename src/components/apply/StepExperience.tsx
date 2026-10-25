import { CheckboxField, SelectField, TextField, TextareaField } from "@/components/apply/fields";
import { EXPERIENCE_OPTIONS, HOURS_ALONE_OPTIONS } from "@/components/apply/options";
import type { ApplyAnimal, StepProps } from "@/components/apply/types";
import { GENERAL_APPLICATION } from "@/lib/application-schema";

export function StepExperience({ form, animals }: StepProps & { animals: readonly ApplyAnimal[] }) {
  const { register, formState: { errors } } = form;

  const animalOptions = [
    ...animals.map((animal) => ({ value: animal.slug, label: animal.label })),
    { value: GENERAL_APPLICATION, label: "No specific animal yet" },
  ];

  return (
    <div className="space-y-5">
      <SelectField
        registration={register("animalSlug")}
        label="Which animal are you applying for?"
        options={animalOptions}
        error={errors.animalSlug?.message}
      />
      <SelectField
        registration={register("experience")}
        label="Your experience with pets"
        options={EXPERIENCE_OPTIONS}
        error={errors.experience?.message}
      />
      <SelectField
        registration={register("hoursAlone")}
        label="How long would your new pet be alone on a typical day?"
        options={HOURS_ALONE_OPTIONS}
        error={errors.hoursAlone?.message}
      />
      <TextareaField
        registration={register("whyAdopt")}
        label="Why would you like to adopt, and what is your ideal match?"
        rows={5}
        error={errors.whyAdopt?.message}
      />
      <TextField
        registration={register("vetReference")}
        label="Veterinarian (if you have one)"
        hint="Optional. Clinic name and city."
        error={errors.vetReference?.message}
      />
      <CheckboxField
        registration={register("homeVisitOk")}
        label="I’m happy to have a home visit or video tour of my home as part of the process."
        error={errors.homeVisitOk?.message}
      />
    </div>
  );
}
