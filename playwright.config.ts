import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

// The Formspree address is fake on purpose: the tests intercept the one request the
// app makes, so nothing here (or in .env.local) can send a real email.
const TEST_ENV = {
  NEXT_PUBLIC_FORMSPREE_ENDPOINT: "https://formspree.io/f/e2etest",
  // This build is for tests only, so skip the production-config guard (see src/lib/env-check.ts).
  ALLOW_PLACEHOLDER_ENV: "1",
};

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Tests run against the real production build (static export), not the dev server.
  webServer: {
    command: "npm run build && node e2e/serve-out.mjs",
    url: `http://localhost:${PORT}`,
    env: { ...TEST_ENV, PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
