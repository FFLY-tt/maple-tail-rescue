import { AnimalGrid } from "@/components/animals/AnimalGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Animal } from "@/types/animal";

export function FeaturedAnimals({ animals }: { animals: readonly Animal[] }) {
  if (animals.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="py-14">
      <Container>
        <h2 id="featured-heading" className="font-display text-3xl font-bold">
          Ready for a home
        </h2>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          A few of the friends who are waiting for someone like you.
        </p>
        <div className="mt-8">
          <AnimalGrid animals={animals} />
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/animals" variant="secondary">
            See all animals
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
