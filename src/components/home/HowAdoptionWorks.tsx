import { AdoptionSteps } from "@/components/adoption/AdoptionSteps";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function HowAdoptionWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-surface-alt py-14">
      <Container>
        <h2 id="how-heading" className="font-display text-3xl font-bold">
          How adoption works
        </h2>
        <div className="mt-8">
          <AdoptionSteps layout="grid" />
        </div>
        <div className="mt-8">
          <ButtonLink href="/adoption-process" variant="secondary">
            Learn more about the adoption process
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
