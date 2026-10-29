/** Turns a downloaded photo into the resized versions the site uses (see src/lib/photos.ts). */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { CARD_SUFFIX, LARGE_SUFFIX, OG_SUFFIX, PHOTO_SIZES } from "../src/lib/photos";

/**
 * Writes {baseName}-800.webp, -400.webp and -og.jpg into `dir`, each cropped to
 * 4:5 around the centre. Returns the file name of the large version.
 * Throws if `input` isn't an image sharp can read.
 */
export async function writePhotoVariants(input: Buffer, dir: string, baseName: string): Promise<string> {
  await mkdir(dir, { recursive: true });

  // rotate() applies the camera's EXIF orientation, so phone photos aren't sideways.
  const source = () => sharp(input, { failOn: "error" }).rotate();
  const crop = ({ width, height }: { width: number; height: number }) =>
    ({ width, height, fit: "cover", position: "centre", withoutEnlargement: false }) as const;

  const [large, card, og] = await Promise.all([
    source().resize(crop(PHOTO_SIZES.large)).webp({ quality: 78 }).toBuffer(),
    source().resize(crop(PHOTO_SIZES.card)).webp({ quality: 74 }).toBuffer(),
    source().resize(crop(PHOTO_SIZES.og)).jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
  ]);

  const largeName = `${baseName}${LARGE_SUFFIX}`;
  await Promise.all([
    writeFile(path.join(dir, largeName), large),
    writeFile(path.join(dir, `${baseName}${CARD_SUFFIX}`), card),
    writeFile(path.join(dir, `${baseName}${OG_SUFFIX}`), og),
  ]);
  return largeName;
}
