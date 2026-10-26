import type { Metadata } from "next";

import { AdoptionSteps } from "@/components/adoption/AdoptionSteps";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  ADOPTION_FAQ,
  ADOPTION_FEES,
  ADOPTION_PROCESS_INTRO,
} from "@/content/adoption-process";

export const metadata: Metadata = {
  title: "Adoption process",
  description:
    "Four short steps from application to bringing your new dog or cat home, with time estimates, fees and answers to common questions.",
};

export default function AdoptionProcessPage() {
  return (
    <Container narrow className="pt-10 pb-16">
      <h1 className="font-display text-4xl font-bold">Adoption process</h1>
      <p className="mt-2 text-lg text-muted">{ADOPTION_PROCESS_INTRO}</p>

      <section aria-labelledby="steps-heading" className="mt-10">
        <h2 id="steps-heading" className="mb-4 font-display text-3xl font-bold">
          Four steps to bring them home
        </h2>
        <AdoptionSteps layout="list" />
      </section>

      <section aria-labelledby="fees-heading" className="mt-12">
        <h2 id="fees-heading" className="font-display text-3xl font-bold">
          {ADOPTION_FEES.title}
        </h2>
        <div className="mt-3 space-y-3 text-lg">
          {ADOPTION_FEES.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mt-12">
        <h2 id="faq-heading" className="font-display text-3xl font-bold">
          Common questions
        </h2>
        <div className="mt-4 space-y-6">
          {ADOPTION_FAQ.map(({ question, answer }) => (
            <div key={question}>
              <h3 className="font-display text-xl font-bold">{question}</h3>
              <p className="mt-1 text-lg">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/apply">Start your application</ButtonLink>
        <ButtonLink href="/animals" variant="secondary">
          Meet our animals
        </ButtonLink>
      </div>
    </Container>
  );
}
