import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Container narrow className="py-20 text-center">
      <p className="text-6xl" aria-hidden="true">
        🐾
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold">
        We can&rsquo;t find that page
      </h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-muted">
        It may have moved, or maybe it has already found its forever home. Let&rsquo;s
        get you back on the trail.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/animals">Meet our animals</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  );
}
