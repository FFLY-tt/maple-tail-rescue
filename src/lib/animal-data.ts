import animalsData from "@/data/animals.json";
import { sortAnimals } from "@/lib/animals";
import type { Animal } from "@/types/animal";

/** All animals from the static sync, in display order (see sortAnimals). */
export const allAnimals: Animal[] = sortAnimals(animalsData as Animal[]);

export function getAnimalBySlug(slug: string): Animal | undefined {
  return allAnimals.find((animal) => animal.slug === slug);
}
