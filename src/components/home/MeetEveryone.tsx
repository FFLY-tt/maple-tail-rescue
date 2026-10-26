import { MeetEveryoneGrid } from "@/components/home/MeetEveryoneGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Animal } from "@/types/animal";

export function MeetEveryone({ animals }: { animals: readonly Animal[] }) {
  if (animals.length === 0) return null;

  return (
    <section aria-labelledby="meet-heading" className="py-14">
      <Container>
        <h2 id="meet-heading" className="font-display text-3xl font-bold">
          Meet everyone
        </h2>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Every one of these friends is living in a foster home and hoping to meet you.
        </p>
        <div className="mt-8">
          <MeetEveryoneGrid animals={animals} />
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
