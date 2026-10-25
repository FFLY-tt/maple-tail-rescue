import type {
  AdoptionStatus,
  AgeGroup,
  Animal,
  GoodWith,
  Sex,
  Size,
  Species,
} from "@/types/animal";

const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
};

const AGE_LABELS: Record<Exclude<AgeGroup, "baby">, string> = {
  young: "Young",
  adult: "Adult",
  senior: "Senior",
};

const BABY_LABELS: Record<Species, string> = {
  dog: "Puppy",
  cat: "Kitten",
};

const SIZE_LABELS: Record<Size, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const SEX_LABELS: Record<Sex, string> = {
  male: "Male",
  female: "Female",
};

const GOOD_WITH_LABELS: Record<GoodWith, string> = {
  dogs: "Dogs",
  cats: "Cats",
  kids: "Kids",
};

const STATUS_LABELS: Record<AdoptionStatus, string> = {
  available: "Available",
  pending: "Pending",
  adopted: "Adopted",
};

export function getSpeciesLabel(species: Species): string {
  return SPECIES_LABELS[species];
}

export function getAgeLabel(animal: Pick<Animal, "ageGroup" | "species">): string {
  return animal.ageGroup === "baby"
    ? BABY_LABELS[animal.species]
    : AGE_LABELS[animal.ageGroup];
}

export function getSizeLabel(size: Size): string {
  return SIZE_LABELS[size];
}

export function getSexLabel(sex: Sex): string {
  return SEX_LABELS[sex];
}

export function getGoodWithLabel(goodWith: GoodWith): string {
  return GOOD_WITH_LABELS[goodWith];
}

export function getStatusLabel(status: AdoptionStatus): string {
  return STATUS_LABELS[status];
}
