import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Animal } from "@/types/animal";

/** `animals` fills the carousel; with none, the hero is just the text column. */
export function Hero({ animals }: { animals: readonly Animal[] }) {
  return (
    <section className="bg-surface-alt">
      <Container className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-16">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Every dog and cat deserves a soft place to land.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted">
            Maple Tail Rescue is a small, foster-based rescue in Toronto. We
            care for animals in real homes until the right family finds them.
          </p>
          <div className="mt-8">
            <ButtonLink href="/animals">Meet our animals</ButtonLink>
          </div>
        </div>

        <HeroCarousel animals={animals} />
      </Container>
    </section>
  );
}
