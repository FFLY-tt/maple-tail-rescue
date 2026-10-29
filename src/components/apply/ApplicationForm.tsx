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
import { submitApplication } from "@/lib/applications-api";
import { HONEYPOT_FIELD, judgeHoneypot } from "@/lib/honeypot";
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
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  // Bot trap (see lib/honeypot.ts) and the time the form appeared, to tell bots from autofill.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);
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

  async function send(values: ApplicationInput) {
    if (sending) return;
    setSendFailed(false);

    const elapsedMs = performance.now() - shownAt.current;
    const verdict = judgeHoneypot(honeypotRef.current?.value ?? "", elapsedMs);
    if (verdict === "bot") {
      // Filled and far too fast: a bot. Look successful, store nothing. Only the
      // browser console sees this: there is no server to log to.
      console.warn(`Application dropped: bot trap filled ${Math.round(elapsedMs)} ms after the form appeared.`);
      return setSubmitted(values);
    }
    if (verdict === "filled-but-human") {
      // Probably autofill. Never lose a real application over it: send it.
      console.warn(`Bot trap was filled, but ${Math.round(elapsedMs)} ms passed, so the application was sent.`);
    }

    setSending(true);
    try {
      await submitApplication(values, animals.find((a) => a.slug === values.animalSlug)?.name);
      setSubmitted(values);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
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
        void form.handleSubmit(send, onInvalid)(event);
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

        {/* Bot trap. Off-screen rather than display:none (some bots skip hidden fields); inert
            keeps it out of the tab order and the accessibility tree. The data-* attributes ask
            password managers to leave it alone. */}
        <div inert aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this field empty
            <input
              ref={honeypotRef}
              type="text"
              name={HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
            />
          </label>
        </div>
      </div>

      {step === LAST_STEP && (
        <p className="text-sm text-muted">
          <strong className="font-semibold text-foreground">Your privacy:</strong> we collect the name,
          contact details and answers above. We only use them to review this adoption application, and
          only Maple Tail Rescue staff can see them.
        </p>
      )}

      {sendFailed && (
        <p role="alert" className="rounded-lg border border-danger bg-surface p-4 font-semibold text-danger">
          Sorry, we couldn&rsquo;t send your application. Please check your connection and try again.
          Your answers are still here.
        </p>
      )}

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
          <Button key="submit" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Submit application"}
          </Button>
        )}
      </div>
    </form>
  );
}
