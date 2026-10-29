import Image from "next/image";
import Link from "next/link";

import { PhotoPlaceholder } from "@/components/animals/PhotoPlaceholder";
import { StatusBadge } from "@/components/StatusBadge";
import { getAgeLabel, getSizeLabel, getSpeciesLabel } from "@/lib/labels";
import { cardPhoto } from "@/lib/photos";
import type { Animal } from "@/types/animal";

type AnimalCardProps = {
  animal: Animal;
  /** Set on the first photo visible on the page so it loads eagerly. */
  preloadPhoto?: boolean;
};

export function AnimalCard({ animal, preloadPhoto = false }: AnimalCardProps) {
  const photo = animal.photos[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="aspect-[4/5] w-full overflow-hidden bg-surface-alt">
        {photo ? (
          <Image
            src={cardPhoto(photo)}
            alt={`Photo of ${animal.name}`}
            width={400}
            height={500}
            preload={preloadPhoto}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder name={animal.name} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold leading-tight">
            {/* The ::after stretches this link over the whole card. */}
            <Link
              href={`/animals/${animal.slug}`}
              className="rounded-sm after:absolute after:inset-0 after:content-['']"
            >
              {animal.name}
            </Link>
          </h3>
          <StatusBadge status={animal.status} />
        </div>
        <p className="text-muted">
          {getSpeciesLabel(animal.species)} · {getAgeLabel(animal)} ·{" "}
          {getSizeLabel(animal.size)}
        </p>
      </div>
    </article>
  );
}
