/**
 * Whole-sync scenarios against a fake WordPress. The point of most of them: when a
 * sync fails, the previous photos and animals.json are untouched, byte for byte.
 */
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseAnimals } from "../src/lib/animal-schema";
import { runSync } from "./sync-animals";

const WP = "http://paws-demo.local";

let root: string;
let jpeg: Buffer;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "sync-run-"));
  jpeg = await sharp({ create: { width: 600, height: 800, channels: 3, background: "#c47a3b" } })
    .jpeg()
    .toBuffer();
  await seedPreviousSync();
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(root, { recursive: true, force: true });
});

// --- the state left by a previous, good sync -------------------------------------------------

const OLD_ANIMAL = {
  id: 1,
  slug: "old-friend",
  name: "Old Friend",
  species: "dog",
  ageGroup: "adult",
  size: "medium",
  sex: "male",
  goodWith: [],
  personality: "From the last sync.",
  status: "available",
  photos: ["/animals/old-friend/main-800.webp"],
};

async function seedPreviousSync() {
  await mkdir(path.join(root, "src", "data"), { recursive: true });
  await writeFile(path.join(root, "src", "data", "animals.json"), JSON.stringify([OLD_ANIMAL], null, 2) + "\n");
  for (const file of ["main-800.webp", "main-400.webp", "main-og.jpg"]) {
    await mkdir(path.join(root, "public", "animals", "old-friend"), { recursive: true });
    await writeFile(path.join(root, "public", "animals", "old-friend", file), `previous ${file}`);
  }
}

/** Every file under the project folder, with a hash of its content. */
async function snapshot(dir = root, base = root): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(full, base));
    else result[path.relative(base, full).replaceAll("\\", "/")] = createHash("sha1").update(await readFile(full)).digest("hex");
  }
  return result;
}

// --- a fake WordPress -------------------------------------------------------------------------

type Raw = Record<string, unknown>;

function rawAnimal(slug: string, id: number, acf: Raw = {}, extra: Raw = {}): Raw {
  return {
    id,
    slug,
    title: { rendered: slug[0].toUpperCase() + slug.slice(1) },
    featured_media: 0,
    acf: {
      species: "cat",
      age_group: "young",
      size: "small",
      sex: "female",
      good_with: ["cats"],
      personality: `About ${slug}.`,
      adoption_status: "available",
      ...acf,
    },
    _embedded: { "wp:featuredmedia": [{ source_url: `${WP}/uploads/${slug}.jpg` }] },
    ...extra,
  };
}

type Wordpress = { animals: Raw[]; imageStatus?: Record<string, number>; media?: Record<string, string>; down?: boolean };

function fakeWordpress(wp: Wordpress) {
  const handler = vi.fn(async (input: string | URL | Request) => {
    if (wp.down) throw new TypeError("fetch failed");
    const url = String(input);
    if (url.includes("rest_route=/wp/v2/animal")) {
      return new Response(JSON.stringify(wp.animals), { status: 200, headers: { "X-WP-TotalPages": "1" } });
    }
    const media = url.match(/rest_route=\/wp\/v2\/media\/(\d+)/);
    if (media) {
      const source = wp.media?.[media[1]];
      return source
        ? new Response(JSON.stringify({ source_url: source }), { status: 200 })
        : new Response("", { status: 404, statusText: "Not Found" });
    }
    const file = url.match(/\/uploads\/([^/?]+)\.jpg/)?.[1];
    if (file) {
      const status = wp.imageStatus?.[file];
      if (status) return new Response("", { status, statusText: "Error" });
      if (file.startsWith("corrupt")) return new Response("<html>not an image</html>", { status: 200 });
      return new Response(new Uint8Array(jpeg), { status: 200 });
    }
    return new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", handler);
  return handler;
}

/** Runs a sync that should fail; checks the project folder is byte-for-byte what it was. */
async function expectFailureWithNothingChanged(message: RegExp) {
  const before = await snapshot();
  await expect(runSync(root)).rejects.toThrow(message);
  expect(await snapshot()).toEqual(before);
  // And no scratch folder is left behind.
  expect((await readdir(root)).sort()).toEqual(["public", "src"]);
}

// --- success ---------------------------------------------------------------------------------

describe("a successful sync", () => {
  it("replaces the previous photos and data with the new ones", async () => {
    fakeWordpress({ animals: [rawAnimal("mochi", 22), rawAnimal("hazel", 17)] });

    const result = await runSync(root);
    expect(result.animals.map((a) => a.slug)).toEqual(["mochi", "hazel"]);

    // animals.json is the new data and is valid.
    const saved = parseAnimals(JSON.parse(await readFile(path.join(root, "src", "data", "animals.json"), "utf8")));
    expect(saved.map((a) => a.slug)).toEqual(["mochi", "hazel"]);
    expect(saved[0].photos).toEqual(["/animals/mochi/main-800.webp"]);

    // Every photo is there in all three sizes; the old animal's folder is gone.
    const photos = path.join(root, "public", "animals");
    expect((await readdir(photos)).sort()).toEqual(["hazel", "mochi"]);
    expect((await readdir(path.join(photos, "mochi"))).sort()).toEqual(["main-400.webp", "main-800.webp", "main-og.jpg"]);
    expect((await stat(path.join(photos, "mochi", "main-800.webp"))).size).toBeGreaterThan(100);

    // Nothing else is left in the project folder.
    expect((await readdir(root)).sort()).toEqual(["public", "src"]);
    expect((await readdir(path.join(root, "src", "data"))).sort()).toEqual(["animals.json"]);
  });

  it("looks up an ACF photo given as a media ID", async () => {
    fakeWordpress({
      animals: [rawAnimal("mochi", 22, { photo_2: 99, photo_3: { url: `${WP}/uploads/extra.jpg` } })],
      media: { "99": `${WP}/uploads/second.jpg` },
    });
    const { animals } = await runSync(root);
    expect(animals[0].photos).toEqual([
      "/animals/mochi/main-800.webp",
      "/animals/mochi/photo-2-800.webp",
      "/animals/mochi/photo-3-800.webp",
    ]);
  });

  it("keeps an animal with no featured image (as a warning) and a deleted extra photo", async () => {
    fakeWordpress({
      animals: [rawAnimal("mochi", 22, { photo_2: 99 }, { _embedded: {} })],
      media: {}, // media 99 was deleted: 404
    });
    const { animals, warnings } = await runSync(root);
    expect(animals[0].photos).toEqual([]);
    expect(warnings).toEqual(["mochi: no featured image set"]);
  });
});

// --- failures: nothing may change ------------------------------------------------------------

describe("a failed sync leaves the previous photos and animals.json untouched", () => {
  it("when WordPress is not running", async () => {
    fakeWordpress({ animals: [], down: true });
    await expectFailureWithNothingChanged(/Cannot reach WordPress/);
  });

  it("when WordPress returns no animals", async () => {
    fakeWordpress({ animals: [] });
    await expectFailureWithNothingChanged(/no published animals/);
  });

  it("when an animal has an invalid field (it is not silently dropped)", async () => {
    fakeWordpress({ animals: [rawAnimal("mochi", 22), rawAnimal("hazel", 17, { species: "hamster" })] });
    await expectFailureWithNothingChanged(/1 animal\(s\) could not be read[\s\S]*hazel: field "species"/);
  });

  it("when a photo can't be downloaded, even though other animals synced fine", async () => {
    fakeWordpress({ animals: [rawAnimal("mochi", 22), rawAnimal("hazel", 17)], imageStatus: { hazel: 500 } });
    await expectFailureWithNothingChanged(/hazel: could not download or read main/);
  });

  it("when a downloaded file isn't an image", async () => {
    fakeWordpress({ animals: [rawAnimal("corrupt-one", 5)] });
    await expectFailureWithNothingChanged(/corrupt-one: could not download or read main/);
  });

  it("when a media lookup fails with a server error (not just 'deleted')", async () => {
    const handler = fakeWordpress({ animals: [rawAnimal("mochi", 22, { photo_2: 99 })] });
    const base = handler.getMockImplementation()!;
    handler.mockImplementation(async (input) =>
      String(input).includes("/wp/v2/media/99") ? new Response("", { status: 500, statusText: "Server Error" }) : base(input),
    );
    await expectFailureWithNothingChanged(/responded 500/);
  });

  it("when the synced data is not valid (duplicate slug)", async () => {
    fakeWordpress({ animals: [rawAnimal("mochi", 22), rawAnimal("mochi", 23)] });
    await expectFailureWithNothingChanged(/the synced animals is not valid[\s\S]*record 2 \(slug "mochi", id 23\)[\s\S]*duplicates slug/);
  });

  it("also when an earlier killed run left its staging folder behind", async () => {
    await mkdir(path.join(root, ".sync-staging", "animals", "junk"), { recursive: true });
    fakeWordpress({ animals: [], down: true });
    const before = await snapshot();
    delete before[".sync-staging/animals/junk"]; // (empty folder: not a file)
    await expect(runSync(root)).rejects.toThrow(/Cannot reach WordPress/);
    expect(await snapshot()).toEqual(before);
    expect((await readdir(root)).sort()).toEqual(["public", "src"]);
  });
});
