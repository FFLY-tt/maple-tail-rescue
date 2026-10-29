import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { assertProductionEnv } from "./src/lib/env-check";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(phase: string): NextConfig {
  // Only for `next build`. `next typegen` (npm run typecheck) loads this config in the same
  // production phase, and it, the dev server and the tests must work without real values.
  const isBuildCommand = process.argv.slice(2).includes("build");
  if (phase === PHASE_PRODUCTION_BUILD && isBuildCommand) {
    const { skipped } = assertProductionEnv(process.env);
    if (skipped) console.warn("! Production environment check skipped (ALLOW_PLACEHOLDER_ENV=1). Don't deploy this build.");
  }
  return nextConfig;
}
