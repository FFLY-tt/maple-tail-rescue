import Image from "next/image";

import { StatusBadge } from "@/components/StatusBadge";
import animalsData from "@/data/animals.json";
import { sortAnimals } from "@/lib/animals";
import { getAgeLabel, getSpeciesLabel } from "@/lib/labels";
import type { Animal } from "@/types/animal";

const animals = sortAnimals(animalsData as Animal[]);

export const metadata = {
  title: "Animals",
};

export default function AnimalsPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Animals</h1>
      {animals.length === 0 ? (
        <p>No animals yet. Run `npm run sync`.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {animals.map((animal) => (
            <li key={animal.id} className="overflow-hidden rounded-lg border border-stone-300 bg-white">
              {animal.photos[0] ? (
                <Image
                  src={animal.photos[0]}
                  alt={animal.name}
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-stone-200" />
              )}
              <div className="p-3">
                <h2 className="text-lg font-semibold">{animal.name}</h2>
                <p className="mb-2 text-sm">
                  {getSpeciesLabel(animal.species)} · {getAgeLabel(animal)}
                </p>
                <StatusBadge status={animal.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
