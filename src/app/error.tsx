"use client";

import { useEffect, useRef } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/** Shown when something in a page fails while it runs in the browser. The header and footer stay. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // The only record of the failure for now: there is no error reporting service yet.
    console.error(error);
    // Move focus to the message so screen reader users hear that the page changed.
    headingRef.current?.focus();
  }, [error]);

  return (
    <Container narrow className="py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🐾
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-3xl font-bold focus:outline-none">
        Something went wrong
      </h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-muted">
        Sorry, this page ran into a problem. You can try again, or head back to the home page.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  );
}
