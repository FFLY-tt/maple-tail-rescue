"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

import { ApplicationSuccess } from "@/components/apply/ApplicationSuccess";
import { StepAnimal } from "@/components/apply/StepAnimal";
import { StepApplicant } from "@/components/apply/StepApplicant";
import { StepHome } from "@/components/apply/StepHome";
import { StepIndicator } from "@/components/apply/StepIndicator";
import { StepPets } from "@/components/apply/StepPets";
import type { ApplyAnimal } from "@/components/apply/types";
import { Button } from "@/components/ui/Button";
import {
  APPLICATION_STEP_FIELDS,
  applicationSchema,
  type ApplicationInput,
} from "@/lib/application-schema";

const STEP_TITLES = [
  "About you",
  "Home and household",
  "Pets and experience",
  "Your match",
] as const;

const LAST_STEP = STEP_TITLES.length - 1;

export function ApplicationForm({ animals }: { animals: readonly ApplyAnimal[] }) {
  // Reading search params is why this component sits inside <Suspense> on the page.
  const requested = useSearchParams().get("animal");
  const preselected = animals.find((animal) => animal.slug === requested)?.slug;

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      currentPets: "",
      experience: "",
      animalSlug: preselected ?? "",
      whyInterested: "",
    },
  });

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<ApplicationInput | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);

  // After a step change, move focus to the new step's heading (not on first render).
  useEffect(() => {
    if (moveFocus.current) {
      moveFocus.current = false;
      headingRef.current?.focus();
    }
  }, [step]);

  function goTo(next: number) {
    moveFocus.current = true;
    setStep(next);
  }

  async function goNext() {
    const fields = APPLICATION_STEP_FIELDS[step];
    const valid = await form.trigger([...fields], { shouldFocus: true });
    if (!valid) {
      // Mark failing fields as touched so each error clears as soon as the
      // user fixes it, not only on blur (which shifts the layout mid-click).
      for (const field of fields) {
        if (form.getFieldState(field).error) {
          form.setValue(field, form.getValues(field), { shouldTouch: true });
        }
      }
      return;
    }
    if (step < LAST_STEP) goTo(step + 1);
  }

  // A field from an earlier step is invalid (e.g. after editing): jump back to it.
  function onInvalid(errors: FieldErrors<ApplicationInput>) {
    const failedStep = APPLICATION_STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => errors[field]),
    );
    if (failedStep !== -1 && failedStep !== step) goTo(failedStep);
  }

  if (submitted) {
    const animal = animals.find((a) => a.slug === submitted.animalSlug);
    return (
      <ApplicationSuccess
        applicantName={submitted.fullName}
        email={submitted.email}
        animal={animal}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        // On earlier steps (Next button or Enter) advance instead of submitting.
        if (step < LAST_STEP) return void goNext();
        void form.handleSubmit(setSubmitted, onInvalid)(event);
      }}
      className="space-y-6"
    >
      <StepIndicator titles={STEP_TITLES} current={step} />

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mb-6 font-display text-2xl font-bold outline-none"
        >
          {STEP_TITLES[step]}
        </h2>

        {step === 0 && <StepApplicant form={form} />}
        {step === 1 && <StepHome form={form} />}
        {step === 2 && <StepPets form={form} />}
        {step === 3 && <StepAnimal form={form} animals={animals} />}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button key="back" variant="secondary" onClick={() => goTo(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < LAST_STEP ? (
          // A submit button so Enter in a field advances too; the onSubmit handler above routes it.
          <Button key="next" type="submit">
            Next
          </Button>
        ) : (
          <Button key="submit" type="submit">
            Submit application
          </Button>
        )}
      </div>
    </form>
  );
}
