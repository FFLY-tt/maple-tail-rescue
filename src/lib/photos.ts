/**
 * Photo files. The sync script writes three versions of every photo, named by
 * suffix, and animals.json lists only the large one:
 *
 *   /animals/mochi/main-800.webp   800x1000  detail page, home carousel (listed in animals.json)
 *   /animals/mochi/main-400.webp   400x500   cards and thumbnails
 *   /animals/mochi/main-og.jpg     1000x1250 link previews (JPEG: not every platform reads WebP)
 *
 * All are cropped to 4:5 around the centre, which is what the site's
 * `object-cover` boxes show anyway, so nothing visible is lost.
 */

export const LARGE_SUFFIX = "-800.webp";
export const CARD_SUFFIX = "-400.webp";
export const OG_SUFFIX = "-og.jpg";

/** Pixel sizes of each version (width x height). */
export const PHOTO_SIZES = {
  large: { width: 800, height: 1000 },
  card: { width: 400, height: 500 },
  og: { width: 1000, height: 1250 },
} as const;

/** What a photo entry in animals.json must look like. */
export const PHOTO_PATH = /^\/animals\/[a-z0-9-]+\/[a-z0-9-]+-800\.webp$/;

/** The path of a version of a photo, given the large one animals.json lists. */
function variant(largePath: string, suffix: string): string {
  return largePath.endsWith(LARGE_SUFFIX) ? largePath.slice(0, -LARGE_SUFFIX.length) + suffix : largePath;
}

/** Small version, for cards and thumbnails. */
export const cardPhoto = (largePath: string) => variant(largePath, CARD_SUFFIX);

/** JPEG version, for og:image and twitter:image. */
export const ogPhoto = (largePath: string) => variant(largePath, OG_SUFFIX);
