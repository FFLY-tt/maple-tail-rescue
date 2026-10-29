import Image from "next/image";
import Link from "next/link";

import { PhotoPlaceholder } from "@/components/animals/PhotoPlaceholder";
import { StatusBadge } from "@/components/StatusBadge";
import { getAgeLabel } from "@/lib/labels";
import { cardPhoto } from "@/lib/photos";
import type { Animal } from "@/types/animal";

/** A lighter, smaller take on AnimalCard for dense grids: square photo, no shadow. */
export function AnimalMiniCard({ animal }: { animal: Animal }) {
  const photo = animal.photos[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors focus-within:border-primary hover:border-primary">
      <div className="aspect-square w-full overflow-hidden bg-surface-alt">
        {photo ? (
          <Image
            src={cardPhoto(photo)}
            alt={`Photo of ${animal.name}`}
            width={400}
            height={500}
            className="h-full w-full object-cover"
          />
        ) : (
          <PhotoPlaceholder name={animal.name} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate font-display text-lg font-bold leading-tight">
          {/* The ::after stretches this link over the whole card. */}
          <Link
            href={`/animals/${animal.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {animal.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm text-muted">{getAgeLabel(animal)}</span>
          <StatusBadge status={animal.status} />
        </div>
      </div>
    </article>
  );
}
