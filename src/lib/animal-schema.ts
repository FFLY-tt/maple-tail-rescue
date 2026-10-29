/**
 * Validates src/data/animals.json. The file is written by `npm run sync` from
 * WordPress, so it can be wrong in ways TypeScript can't see: a typo in a
 * select field, a duplicated slug, a photo path from an older sync. Checking it
 * when the site is built (or when sync is about to save it) turns those into a
 * clear message that names the bad record, not a broken page.
 */
import { z } from "zod";

import { PHOTO_PATH } from "@/lib/photos";
import type { Animal } from "@/types/animal";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Annotated with Animal, so a change to the type that the schema doesn't follow fails to compile.
export const animalSchema: z.ZodType<Animal> = z.strictObject({
  id: z.number().int().positive(),
  slug: z.string().regex(SLUG, "must be lowercase letters, numbers and hyphens"),
  name: z.string().trim().min(1, "must not be empty").max(100),
  species: z.enum(["dog", "cat"]),
  ageGroup: z.enum(["baby", "young", "adult", "senior"]),
  size: z.enum(["small", "medium", "large"]),
  sex: z.enum(["male", "female"]),
  goodWith: z.array(z.enum(["dogs", "cats", "kids"])),
  personality: z.string(),
  status: z.enum(["available", "pending", "adopted"]),
  photos: z.array(z.string().regex(PHOTO_PATH, 'must be a "/animals/<slug>/<name>-800.webp" path')),
});

export const animalsSchema = z.array(animalSchema).superRefine((animals, ctx) => {
  const seen = { id: new Map<number, number>(), slug: new Map<string, number>() };
  animals.forEach((animal, index) => {
    for (const field of ["id", "slug"] as const) {
      const earlier = (seen[field] as Map<unknown, number>).get(animal[field]);
      if (earlier !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: [index, field],
          message: `duplicates ${field} "${animal[field]}" of record ${earlier + 1}`,
        });
      } else {
        (seen[field] as Map<unknown, number>).set(animal[field], index);
      }
    }
  });
});

export class AnimalDataError extends Error {}

/** "record 3 (slug "hazel", id 17)": enough to find the animal, even if the record is badly broken. */
function describeRecord(data: unknown, index: number): string {
  const record = Array.isArray(data) ? data[index] : undefined;
  const details: string[] = [];
  if (record && typeof record === "object") {
    const { slug, id } = record as { slug?: unknown; id?: unknown };
    if (typeof slug === "string") details.push(`slug "${slug}"`);
    if (typeof id === "number") details.push(`id ${id}`);
  }
  return `record ${index + 1}${details.length ? ` (${details.join(", ")})` : ""}`;
}

/**
 * Returns the animals if the data is valid. Otherwise throws an AnimalDataError
 * listing every problem and the record it is in.
 */
export function parseAnimals(data: unknown, source = "src/data/animals.json"): Animal[] {
  const result = animalsSchema.safeParse(data);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const [first, ...rest] = issue.path;
    if (typeof first !== "number") return `  - ${issue.message}`;
    const where = rest.length ? `${rest.join(".")}: ` : "";
    return `  - ${describeRecord(data, first)}: ${where}${issue.message}`;
  });
  throw new AnimalDataError(
    [
      `${source} is not valid:`,
      ...lines,
      "Fix the animal in WordPress and run `npm run sync` again (or correct the file by hand).",
    ].join("\n"),
  );
}
