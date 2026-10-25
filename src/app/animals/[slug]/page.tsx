import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimalFacts } from "@/components/animals/AnimalFacts";
import { AnimalGallery } from "@/components/animals/AnimalGallery";
import { StatusBadge } from "@/components/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { allAnimals, getAnimalBySlug } from "@/lib/animal-data";

// Static export: only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return allAnimals.map((animal) => ({ slug: animal.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/animals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const animal = getAnimalBySlug(slug);
  if (!animal) return {};
  return {
    title: animal.name,
    description: animal.personality,
  };
}

export default async function AnimalPage({ params }: PageProps<"/animals/[slug]">) {
  const { slug } = await params;
  const animal = getAnimalBySlug(slug);
  if (!animal) notFound();

  const isAdopted = animal.status === "adopted";

  return (
    <Container className="pt-8 pb-16">
      <Link
        href="/animals"
        className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
      >
        <span aria-hidden="true">&larr;&nbsp;</span>All animals
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <AnimalGallery name={animal.name} photos={animal.photos} />

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-bold">{animal.name}</h1>
            <StatusBadge status={animal.status} />
          </div>

          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="sr-only">
              About {animal.name}
            </h2>
            <p className="text-lg leading-relaxed">{animal.personality}</p>
          </section>

          <AnimalFacts animal={animal} />

          {isAdopted ? (
            <div className="rounded-2xl bg-secondary-soft p-5">
              <p className="font-semibold text-secondary">
                {animal.name} has found a forever home!
              </p>
              <p className="mt-1">
                Applications for {animal.name} are closed. Thank you to everyone who
                showed interest.{" "}
                <Link
                  href="/animals"
                  className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
                >
                  Meet the animals still waiting
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <ButtonLink href={`/apply?animal=${animal.slug}`}>Apply to adopt</ButtonLink>
              {animal.status === "pending" && (
                <p className="text-sm text-muted">
                  An adoption for {animal.name} is already in progress. You can still
                  apply and we&rsquo;ll be in touch if things change.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
