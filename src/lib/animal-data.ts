import animalsData from "@/data/animals.json";
import { parseAnimals } from "@/lib/animal-schema";
import { sortAnimals } from "@/lib/animals";
import type { Animal } from "@/types/animal";

/**
 * All animals from the static sync, in display order (see sortAnimals). The data
 * is checked here, when the site is built, so a bad record stops the build with
 * a message naming it instead of producing a broken page.
 */
export const allAnimals: Animal[] = sortAnimals(parseAnimals(animalsData));

export function getAnimalBySlug(slug: string): Animal | undefined {
  return allAnimals.find((animal) => animal.slug === slug);
}
