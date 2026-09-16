import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "url";

/**
 * Vitest configuration for the frontend suite.
 *
 * The `test` script passes `--environment jsdom`; this file only supplies the
 * module aliases the app's own imports rely on (`@/…` and `declarations/…`),
 * which Vite resolves through `vite.config.js` but Vitest does not read.
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    // The workspace root holds a second copy of these packages; without dedupe
    // Vitest can resolve the root copy, whose internal relative imports do not
    // resolve from this package's node_modules.
    dedupe: ["@caffeineai/object-storage", "@icp-sdk/core"],
  },
  test: {
    pool: "threads",
    // The platform container exports thread bounds that can conflict with each
    // other; pinning both here keeps the pool constructible in any environment.
    poolOptions: {
      threads: { minThreads: 1, maxThreads: 1 },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    server: {
      deps: {
        // Process these through Vite's resolver instead of Node's, so the
        // workspace-local copies are used and their relative imports resolve.
        inline: ["@caffeineai/object-storage", "@caffeineai/core-infrastructure"],
      },
    },
  },
});
