import { AnimalCard } from "@/components/animals/AnimalCard";
import type { Animal } from "@/types/animal";

type AnimalGridProps = {
  animals: readonly Animal[];
  /** Eagerly load the first card's photo (use when the grid starts above the fold). */
  preloadFirst?: boolean;
};

export function AnimalGrid({ animals, preloadFirst = false }: AnimalGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {animals.map((animal, index) => (
        <li key={animal.id}>
          <AnimalCard animal={animal} preloadPhoto={preloadFirst && index === 0} />
        </li>
      ))}
    </ul>
  );
}
