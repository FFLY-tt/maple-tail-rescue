import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Playwright specs live in e2e/ and run with `npm run test:e2e`.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
