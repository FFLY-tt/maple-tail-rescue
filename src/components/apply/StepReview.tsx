import { CheckboxField } from "@/components/apply/fields";
import {
  EXPERIENCE_OPTIONS,
  HOME_TYPE_OPTIONS,
  HOURS_ALONE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
  YES_NO_OPTIONS,
  optionLabel,
} from "@/components/apply/options";
import type { ApplyAnimal, StepProps } from "@/components/apply/types";
import { GENERAL_APPLICATION } from "@/lib/application-schema";

type ReviewProps = StepProps & {
  animals: readonly ApplyAnimal[];
  /** Jump back to a step (0-based) to fix an answer. */
  onEdit: (step: number) => void;
};

function Section({
  title,
  step,
  onEdit,
  rows,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Edit ${title.toLowerCase()}`}
          className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
        >
          Edit
        </button>
      </div>
      <dl className="mt-2 space-y-3">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-sm font-semibold text-muted">{term}</dt>
            <dd className="whitespace-pre-wrap break-words">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StepReview({ form, animals, onEdit }: ReviewProps) {
  const { register, getValues, formState: { errors } } = form;
  const v = getValues();

  const animalName =
    v.animalSlug === GENERAL_APPLICATION
      ? "No specific animal yet"
      : (animals.find((animal) => animal.slug === v.animalSlug)?.name ?? v.animalSlug);

  return (
    <div className="space-y-5">
      <p className="text-muted">Please check your answers before sending.</p>

      <Section
        title="About you"
        step={0}
        onEdit={onEdit}
        rows={[
          ["Name", v.fullName],
          ["Email", v.email],
          ["Phone", v.phone],
          ["City", v.city],
        ]}
      />
      <Section
        title="Home and household"
        step={1}
        onEdit={onEdit}
        rows={[
          ["Type of home", optionLabel(HOME_TYPE_OPTIONS, v.homeType)],
          ["Own or rent", optionLabel(OWNERSHIP_OPTIONS, v.ownership)],
          ["Landlord allows pets", optionLabel(LANDLORD_OPTIONS, v.landlordPermission)],
          ["People in household", optionLabel(HOUSEHOLD_OPTIONS, v.householdSize)],
          [
            "Children under 16",
            v.hasChildren === "yes" && v.childrenAges
              ? `Yes (${v.childrenAges})`
              : optionLabel(YES_NO_OPTIONS, v.hasChildren),
          ],
          ["Yard or outdoor space", optionLabel(YES_NO_OPTIONS, v.hasYard)],
          ["Other pets", v.otherPets],
        ]}
      />
      <Section
        title="Experience and animal"
        step={2}
        onEdit={onEdit}
        rows={[
          ["Applying for", animalName],
          ["Experience", optionLabel(EXPERIENCE_OPTIONS, v.experience)],
          ["Time alone each day", optionLabel(HOURS_ALONE_OPTIONS, v.hoursAlone)],
          ["Why you’d like to adopt", v.whyAdopt],
          ["Veterinarian", v.vetReference],
        ]}
      />

      <CheckboxField
        registration={register("confirmAccurate")}
        label="I confirm the information above is accurate, and I understand Maple Tail Rescue may contact me to follow up."
        error={errors.confirmAccurate?.message}
      />
    </div>
  );
}
