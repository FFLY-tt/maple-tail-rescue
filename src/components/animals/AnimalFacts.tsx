import type { ReactNode } from "react";

import { Tag } from "@/components/ui/Tag";
import {
  getAgeLabel,
  getGoodWithLabel,
  getSexLabel,
  getSizeLabel,
  getSpeciesLabel,
  getStatusLabel,
} from "@/lib/labels";
import type { Animal } from "@/types/animal";

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-muted">{term}</dt>
      <dd className="mt-0.5 text-lg font-semibold">{children}</dd>
    </div>
  );
}

export function AnimalFacts({ animal }: { animal: Animal }) {
  return (
    <section aria-labelledby="facts-heading" className="rounded-2xl border border-border bg-surface p-5">
      <h2 id="facts-heading" className="font-display text-2xl font-bold">
        Details
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <Fact term="Species">{getSpeciesLabel(animal.species)}</Fact>
        <Fact term="Age">{getAgeLabel(animal)}</Fact>
        <Fact term="Size">{getSizeLabel(animal.size)}</Fact>
        <Fact term="Sex">{getSexLabel(animal.sex)}</Fact>
        <Fact term="Status">{getStatusLabel(animal.status)}</Fact>
      </dl>

      <h3 className="mt-5 text-sm font-semibold text-muted">Good with</h3>
      {animal.goodWith.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {animal.goodWith.map((item) => (
            <li key={item}>
              <Tag>{getGoodWithLabel(item)}</Tag>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1">Not yet known</p>
      )}
    </section>
  );
}
