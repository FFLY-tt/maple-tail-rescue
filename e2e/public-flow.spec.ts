import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

import type { Animal } from "../src/types/animal";

// The test reads the same synced data the site was built from, so it keeps working after `npm run sync`.
const animals: Animal[] = JSON.parse(readFileSync("src/data/animals.json", "utf8"));
const total = animals.length;
const cats = animals.filter((animal) => animal.species === "cat");
const cat = cats.find((animal) => animal.status !== "adopted");

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

test("visitor browses, filters, opens an animal and sends an application", async ({ page }) => {
  test.skip(!cat, "needs at least one cat that is not adopted in src/data/animals.json");
  const animal = cat!;

  // Stand in for Supabase: record what the app sends and answer "created". The real database is never contacted.
  const inserts: Record<string, unknown>[] = [];
  await page.route("https://e2e-test.supabase.co/rest/v1/applications**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    inserts.push(request.postDataJSON());
    return route.fulfill({ status: 201, headers: CORS, body: "" });
  });

  // Home
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Every dog and cat deserves a soft place to land." }),
  ).toBeVisible();

  // Home -> animals
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Our animals" }).click();
  await expect(page).toHaveURL(/\/animals$/);
  await expect(page.getByRole("heading", { level: 1, name: "Our animals" })).toBeVisible();
  await expect(page.getByText(`Showing ${total} of ${total}`)).toBeVisible();

  // Filter: cats only, and the Size filter goes away for cats
  await expect(page.getByLabel("Size")).toBeVisible();
  await page.getByLabel("Species").selectOption("cat");
  await expect(page.getByText(`Showing ${cats.length} of ${total}`)).toBeVisible();
  await expect(page.getByLabel("Size")).toHaveCount(0);

  // Animals -> detail page
  await page.getByRole("link", { name: animal.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/animals/${animal.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: animal.name })).toBeVisible();

  // Detail -> apply, with this animal preselected
  await page.getByRole("link", { name: "Apply to adopt" }).click();
  await expect(page).toHaveURL(new RegExp(`/apply\\?animal=${animal.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Apply to adopt" })).toBeVisible();

  // Step 1: About you
  await expect(page.getByRole("heading", { level: 2, name: "About you" })).toBeVisible();
  await page.getByLabel("Full name").fill("Sam Lee");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Phone number").fill("416-555-0123");
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: Home and household
  await expect(page.getByRole("heading", { level: 2, name: "Home and household" })).toBeVisible();
  await page.getByLabel("I own my home").check();
  await page.getByLabel("How many adults live in your home?").selectOption("2");
  await page.getByLabel("How many children live in your home?").selectOption("0");
  await page.getByLabel("Yes, everyone is on board").check();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 3: Pets and experience
  await expect(page.getByRole("heading", { level: 2, name: "Pets and experience" })).toBeVisible();
  await page.getByLabel("No", { exact: true }).check();
  await page.getByLabel("Your experience with pets").fill("Grew up with cats and dogs.");
  await page.getByRole("button", { name: "Next" }).click();

  // Step 4: Your match. The animal chosen on the detail page is already selected.
  await expect(page.getByRole("heading", { level: 2, name: "Your match" })).toBeVisible();
  await expect(page.getByLabel("Which animal are you applying for?")).toHaveValue(animal.slug);
  await page.getByLabel("Why are you interested in adopting?").fill("We have the time and space for a friend.");
  await page.getByRole("button", { name: "Submit application" }).click();

  // Success screen
  await expect(page.getByRole("heading", { name: "Thank you, Sam!" })).toBeVisible();
  await expect(page.getByText(`We’ve received your application for ${animal.name}.`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What happens next" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Apply" }).filter({ hasText: "Done" })).toBeVisible();
  await expect(page.getByRole("link", { name: `Back to ${animal.name}’s page` })).toHaveAttribute(
    "href",
    `/animals/${animal.slug}`,
  );
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
  await expect(page.getByText("Keep browsing animals")).toHaveCount(0);

  // Exactly one insert went out, in the database's column names.
  expect(inserts).toHaveLength(1);
  expect(inserts[0]).toEqual({
    full_name: "Sam Lee",
    email: "sam@example.com",
    phone: "416-555-0123",
    ownership: "own",
    landlord_permission: null,
    adults: "2",
    children: "0",
    household_agrees: "yes",
    has_pets: "no",
    current_pets: null,
    experience: "Grew up with cats and dogs.",
    animal_slug: animal.slug,
    animal_name: animal.name,
    why_interested: "We have the time and space for a friend.",
  });
});
