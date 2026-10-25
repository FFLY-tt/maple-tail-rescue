"use client";

import { useState } from "react";

import { AnimalFilters, NO_FILTERS, type Filters } from "@/components/animals/AnimalFilters";
import { AnimalGrid } from "@/components/animals/AnimalGrid";
import { Button } from "@/components/ui/Button";
import type { Animal } from "@/types/animal";

function matches(animal: Animal, filters: Filters) {
  return (
    (filters.species === "all" || animal.species === filters.species) &&
    (filters.ageGroup === "all" || animal.ageGroup === filters.ageGroup) &&
    (filters.size === "all" || animal.size === filters.size)
  );
}

/** Filterable grid. Expects `animals` already sorted; filtering preserves that order. */
export function AnimalBrowser({ animals }: { animals: readonly Animal[] }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  const visible = animals.filter((animal) => matches(animal, filters));
  const isFiltered = Object.values(filters).some((value) => value !== "all");

  return (
    <div className="space-y-6">
      <AnimalFilters filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p role="status" className="text-muted">
          Showing {visible.length} of {animals.length}{" "}
          {animals.length === 1 ? "animal" : "animals"}
        </p>
        {isFiltered && visible.length > 0 && (
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <AnimalGrid animals={visible} preloadFirst />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-4xl" aria-hidden="true">
            🐾
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold">
            No matches right now
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            None of our animals fit those filters at the moment. New friends arrive
            often, so try widening your search or check back soon.
          </p>
          <Button className="mt-6" onClick={() => setFilters(NO_FILTERS)}>
            Show all animals
          </Button>
        </div>
      )}
    </div>
  );
}
