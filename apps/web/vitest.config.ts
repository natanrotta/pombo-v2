import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Vitest config for web unit/component tests. Kept separate from `vite.config.ts`
 * so the dev/build pipeline doesn't pull in jsdom and the TS lint rules for
 * test files don't leak into production code.
 *
 * Tests live alongside source as `*.spec.ts` / `*.spec.tsx`.
 */
export default defineConfig({
  plugins: [react()],
  // Mirror vite.config.ts so __APP_VERSION__ exists under test (see appVersion.ts).
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.spec.{ts,tsx}"],
    // Exclude e2e — Playwright owns those and they live in apps/web/e2e/.
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@/app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@/core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@/shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@/modules": fileURLToPath(new URL("./src/modules", import.meta.url)),
    },
  },
});
