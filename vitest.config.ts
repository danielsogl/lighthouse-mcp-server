import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Test environment configuration
    environment: "node",

    // Include and exclude patterns
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "build"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,js}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,js}",
        "src/**/*.d.ts",
        "src/**/types.ts",
        "src/index.ts", // Main entry point - integration test level
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test globals
    globals: true,

    // Watch mode (for development)
    watch: false,

    // Timeout settings
    testTimeout: 30000,
    hookTimeout: 30000,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
