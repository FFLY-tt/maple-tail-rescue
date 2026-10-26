"use client";

import { useEffect, useState } from "react";

import { AnimalMiniCard } from "@/components/animals/AnimalMiniCard";
import { sortAnimals } from "@/lib/animals";
import type { Animal } from "@/types/animal";

const MAX_CARDS = 8;

function randomSample(animals: readonly Animal[], size: number): Animal[] {
  const pool = [...animals];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return sortAnimals(pool.slice(0, size));
}

/**
 * Shows up to MAX_CARDS animals. The first render (and static HTML) is always
 * the first MAX_CARDS in the given order; with more animals than that, a random
 * selection replaces it after mount. Same card count and size, so no layout shift.
 */
export function MeetEveryoneGrid({ animals }: { animals: readonly Animal[] }) {
  const [shown, setShown] = useState(() => animals.slice(0, MAX_CARDS));

  useEffect(() => {
    if (animals.length > MAX_CARDS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- must run after mount to keep the first render deterministic
      setShown(randomSample(animals, MAX_CARDS));
    }
  }, [animals]);

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {shown.map((animal) => (
        <li key={animal.id}>
          <AnimalMiniCard animal={animal} />
        </li>
      ))}
    </ul>
  );
}
