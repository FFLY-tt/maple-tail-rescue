import { expect, test, type Page } from "@playwright/test";

const LANDLORD_ERROR = "Please tell us whether your landlord allows pets";
const PETS_ERROR = "Please tell us a little about your pets";

/** Opens /apply and fills step 1 (contact), leaving the page on step 2 (home). */
async function toHomeStep(page: Page) {
  await page.goto("/apply");
  await page.getByLabel("Full name").fill("Sam Lee");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Phone number").fill("416-555-0123");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Home and household" })).toBeVisible();
}

async function fillHousehold(page: Page) {
  await page.getByLabel("How many adults live in your home?").selectOption("2");
  await page.getByLabel("How many children live in your home?").selectOption("0");
  await page.getByLabel("Yes, everyone is on board").check();
}

test.describe("conditional questions don't keep stale errors", () => {
  test("landlord question: an error from renting disappears for good when switching to owning", async ({ page }) => {
    await toHomeStep(page);
    await fillHousehold(page);

    // Rent, don't answer the landlord question, try to continue: the error appears.
    await page.getByLabel("I rent").check();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText(LANDLORD_ERROR)).toBeVisible();

    // Own: the question is gone, so is its error.
    await page.getByLabel("I own my home").check();
    await expect(page.getByText("Does your landlord allow pets?")).toHaveCount(0);
    await expect(page.getByText(LANDLORD_ERROR)).toHaveCount(0);

    // Rent again: a fresh, unanswered question, with no old error and nothing pre-selected.
    await page.getByLabel("I rent").check();
    await expect(page.getByText("Does your landlord allow pets?")).toBeVisible();
    await expect(page.getByText(LANDLORD_ERROR)).toHaveCount(0);
    await expect(page.getByLabel("Yes, pets are allowed")).not.toBeChecked();
    await expect(page.getByLabel("No, or I’m not sure yet")).not.toBeChecked();
  });

  test("landlord question: an answer given while renting is forgotten after switching to owning and back", async ({
    page,
  }) => {
    await toHomeStep(page);
    await page.getByLabel("I rent").check();
    await page.getByLabel("Yes, pets are allowed").check();
    await page.getByLabel("I own my home").check();
    await page.getByLabel("I rent").check();
    await expect(page.getByLabel("Yes, pets are allowed")).not.toBeChecked();
  });

  test("landlord question: still required when renting after all that", async ({ page }) => {
    await toHomeStep(page);
    await fillHousehold(page);
    await page.getByLabel("I rent").check();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("I own my home").check();
    await page.getByLabel("I rent").check();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText(LANDLORD_ERROR)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Home and household" })).toBeVisible();
  });

  test("owning moves on without ever being asked about a landlord", async ({ page }) => {
    await toHomeStep(page);
    await fillHousehold(page);
    await page.getByLabel("I rent").check();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("I own my home").check();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Pets and experience" })).toBeVisible();
  });

  test("pets question: the same applies to the description of current pets", async ({ page }) => {
    await toHomeStep(page);
    await fillHousehold(page);
    await page.getByLabel("I own my home").check();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Pets and experience" })).toBeVisible();
    await page.getByLabel("Your experience with pets").fill("Grew up with dogs.");

    // Yes, no description, Next: error.
    await page.getByLabel("Yes", { exact: true }).check();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText(PETS_ERROR)).toBeVisible();

    // No: question and error go away. Yes again: empty box, no old error.
    await page.getByLabel("No", { exact: true }).check();
    await expect(page.getByText(PETS_ERROR)).toHaveCount(0);
    await page.getByLabel("Yes", { exact: true }).check();
    await expect(page.getByLabel("Tell us about your pets")).toBeVisible();
    await expect(page.getByText(PETS_ERROR)).toHaveCount(0);
    await expect(page.getByLabel("Tell us about your pets")).toHaveValue("");
  });
});
