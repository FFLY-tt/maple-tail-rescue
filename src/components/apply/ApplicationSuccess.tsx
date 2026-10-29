"use client";

import { useEffect, useRef } from "react";

import { AdoptionSteps } from "@/components/adoption/AdoptionSteps";
import type { ApplyAnimal } from "@/components/apply/types";
import { ButtonLink } from "@/components/ui/Button";

type ApplicationSuccessProps = {
  applicantName: string;
  email: string;
  /** The animal that was applied for; omitted for a general application. */
  animal?: ApplyAnimal;
};

export function ApplicationSuccess({ applicantName, email, animal }: ApplicationSuccessProps) {
  const firstName = applicantName.split(" ")[0];
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <div className="text-center">
        <p className="text-5xl" aria-hidden="true">
          🎉
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-3xl font-bold outline-none"
        >
          Thank you, {firstName}!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-lg">
          {animal
            ? `Your application for ${animal.name} has been submitted.`
            : "Your application has been submitted."}{" "}
          A volunteer will read it and email you at <strong className="break-all">{email}</strong>{" "}
          within a few days to set up a phone chat.
        </p>
      </div>

      <section aria-labelledby="next-heading" className="mt-8">
        <h3 id="next-heading" className="mb-4 font-display text-2xl font-bold">
          What happens next
        </h3>
        <AdoptionSteps layout="list" completedSteps={1} titleTag="h4" />
      </section>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {animal && (
          <ButtonLink href={`/animals/${animal.slug}`}>
            Back to {animal.name}&rsquo;s page
          </ButtonLink>
        )}
        <ButtonLink href="/" variant={animal ? "secondary" : "primary"}>
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
