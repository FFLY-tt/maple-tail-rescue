/**
 * The carousel draws its arrows, pause button and dots over the animals' photos, which an automated
 * accessibility checker (axe) can't judge. This measures them instead: for every photo, the contrast of each
 * control against the pixels actually under it, using the opacities written in HeroCarousel.tsx itself.
 *
 * WCAG 1.4.11 needs 3:1 for the parts of a control you need to see to use it. If this fails, a photo is too
 * light for the current overlay (or someone lowered an opacity): darken the overlay, don't loosen the test.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const MIN_CONTRAST = 3;

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const ICON: RGB = [0x2b, 0x21, 0x18]; // --foreground in globals.css

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: RGB) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** `top` at `alpha` opacity over `under`. */
const over = (top: RGB, under: RGB, alpha: number): RGB => top.map((t, i) => t * alpha + under[i] * (1 - alpha)) as RGB;

// The opacities, read from the component so this test can't drift from it.
const source = readFileSync("src/components/home/HeroCarousel.tsx", "utf8");
const opacity = (pattern: RegExp) => {
  const match = source.match(pattern);
  if (!match) throw new Error(`HeroCarousel.tsx no longer matches ${pattern}: update this test with it`);
  return Number(match[1]) / 100;
};
const discAlpha = opacity(/rounded-full bg-white\/(\d+) text-foreground/); // arrows and pause: the disc
const pillAlpha = opacity(/rounded-full bg-black\/(\d+) px-1\.5/); //          the pill behind the dots
const inactiveDotAlpha = opacity(/w-2\.5 bg-white\/(\d+)/); //               inactive dots

// Layout at the carousel's widest (28rem = 448 css px wide, 4:5), mapped onto the 800x1000 photo file.
const WIDTH = 448;
const HEIGHT = 560;
const SCALE = 800 / WIDTH;
const inCircle = (cx: number, cy: number, r: number) => (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
const inRect = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1;
const discs = [
  inCircle(28, HEIGHT / 2, 20), // previous: 40px, 8px from the left
  inCircle(WIDTH - 28, HEIGHT / 2, 20), // next
  inCircle(WIDTH - 28, HEIGHT - 28, 16), // pause: 32px, 12px from the bottom right
];
const pill = inRect(WIDTH / 2 - 66, HEIGHT - 44, WIDTH / 2 + 66, HEIGHT - 12); // 5 dots, 32px tall, 12px from the bottom

const photos = readdirSync("public/animals", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join("public/animals", entry.name, "main-800.webp"));

describe("carousel controls over every photo (worst pixel under each control)", () => {
  it("found photos to check", () => {
    expect(photos.length).toBeGreaterThan(0);
  });

  it.each(photos)("%s", async (file) => {
    const { data, info } = await sharp(readFileSync(file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number): RGB => {
      const i = (Math.round(y * SCALE) * info.width + Math.round(x * SCALE)) * 3;
      return [data[i], data[i + 1], data[i + 2]];
    };

    let icon = Infinity;
    let activeDot = Infinity;
    let inactiveDot = Infinity;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (discs.some((inDisc) => inDisc(x, y))) icon = Math.min(icon, contrast(ICON, over(WHITE, pixel(x, y), discAlpha)));
        if (pill(x, y)) {
          const background = over(BLACK, pixel(x, y), pillAlpha);
          activeDot = Math.min(activeDot, contrast(WHITE, background));
          inactiveDot = Math.min(inactiveDot, contrast(over(WHITE, background, inactiveDotAlpha), background));
        }
      }
    }

    expect(icon, "arrow / pause icon on its disc").toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(activeDot, "current-slide dot on the pill").toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(inactiveDot, "other dots on the pill").toBeGreaterThanOrEqual(MIN_CONTRAST);
  });
});
