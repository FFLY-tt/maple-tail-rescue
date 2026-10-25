import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Animal } from "@/types/animal";

/** `spotlight` is optional: without a photo the hero is just the text column. */
export function Hero({ spotlight }: { spotlight?: Animal }) {
  const photo = spotlight?.photos[0];

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

        {spotlight && photo && (
          <figure className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface shadow-md">
              <Image
                src={photo}
                alt={`Photo of ${spotlight.name}`}
                width={800}
                height={1000}
                preload
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center text-muted">
              Say hello to{" "}
              <Link
                href={`/animals/${spotlight.slug}`}
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {spotlight.name}
              </Link>
            </figcaption>
          </figure>
        )}
      </Container>
    </section>
  );
}
