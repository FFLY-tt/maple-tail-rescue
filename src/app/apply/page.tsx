import type { Metadata } from "next";
import { Suspense } from "react";

import { ApplicationForm } from "@/components/apply/ApplicationForm";
import type { ApplyAnimal } from "@/components/apply/types";
import { Container } from "@/components/ui/Container";
import { allAnimals } from "@/lib/animal-data";
import { getAgeLabel, getSpeciesLabel } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Apply to adopt",
  description: "Tell us about you and your home so we can find the right match.",
};

// Adopted animals can't be applied for. Pending ones can (as a backup).
const applyAnimals: ApplyAnimal[] = allAnimals
  .filter((animal) => animal.status !== "adopted")
  .map((animal) => ({
    slug: animal.slug,
    name: animal.name,
    label: `${animal.name} (${getAgeLabel(animal)} ${getSpeciesLabel(animal.species).toLowerCase()}${
      animal.status === "pending" ? ", adoption pending" : ""
    })`,
  }));

function FormFallback() {
  return (
    <p role="status" className="rounded-2xl border border-border bg-surface p-8 text-muted">
      Loading the application form…
    </p>
  );
}

export default function ApplyPage() {
  return (
    <Container narrow className="pt-10 pb-16">
      <h1 className="font-display text-4xl font-bold">Apply to adopt</h1>
      <p className="mt-2 mb-8 text-lg text-muted">
        It takes about five minutes. Tell us about you and your home, and we&rsquo;ll
        help find the right match.
      </p>
      {/* useSearchParams in the form needs a Suspense boundary for static export. */}
      <Suspense fallback={<FormFallback />}>
        <ApplicationForm animals={applyAnimals} />
      </Suspense>
    </Container>
  );
}
