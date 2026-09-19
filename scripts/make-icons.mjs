// Erzeugt die PNG-Icons aus public/icons/icon.svg. Aufruf: npm run icons
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icons/icon.svg", "utf8");
// [Datei, Kantenlänge, Eckenradius in %]. Maskierbare und Apple-Icons bleiben eckig, das System schneidet sie selbst zu.
const targets = [["icon-192.png", 192, 22], ["icon-512.png", 512, 22], ["maskable-512.png", 512, 0], ["apple-touch-icon.png", 180, 0]];

const browser = await chromium.launch();
for (const [file, size, radius] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}div{width:${size}px;height:${size}px;border-radius:${radius}%;overflow:hidden}svg{display:block}</style><div>${svg}</div>`);
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: true });
  await page.close();
  console.log(`public/icons/${file}`);
}
await browser.close();
