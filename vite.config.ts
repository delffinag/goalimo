import { defineConfig } from "vitest/config";

// Relative Basis, damit der Build unter https://<user>.github.io/<repo>/ genauso läuft wie auf einer eigenen Domain
export default defineConfig({
  base: "./",
  build: { target: "es2022" },
  test: { include: ["tests/unit/**/*.test.ts"] }
});
