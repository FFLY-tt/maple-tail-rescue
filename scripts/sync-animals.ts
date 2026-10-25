/**
 * Exports animals from the local WordPress (LocalWP) into the repo:
 *   - src/data/animals.json   (clean `Animal[]`)
 *   - public/animals/{slug}/  (downloaded photos)
 *
 * Run with `npm run sync`. Override the source with WP_URL=http://other.local.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AdoptionStatus,
  AgeGroup,
  Animal,
  GoodWith,
  Sex,
  Size,
  Species,
} from "../src/types/animal";

const WP_URL = (process.env.WP_URL ?? "http://paws-demo.local").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 20_000;

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "src", "data", "animals.json");
const IMAGES_DIR = path.join(ROOT, "public", "animals");

// ---------------------------------------------------------------------------
// Raw WordPress shapes (only what we read). Never exported to the frontend.
// ---------------------------------------------------------------------------

type RawMedia = { id?: number; source_url?: string; url?: string };

type RawAnimal = {
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

class SyncError extends Error {}
class UnreachableError extends SyncError {}

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
    throw new SyncError(`WordPress responded ${res.status} ${res.statusText} for ${url}`);
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
    if (err instanceof UnreachableError) throw err;
    return null; // e.g. media deleted (404)
  }
}

/** ACF image fields come back as an object, an ID, a URL string, or false/null. */
async function resolveAcfImageUrl(value: unknown): Promise<string | null> {
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

const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/** Downloads one image into public/animals/{slug}/{baseName}.{ext}; returns its public path. */
async function downloadImage(url: string, slug: string, baseName: string): Promise<string> {
  const res = await wpFetch(url);
  const ext =
    path.extname(new URL(url).pathname).toLowerCase() ||
    CONTENT_TYPE_EXT[res.headers.get("content-type")?.split(";")[0] ?? ""] ||
    ".jpg";
  const fileName = `${baseName}${ext}`;
  await writeFile(path.join(IMAGES_DIR, slug, fileName), Buffer.from(await res.arrayBuffer()));
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
function mapToAnimal(raw: RawAnimal, photos: string[]): Animal {
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

async function syncPhotos(raw: RawAnimal, warnings: string[]): Promise<string[]> {
  const acf = Array.isArray(raw.acf) ? {} : (raw.acf ?? {});
  const sources: { baseName: string; resolve: () => Promise<string | null> }[] = [
    { baseName: "main", resolve: () => resolveFeaturedImageUrl(raw) },
    { baseName: "photo-2", resolve: () => resolveAcfImageUrl(acf.photo_2) },
    { baseName: "photo-3", resolve: () => resolveAcfImageUrl(acf.photo_3) },
  ];

  await rm(path.join(IMAGES_DIR, raw.slug), { recursive: true, force: true });
  await mkdir(path.join(IMAGES_DIR, raw.slug), { recursive: true });

  const photos: string[] = [];
  for (const { baseName, resolve } of sources) {
    const url = await resolve();
    if (!url) {
      if (baseName === "main") warnings.push(`${raw.slug}: no featured image set`);
      continue;
    }
    try {
      photos.push(await downloadImage(url, raw.slug, baseName));
    } catch (err) {
      if (err instanceof UnreachableError) throw err;
      warnings.push(`${raw.slug}: failed to download ${baseName} (${url}): ${(err as Error).message}`);
    }
  }
  return photos;
}

async function main(): Promise<void> {
  console.log(`Syncing animals from ${WP_URL} ...`);

  const rawAnimals = await fetchAllRawAnimals();
  await mkdir(IMAGES_DIR, { recursive: true });

  const animals: Animal[] = [];
  const skipped: Skipped[] = [];
  const warnings: string[] = [];

  for (const raw of rawAnimals) {
    try {
      const photos = await syncPhotos(raw, warnings);
      animals.push(mapToAnimal(raw, photos));
    } catch (err) {
      if (err instanceof SyncError) throw err;
      skipped.push({ label: raw.slug, reason: (err as Error).message });
      await rm(path.join(IMAGES_DIR, raw.slug), { recursive: true, force: true });
    }
  }

  // Remove photo folders of animals that no longer exist (or were skipped).
  const keep = new Set(animals.map((a) => a.slug));
  for (const entry of await readdir(IMAGES_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && !keep.has(entry.name)) {
      await rm(path.join(IMAGES_DIR, entry.name), { recursive: true, force: true });
    }
  }

  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(animals, null, 2) + "\n");

  const photoCount = animals.reduce((n, a) => n + a.photos.length, 0);
  const byStatus = (s: AdoptionStatus) => animals.filter((a) => a.status === s).length;

  console.log("\nSync complete");
  console.log(`  Animals written : ${animals.length} (of ${rawAnimals.length} published)`);
  console.log(
    `  By status       : ${byStatus("available")} available, ${byStatus("pending")} pending, ${byStatus("adopted")} adopted`,
  );
  console.log(`  Photos saved    : ${photoCount}`);
  console.log(`  Data file       : ${path.relative(ROOT, DATA_FILE)}`);
  for (const a of animals) console.log(`    - ${a.name} (${a.slug}): ${a.photos.length} photo(s)`);
  for (const w of warnings) console.warn(`  ! ${w}`);
  for (const s of skipped) console.warn(`  ! Skipped ${s.label}: ${s.reason}`);
  if (skipped.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`\nSync failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
