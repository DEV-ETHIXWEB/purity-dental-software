import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for pure logic/unit tests (auth helpers, Zod schemas,
 * sample-data invariants). No React component rendering is tested here — the
 * modules under test in `src/lib/**` are plain TS (Zod schemas, crypto,
 * in-memory rate limiting), so there's no need for `jsdom` or
 * `@testing-library/react` as a test environment/dependency. If component
 * tests are added later, add `@vitejs/plugin-react` + `jsdom` +
 * `@testing-library/react` at that point rather than upfront.
 *
 * `tsconfigPaths`-equivalent `@/*` alias is configured manually below
 * (avoids pulling in `vite-tsconfig-paths` for a single alias entry).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // See src/test/server-only-stub.ts for why this is aliased.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "e2e/**"],
    reporters: ["default"],
  },
});
