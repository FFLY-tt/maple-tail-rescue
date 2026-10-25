import Image from "next/image";

import animalsData from "@/data/animals.json";
import type { Animal } from "@/types/animal";

const animals = animalsData as Animal[];

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
            <li key={animal.id} className="overflow-hidden rounded-lg border">
              {animal.photos[0] ? (
                <Image
                  src={animal.photos[0]}
                  alt={animal.name}
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-gray-200" />
              )}
              <div className="p-3">
                <h2 className="text-lg font-semibold">{animal.name}</h2>
                <p className="text-sm capitalize">
                  {animal.species} · {animal.ageGroup}
                </p>
                <p className="text-sm capitalize">{animal.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
