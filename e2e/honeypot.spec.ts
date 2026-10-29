import { expect, test, type Page } from "@playwright/test";

const TRAP = 'input[name="office_note_2"]';
const T0 = new Date("2026-01-01T09:00:00Z");

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

/** Intercepts the Supabase insert; returns the list of bodies the app sent. */
async function captureInserts(page: Page) {
  const inserts: unknown[] = [];
  await page.route("https://e2e-test.supabase.co/rest/v1/applications**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    inserts.push(request.postDataJSON());
    return route.fulfill({ status: 201, headers: CORS, body: "" });
  });
  return inserts;
}

/** Opens /apply with a controllable clock, then fills every step (no animal chosen) up to the submit button. */
async function openAndFillForm(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto("/apply");
  // Freeze time one second after the page loaded. Nothing below advances it unless the test says so.
  await page.clock.pauseAt(new Date(T0.getTime() + 1000));

  await page.getByLabel("Full name").fill("Sam Lee");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Phone number").fill("416-555-0123");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("I own my home").check();
  await page.getByLabel("How many adults live in your home?").selectOption("2");
  await page.getByLabel("How many children live in your home?").selectOption("0");
  await page.getByLabel("Yes, everyone is on board").check();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("No", { exact: true }).check();
  await page.getByLabel("Your experience with pets").fill("Grew up with dogs.");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Which animal are you applying for?").selectOption("general");
  await page.getByLabel("Why are you interested in adopting?").fill("We have the time and space for a friend.");
}

test.describe("bot trap on the application form", () => {
  test("the trap is invisible to keyboard and assistive tech", async ({ page }) => {
    await page.goto("/apply");
    const trap = page.locator(TRAP);
    await expect(trap).toHaveAttribute("tabindex", "-1");
    await expect(trap).toHaveAttribute("autocomplete", "off");
    // `inert` on the wrapper keeps it out of the accessibility tree and tab order.
    await expect(page.locator("div[inert]").filter({ has: trap })).toHaveCount(1);
    // getByRole follows the accessibility tree: the trap is not exposed as a textbox at all.
    await expect(page.getByRole("textbox", { name: "Leave this field empty" })).toHaveCount(0);
  });

  test("a filled trap submitted instantly is dropped, but the visitor sees the normal success screen", async ({ page }) => {
    const inserts = await captureInserts(page);
    const warnings: string[] = [];
    page.on("console", (message) => message.type() === "warning" && warnings.push(message.text()));

    await openAndFillForm(page);
    await page.locator(TRAP).evaluate((input: HTMLInputElement) => (input.value = "http://spam.example"));
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByRole("heading", { name: "Thank you, Sam!" })).toBeVisible();
    expect(inserts).toHaveLength(0);
    expect(warnings.some((text) => text.includes("Application dropped"))).toBe(true);
  });

  test("a filled trap on a slow, human-paced submission (autofill) is still sent", async ({ page }) => {
    const inserts = await captureInserts(page);
    const warnings: string[] = [];
    page.on("console", (message) => message.type() === "warning" && warnings.push(message.text()));

    await openAndFillForm(page);
    await page.locator(TRAP).evaluate((input: HTMLInputElement) => (input.value = "Sam Lee"));
    await page.clock.runFor(30_000); // the person took half a minute
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByRole("heading", { name: "Thank you, Sam!" })).toBeVisible();
    expect(inserts).toHaveLength(1);
    expect(warnings.some((text) => text.includes("so the application was sent"))).toBe(true);
  });

  test("an empty trap is sent normally even when the form is filled quickly", async ({ page }) => {
    const inserts = await captureInserts(page);

    await openAndFillForm(page);
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByRole("heading", { name: "Thank you, Sam!" })).toBeVisible();
    expect(inserts).toHaveLength(1);
  });
});
