import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Test files that call resetDb() share one Postgres test database and
    // reset it with TRUNCATE between tests. Running files in parallel lets
    // one file's reset race another file's in-flight assertions, so they
    // must run sequentially.
    fileParallelism: false,
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
