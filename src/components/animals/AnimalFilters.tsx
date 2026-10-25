"use client";

import {
  AGE_GROUP_VALUES,
  SIZE_VALUES,
  SPECIES_VALUES,
  getAgeGroupLabel,
  getSizeLabel,
  getSpeciesLabel,
} from "@/lib/labels";
import type { AgeGroup, Size, Species } from "@/types/animal";

export type Filters = {
  species: Species | "all";
  ageGroup: AgeGroup | "all";
  size: Size | "all";
};

export const NO_FILTERS: Filters = { species: "all", ageGroup: "all", size: "all" };

type FilterSelectProps<T extends string> = {
  id: string;
  label: string;
  value: T | "all";
  options: readonly { value: T; label: string }[];
  allLabel: string;
  onChange: (value: T | "all") => void;
};

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  allLabel,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T | "all")}
        className="min-h-11 rounded-lg border border-border-strong bg-surface px-3 text-base"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type AnimalFiltersProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function AnimalFilters({ filters, onChange }: AnimalFiltersProps) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-4 min-[480px]:grid-cols-3">
      <legend className="px-2 text-sm font-semibold text-muted">Filter animals</legend>
      <FilterSelect
        id="filter-species"
        label="Species"
        allLabel="All species"
        value={filters.species}
        options={SPECIES_VALUES.map((value) => ({ value, label: getSpeciesLabel(value) }))}
        onChange={(species) => onChange({ ...filters, species })}
      />
      <FilterSelect
        id="filter-age"
        label="Age"
        allLabel="All ages"
        value={filters.ageGroup}
        options={AGE_GROUP_VALUES.map((value) => ({ value, label: getAgeGroupLabel(value) }))}
        onChange={(ageGroup) => onChange({ ...filters, ageGroup })}
      />
      <FilterSelect
        id="filter-size"
        label="Size"
        allLabel="All sizes"
        value={filters.size}
        options={SIZE_VALUES.map((value) => ({ value, label: getSizeLabel(value) }))}
        onChange={(size) => onChange({ ...filters, size })}
      />
    </fieldset>
  );
}
