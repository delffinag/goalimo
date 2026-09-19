import { defineConfig } from "@playwright/test";

const PORT = 4173;

// Getestet wird der fertige Build, in den Größen aus CLAUDE.md: zweimal Handy quer und einmal hochkant (gedrehte Ansicht)
const sizes = { "quer-760x320": [760, 320], "quer-667x300": [667, 300], "hochkant-390x740": [390, 740] };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}/`, browserName: "chromium", hasTouch: true, trace: "retain-on-failure" },
  projects: Object.entries(sizes).map(([name, [width, height]]) => ({ name, use: { viewport: { width, height } } })),
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
