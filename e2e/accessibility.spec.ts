import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";

import type { Animal } from "../src/types/animal";

/**
 * Automated accessibility checks (axe-core) on the public pages. They fail on serious and critical
 * violations. Lesser ones are listed in the test report so they stay visible.
 *
 * Automated checks find roughly a third of real accessibility problems. This does not replace testing with
 * a keyboard and a screen reader, and axe can't judge text over photos (see lib notes in the carousel spec).
 */

const animals: Animal[] = JSON.parse(readFileSync("src/data/animals.json", "utf8"));
const detailPage = animals.find((animal) => animal.status !== "adopted") ?? animals[0];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function checkAccessibility(page: Page, testInfo: TestInfo) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

  const describe = (v: (typeof violations)[number]) =>
    `${v.impact?.toUpperCase()} ${v.id}: ${v.help}\n` +
    v.nodes.map((n) => `    - ${n.target.join(" ")}  ${n.failureSummary?.split("\n")[1]?.trim() ?? ""}`).join("\n");

  const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const minor = violations.filter((v) => !blocking.includes(v));
  if (minor.length > 0) {
    testInfo.annotations.push({ type: "axe (not blocking)", description: minor.map(describe).join("\n") });
  }
  expect(blocking.map(describe), "serious or critical accessibility violations").toEqual([]);
}

test.describe("accessibility (axe)", () => {
  test("home page", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await checkAccessibility(page, testInfo);
  });

  test("animals list", async ({ page }, testInfo) => {
    await page.goto("/animals");
    await expect(page.getByRole("heading", { level: 1, name: "Our animals" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await checkAccessibility(page, testInfo);
  });

  test("animals list with the species filter on", async ({ page }, testInfo) => {
    await page.goto("/animals");
    await page.getByLabel("Species").selectOption("cat");
    await page.waitForLoadState("networkidle");
    await checkAccessibility(page, testInfo);
  });

  test("an animal's page", async ({ page }, testInfo) => {
    await page.goto(`/animals/${detailPage.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: detailPage.name })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await checkAccessibility(page, testInfo);
  });

  test("application form, first step", async ({ page }, testInfo) => {
    await page.goto("/apply");
    await expect(page.getByRole("heading", { level: 2, name: "About you" })).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("application form, with validation errors showing", async ({ page }, testInfo) => {
    await page.goto("/apply");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Please enter your full name")).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("application form, conditional questions showing", async ({ page }, testInfo) => {
    await page.goto("/apply");
    await page.getByLabel("Full name").fill("Sam Lee");
    await page.getByLabel("Email").fill("sam@example.com");
    await page.getByLabel("Phone number").fill("416-555-0123");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("I rent").check();
    await expect(page.getByText("Does your landlord allow pets?")).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("adoption process page", async ({ page }, testInfo) => {
    await page.goto("/adoption-process");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await checkAccessibility(page, testInfo);
  });
});
