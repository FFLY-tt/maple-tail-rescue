"use client";

import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/Button";

type ApplicationSuccessProps = {
  applicantName: string;
  email: string;
  animalName?: string;
};

export function ApplicationSuccess({ applicantName, email, animalName }: ApplicationSuccessProps) {
  const firstName = applicantName.split(" ")[0];
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
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
        {animalName
          ? `We’ve received your application for ${animalName}.`
          : "We’ve received your application."}{" "}
        A volunteer will email you at <strong className="break-all">{email}</strong>{" "}
        within a few days to set up a chat.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        This is a demo, so nothing has actually been sent.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/animals">Keep browsing animals</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
