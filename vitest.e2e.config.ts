import { defineConfig } from "vitest/config";

// The e2e suite launches the built server and drives real Chrome/Lighthouse runs, so it
// lives outside the default `vitest` project and needs generous timeouts. Lighthouse binds
// a debugging port per run, so the specs must not execute concurrently.
export default defineConfig({
  test: {
    environment: "node",
    include: ["e2e/**/*.e2e.test.ts"],
    testTimeout: 180_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    retry: 1,
  },
});
