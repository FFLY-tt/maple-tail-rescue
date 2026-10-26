import { SelectField, TextareaField } from "@/components/apply/fields";
import type { ApplyAnimal, StepProps } from "@/components/apply/types";
import { GENERAL_APPLICATION } from "@/lib/application-schema";

export function StepAnimal({ form, animals }: StepProps & { animals: readonly ApplyAnimal[] }) {
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
      <TextareaField
        registration={register("whyInterested")}
        label="Why are you interested in adopting?"
        hint="A few sentences is plenty."
        rows={4}
        error={errors.whyInterested?.message}
      />
    </div>
  );
}
