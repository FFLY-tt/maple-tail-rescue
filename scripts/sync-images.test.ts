import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writePhotoVariants } from "./sync-images";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "sync-images-"));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

/** A noisy photo-like JPEG, so compression behaves realistically. */
function fakePhoto(width: number, height: number, orientation?: number) {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7919 + (i >> 8) * 31) & 255;
  const image = sharp(raw, { raw: { width, height, channels: 3 } });
  return (orientation ? image.withMetadata({ orientation }) : image).jpeg({ quality: 95 }).toBuffer();
}

// Read through a buffer: on Windows sharp keeps a file open when given a path, which blocks cleanup.
const info = async (file: string) => sharp(await readFile(path.join(dir, file))).metadata();

describe("writePhotoVariants", () => {
  it("writes a large and a card WebP and a link-preview JPEG, cropped to 4:5", async () => {
    const name = await writePhotoVariants(await fakePhoto(2400, 1600), dir, "main");

    expect(name).toBe("main-800.webp");
    expect((await readdir(dir)).sort()).toEqual(["main-400.webp", "main-800.webp", "main-og.jpg"]);

    expect(await info("main-800.webp")).toMatchObject({ format: "webp", width: 800, height: 1000 });
    expect(await info("main-400.webp")).toMatchObject({ format: "webp", width: 400, height: 500 });
    expect(await info("main-og.jpg")).toMatchObject({ format: "jpeg", width: 1000, height: 1250 });
  });

  it("makes the card version much smaller than the large one, and both smaller than the original", async () => {
    const original = await fakePhoto(2400, 1600);
    await writePhotoVariants(original, dir, "main");
    const size = async (file: string) => (await stat(path.join(dir, file))).size;
    expect(await size("main-400.webp")).toBeLessThan(await size("main-800.webp"));
    expect(await size("main-800.webp")).toBeLessThan(original.length);
  });

  it("handles portrait photos and uses the baseName given", async () => {
    await writePhotoVariants(await fakePhoto(1200, 1800), dir, "photo-2");
    expect(await info("photo-2-800.webp")).toMatchObject({ width: 800, height: 1000 });
  });

  it("applies the camera's EXIF rotation before cropping", async () => {
    // Stored landscape but tagged "rotate 90 degrees": the real picture is portrait.
    await writePhotoVariants(await fakePhoto(1800, 1200, 6), dir, "main");
    expect(await info("main-800.webp")).toMatchObject({ width: 800, height: 1000 });
  });

  it("creates the folder if it doesn't exist", async () => {
    const nested = path.join(dir, "a", "b");
    await writePhotoVariants(await fakePhoto(800, 1000), nested, "main");
    expect(await readdir(nested)).toHaveLength(3);
  });

  it("rejects something that isn't an image, and writes nothing", async () => {
    await expect(writePhotoVariants(Buffer.from("<html>not an image</html>"), dir, "main")).rejects.toThrow();
    expect(await readdir(dir)).toEqual([]);
  });
});
