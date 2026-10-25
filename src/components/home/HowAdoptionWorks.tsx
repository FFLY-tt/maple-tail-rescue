import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    title: "Find a friend and apply",
    text: "Browse our animals, then send us a short application about you and your home.",
  },
  {
    title: "Chat and meet",
    text: "A volunteer will call you, answer your questions and arrange a meeting with the animal and their foster family.",
  },
  {
    title: "Bring them home",
    text: "Once you’re both happy, we finalize the adoption and check in after the first few weeks to help everyone settle.",
  },
];

export function HowAdoptionWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-surface-alt py-14">
      <Container>
        <h2 id="how-heading" className="font-display text-3xl font-bold">
          How adoption works
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface p-6">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
