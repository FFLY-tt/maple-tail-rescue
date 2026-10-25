import type { Metadata } from "next";

import { AnimalBrowser } from "@/components/animals/AnimalBrowser";
import { Container } from "@/components/ui/Container";
import { allAnimals } from "@/lib/animal-data";

export const metadata: Metadata = {
  title: "Our animals",
  description: "Meet the dogs and cats looking for their forever homes at Maple Tail Rescue.",
};

export default function AnimalsPage() {
  return (
    <Container className="pt-10 pb-16">
      <h1 className="font-display text-4xl font-bold">Our animals</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">
        Every animal here is living in a foster home right now. Tap a card to
        read their story and see how to meet them.
      </p>
      <div className="mt-8">
        <AnimalBrowser animals={allAnimals} />
      </div>
    </Container>
  );
}
