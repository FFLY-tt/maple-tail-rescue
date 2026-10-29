/**
 * Exports animals from the local WordPress (LocalWP) into the repo:
 *   - src/data/animals.json   (clean `Animal[]`)
 *   - public/animals/{slug}/  (photos, resized to WebP: see src/lib/photos.ts)
 *
 * Run with `npm run sync`. Override the source with WP_URL=http://other.local.
 *
 * Safe by construction: everything is built in .sync-staging/ first, checked, and
 * only then swapped in (see sync-swap.ts). If anything fails, the previous photos
 * and animals.json are left exactly as they were.
 */
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { AnimalDataError, parseAnimals } from "../src/lib/animal-schema";
import { CARD_SUFFIX, LARGE_SUFFIX, OG_SUFFIX } from "../src/lib/photos";
import type {
  AdoptionStatus,
  AgeGroup,
  Animal,
  GoodWith,
  Sex,
  Size,
  Species,
} from "../src/types/animal";
import { writePhotoVariants } from "./sync-images";
import { swapIn } from "./sync-swap";

const WP_URL = (process.env.WP_URL ?? "http://paws-demo.local").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// Raw WordPress shapes (only what we read). Never exported to the frontend.
// ---------------------------------------------------------------------------

type RawMedia = { id?: number; source_url?: string; url?: string };

export type RawAnimal = {
  id: number;
  slug: string;
  title: { rendered: string };
  featured_media: number;
  acf?: Record<string, unknown> | unknown[]; // PHP serialises an empty array as []
  _embedded?: { "wp:featuredmedia"?: RawMedia[] };
};

// ---------------------------------------------------------------------------
// WordPress access
// ---------------------------------------------------------------------------

/** A problem that makes the sync stop (nothing is changed). */
export class SyncError extends Error {}
class UnreachableError extends SyncError {}
class HttpStatusError extends SyncError {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function restUrl(route: string, params: Record<string, string | number> = {}): string {
  const query = Object.entries(params)
    .map(([key, value]) => `&${key}=${encodeURIComponent(String(value))}`)
    .join("");
  return `${WP_URL}/?rest_route=${route}${query}`;
}

async function wpFetch(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    const reason = err instanceof Error ? (err.cause ?? err) : err;
    throw new UnreachableError(
      `Cannot reach WordPress at ${WP_URL} (${String(reason)}).\n` +
        `Is the site started in LocalWP? Open it in the browser to check, then run \`npm run sync\` again.`,
    );
  }
  if (!res.ok) {
    throw new HttpStatusError(`WordPress responded ${res.status} ${res.statusText} for ${url}`, res.status);
  }
  return res;
}

async function fetchAllRawAnimals(): Promise<RawAnimal[]> {
  const animals: RawAnimal[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await wpFetch(
      restUrl("/wp/v2/animal", { per_page: 100, page, status: "publish", _embed: 1 }),
    );
    totalPages = Number(res.headers.get("X-WP-TotalPages") ?? 1);
    animals.push(...((await res.json()) as RawAnimal[]));
    page += 1;
  } while (page <= totalPages);
  return animals;
}

// ---------------------------------------------------------------------------
// Image URL resolution
// ---------------------------------------------------------------------------

async function mediaUrlById(id: number): Promise<string | null> {
  try {
    const res = await wpFetch(restUrl(`/wp/v2/media/${id}`, { _fields: "source_url" }));
    return ((await res.json()) as RawMedia).source_url ?? null;
  } catch (err) {
    // A deleted media item (404) means "no photo". Any other failure is a failed sync:
    // treating it as "no photo" would drop a photo that is really there.
    if (err instanceof HttpStatusError && err.status === 404) return null;
    throw err;
  }
}

/** ACF image fields come back as an object, an ID, a URL string, or false/null. */
export async function resolveAcfImageUrl(value: unknown): Promise<string | null> {
  if (!value) return null;
  if (typeof value === "number") return mediaUrlById(value);
  if (typeof value === "string") {
    return /^\d+$/.test(value) ? mediaUrlById(Number(value)) : value;
  }
  if (typeof value === "object") {
    const media = value as RawMedia;
    if (media.url ?? media.source_url) return (media.url ?? media.source_url)!;
    if (typeof media.id === "number") return mediaUrlById(media.id);
  }
  return null;
}

async function resolveFeaturedImageUrl(raw: RawAnimal): Promise<string | null> {
  const embedded = raw._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  if (embedded) return embedded;
  return raw.featured_media ? mediaUrlById(raw.featured_media) : null;
}

// ---------------------------------------------------------------------------
// Image download
// ---------------------------------------------------------------------------

/**
 * Downloads one image and writes its resized versions into `imagesDir/{slug}/`
 * (see src/lib/photos.ts). Returns the public path of the large version.
 */
async function downloadImage(url: string, imagesDir: string, slug: string, baseName: string): Promise<string> {
  const res = await wpFetch(url);
  const fileName = await writePhotoVariants(
    Buffer.from(await res.arrayBuffer()),
    path.join(imagesDir, slug),
    baseName,
  );
  return `/animals/${slug}/${fileName}`;
}

// ---------------------------------------------------------------------------
// Mapping: raw WordPress -> Animal
// ---------------------------------------------------------------------------

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function oneOf<T extends string>(field: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`field "${field}" is ${JSON.stringify(value)}, expected one of ${allowed.join(" | ")}`);
}

const GOOD_WITH: readonly GoodWith[] = ["dogs", "cats", "kids"];

/** Pure mapping from the raw WordPress record (+ already-downloaded photo paths) to the frontend `Animal`. */
export function mapToAnimal(raw: RawAnimal, photos: string[]): Animal {
  const acf = Array.isArray(raw.acf) ? {} : (raw.acf ?? {});
  const goodWith = Array.isArray(acf.good_with)
    ? acf.good_with.filter((v): v is GoodWith => GOOD_WITH.includes(v as GoodWith))
    : [];

  return {
    id: raw.id,
    slug: raw.slug,
    name: decodeHtmlEntities(raw.title.rendered).trim(),
    species: oneOf<Species>("species", acf.species, ["dog", "cat"]),
    ageGroup: oneOf<AgeGroup>("age_group", acf.age_group, ["baby", "young", "adult", "senior"]),
    size: oneOf<Size>("size", acf.size, ["small", "medium", "large"]),
    sex: oneOf<Sex>("sex", acf.sex, ["male", "female"]),
    goodWith,
    personality: typeof acf.personality === "string" ? acf.personality.trim() : "",
    status: oneOf<AdoptionStatus>("adoption_status", acf.adoption_status, [
      "available",
      "pending",
      "adopted",
    ]),
    photos,
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

type Skipped = { label: string; reason: string };

/** Downloads and resizes one animal's photos into `imagesDir/{slug}/` (a staging folder). */
async function syncPhotos(raw: RawAnimal, imagesDir: string, warnings: string[]): Promise<string[]> {
  const acf = Array.isArray(raw.acf) ? {} : (raw.acf ?? {});
  const sources: { baseName: string; resolve: () => Promise<string | null> }[] = [
    { baseName: "main", resolve: () => resolveFeaturedImageUrl(raw) },
    { baseName: "photo-2", resolve: () => resolveAcfImageUrl(acf.photo_2) },
    { baseName: "photo-3", resolve: () => resolveAcfImageUrl(acf.photo_3) },
  ];

  await mkdir(path.join(imagesDir, raw.slug), { recursive: true });

  const photos: string[] = [];
  for (const { baseName, resolve } of sources) {
    const url = await resolve();
    if (!url) {
      if (baseName === "main") warnings.push(`${raw.slug}: no featured image set`);
      continue;
    }
    try {
      photos.push(await downloadImage(url, imagesDir, raw.slug, baseName));
    } catch (err) {
      if (err instanceof UnreachableError) throw err;
      // A photo that exists but can't be fetched or read is a failed sync, not a missing photo:
      // carrying on would replace the animal's good photo from the last sync with nothing.
      throw new SyncError(`${raw.slug}: could not download or read ${baseName} (${url}): ${(err as Error).message}`);
    }
  }
  return photos;
}

async function exists(target: string): Promise<boolean> {
  return access(target).then(
    () => true,
    () => false,
  );
}

export type SyncResult = { animals: Animal[]; publishedCount: number; warnings: string[] };

/**
 * Syncs animals from WordPress into `root` (the project folder). Throws, having
 * changed nothing, if WordPress can't be reached, any animal or photo can't be
 * read, or the result isn't valid.
 */
export async function runSync(root: string = process.cwd()): Promise<SyncResult> {
  const dataFile = path.join(root, "src", "data", "animals.json");
  const imagesDir = path.join(root, "public", "animals");
  const stagingDir = path.join(root, ".sync-staging");
  const stagedImages = path.join(stagingDir, "animals");
  const stagedData = path.join(stagingDir, "animals.json");

  // A previous run that was killed may have left its staging folder behind.
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagedImages, { recursive: true });

  try {
    const rawAnimals = await fetchAllRawAnimals();
    if (rawAnimals.length === 0) {
      throw new SyncError(
        "WordPress returned no published animals, so the existing data was not replaced with an empty list.\n" +
          "Check that the animals are published and that WP_URL points at the right site.",
      );
    }

    const animals: Animal[] = [];
    const skipped: Skipped[] = [];
    const warnings: string[] = [];

    for (const raw of rawAnimals) {
      const photos = await syncPhotos(raw, stagedImages, warnings);
      try {
        animals.push(mapToAnimal(raw, photos));
      } catch (err) {
        skipped.push({ label: raw.slug, reason: (err as Error).message });
      }
    }
    if (skipped.length > 0) {
      // Skipping would quietly remove a published animal from the site. Better to stop and say why.
      throw new SyncError(
        `${skipped.length} animal(s) could not be read:\n` +
          skipped.map((s) => `  - ${s.label}: ${s.reason}`).join("\n") +
          "\nFix them in WordPress and run the sync again.",
      );
    }

    // Write the data file, then read it back and check it exactly as the site build will.
    await writeFile(stagedData, JSON.stringify(animals, null, 2) + "\n");
    try {
      parseAnimals(JSON.parse(await readFile(stagedData, "utf8")), "the synced animals");
    } catch (err) {
      if (err instanceof AnimalDataError) throw new SyncError(err.message);
      throw err;
    }
    // Every photo the data lists must exist, in all its sizes.
    for (const animal of animals) {
      for (const photo of animal.photos) {
        const base = photo.slice("/animals/".length, -LARGE_SUFFIX.length); // e.g. "mochi/main"
        for (const suffix of [LARGE_SUFFIX, CARD_SUFFIX, OG_SUFFIX]) {
          if (!(await exists(path.join(stagedImages, base + suffix)))) {
            throw new SyncError(`${animal.slug}: ${photo} is listed but ${base + suffix} was not written`);
          }
        }
      }
    }

    await swapIn({ stagedImages, stagedData, imagesDir, dataFile });
    return { animals, publishedCount: rawAnimals.length, warnings };
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log(`Syncing animals from ${WP_URL} ...`);
  const { animals, publishedCount, warnings } = await runSync(process.cwd());

  const photoCount = animals.reduce((n, a) => n + a.photos.length, 0);
  const byStatus = (s: AdoptionStatus) => animals.filter((a) => a.status === s).length;

  console.log("\nSync complete");
  console.log(`  Animals written : ${animals.length} (of ${publishedCount} published)`);
  console.log(
    `  By status       : ${byStatus("available")} available, ${byStatus("pending")} pending, ${byStatus("adopted")} adopted`,
  );
  console.log(`  Photos saved    : ${photoCount}`);
  console.log(`  Data file       : ${path.join("src", "data", "animals.json")}`);
  for (const a of animals) console.log(`    - ${a.name} (${a.slug}): ${a.photos.length} photo(s)`);
  for (const w of warnings) console.warn(`  ! ${w}`);
}

// Only sync when run as a script (`npm run sync`), not when a test imports this file.
if (/sync-animals\.[cm]?[jt]s$/.test(process.argv[1] ?? "")) {
  main().catch((err) => {
    console.error(`\nSync failed: ${err instanceof Error ? err.message : String(err)}`);
    console.error("Nothing was changed: the previous photos and animals.json are untouched.");
    process.exit(1);
  });
}
