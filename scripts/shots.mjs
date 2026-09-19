// Hilfsskript: Screenshots bei den Pflicht-Bildschirmgrößen. Aufruf: node scripts/shots.mjs <zielordner> [wartezeit-ms]
import { chromium } from "@playwright/test";
import { preview } from "vite";

const out = process.argv[2] || "shots", wait = Number(process.argv[3] || 5000);
const server = await preview({ preview: { port: 4188, strictPort: true }, logLevel: "silent" });
const browser = await chromium.launch();
for (const [w, h] of [[760, 320], [667, 300], [390, 740]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("http://localhost:4188/");
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${w}x${h}.png` });
  console.log(`${w}x${h}:`, errors.length ? errors : "keine Fehler");
  await page.close();
}
await browser.close();
await server.close();
