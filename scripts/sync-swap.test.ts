import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { swapIn } from "./sync-swap";

let root: string;
const p = (...parts: string[]) => path.join(root, ...parts);

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "sync-swap-"));
});
afterEach(() => rm(root, { recursive: true, force: true }));

async function put(file: string, content: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}
const read = (file: string) => readFile(file, "utf8");
const names = (dir: string) => readdir(dir).then((list) => list.sort());

/** Live (old) data plus a staged (new) copy. */
async function setup(options: { live?: boolean } = {}) {
  if (options.live !== false) {
    await put(p("public", "animals", "old", "main-800.webp"), "OLD PHOTO");
    await put(p("src", "data", "animals.json"), "OLD DATA");
  }
  await put(p("staging", "animals", "new", "main-800.webp"), "NEW PHOTO");
  await put(p("staging", "animals.json"), "NEW DATA");
  return {
    stagedImages: p("staging", "animals"),
    stagedData: p("staging", "animals.json"),
    imagesDir: p("public", "animals"),
    dataFile: p("src", "data", "animals.json"),
  };
}

describe("swapIn", () => {
  it("replaces the photos and the data, and leaves no backups", async () => {
    const paths = await setup();
    await swapIn(paths);

    expect(await names(paths.imagesDir)).toEqual(["new"]);
    expect(await read(path.join(paths.imagesDir, "new", "main-800.webp"))).toBe("NEW PHOTO");
    expect(await read(paths.dataFile)).toBe("NEW DATA");
    expect(await names(p("public"))).toEqual(["animals"]);
    expect(await names(p("src", "data"))).toEqual(["animals.json"]);
  });

  it("works on a first sync, when there is nothing to replace", async () => {
    const paths = await setup({ live: false });
    await swapIn(paths);
    expect(await read(paths.dataFile)).toBe("NEW DATA");
    expect(await names(paths.imagesDir)).toEqual(["new"]);
  });

  it("puts everything back if the last step fails (staged data missing)", async () => {
    const paths = await setup();
    await rm(paths.stagedData); // the final rename will fail

    await expect(swapIn(paths)).rejects.toThrow();

    // Old photos and old data are back; the staged photos are back in staging.
    expect(await read(path.join(paths.imagesDir, "old", "main-800.webp"))).toBe("OLD PHOTO");
    expect(await names(paths.imagesDir)).toEqual(["old"]);
    expect(await read(paths.dataFile)).toBe("OLD DATA");
    expect(await read(path.join(paths.stagedImages, "new", "main-800.webp"))).toBe("NEW PHOTO");
    expect(await names(p("public"))).toEqual(["animals"]);
    expect(await names(p("src", "data"))).toEqual(["animals.json"]);
  });

  it("changes nothing if the staged photos are missing", async () => {
    const paths = await setup();
    await rm(paths.stagedImages, { recursive: true });

    await expect(swapIn(paths)).rejects.toThrow();

    expect(await read(path.join(paths.imagesDir, "old", "main-800.webp"))).toBe("OLD PHOTO");
    expect(await read(paths.dataFile)).toBe("OLD DATA");
  });

  describe("recovering from an interrupted earlier swap", () => {
    it("restores the old photos if they were moved aside and the new ones never arrived", async () => {
      const paths = await setup({ live: false });
      await put(p("public", "animals.sync-old", "old", "main-800.webp"), "OLD PHOTO");
      await put(p("src", "data", "animals.json.sync-old"), "OLD DATA");

      // The swap itself then proceeds with the new data; the recovered old copies get replaced and cleaned up.
      await swapIn(paths);
      expect(await read(paths.dataFile)).toBe("NEW DATA");
      expect(await names(p("public"))).toEqual(["animals"]);
      expect(await names(p("src", "data"))).toEqual(["animals.json"]);
    });

    it("removes a stale backup when the live copy exists", async () => {
      const paths = await setup();
      await put(p("public", "animals.sync-old", "stale", "x.webp"), "STALE");
      await swapIn(paths);
      expect(await names(p("public"))).toEqual(["animals"]);
    });
  });
});
