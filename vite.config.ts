import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/** Schreibt nach dem Build dist/sw.js mit der Liste aller Dateien, die für den Offline-Start gebraucht werden */
function serviceWorker(): Plugin {
  let outDir = "dist";
  return {
    name: "fussballspiel-service-worker",
    apply: "build",
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      const files = (readdirSync(outDir, { recursive: true, withFileTypes: true }))
        .filter(f => f.isFile())
        .map(f => relative(outDir, join(f.parentPath, f.name)).replaceAll("\\", "/"))
        // .woff ist nur die Rückfallebene für alte Browser, die ohnehin keinen Service Worker haben
        .filter(f => f !== "sw.js" && !f.endsWith(".woff"))
        .sort();
      const hash = createHash("sha256");
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const sw = readFileSync("pwa/sw.js", "utf8")
        .replace("__VERSION__", hash.digest("hex").slice(0, 12))
        .replace("__FILES__", JSON.stringify(files.map(f => "./" + f)));
      writeFileSync(join(outDir, "sw.js"), sw);
    }
  };
}

// Relative Basis, damit der Build unter https://<user>.github.io/<repo>/ genauso läuft wie auf einer eigenen Domain
export default defineConfig({
  base: "./",
  build: { target: "es2022" },
  plugins: [serviceWorker()],
  test: { include: ["tests/unit/**/*.test.ts"] }
});
