import type { AdoptionStatus, Animal } from "@/types/animal";

const STATUS_ORDER: Record<AdoptionStatus, number> = {
  available: 0,
  pending: 1,
  adopted: 2,
};

/** Returns a new array: available first, then pending, then adopted; by name within a status. */
export function sortAnimals(animals: readonly Animal[]): Animal[] {
  return [...animals].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
}
