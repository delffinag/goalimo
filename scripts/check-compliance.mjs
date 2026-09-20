// Prüft, dass keine Begriffe oder Quellen verwendet werden, die zu nah am Original liegen
// oder Daten an fremde Server schicken. Aufruf: node scripts/check-compliance.mjs [ordner ...]
// Ohne Argumente werden src/, public/ und index.html geprüft.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["src", "public", "index.html"];
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx", ".html", ".css", ".json", ".webmanifest", ".svg", ".md", ".txt"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "licenses", "fonts"]);

const RULES = [
  { re: /\bbrawl(er|ers|s)?\b/i, why: "Begriff aus dem Original (Brawl/Brawler)" },
  { re: /brawl\s*ball|brawl\s*box/i, why: "Modus- oder Boxname aus dem Original" },
  { re: /power[\s_-]*points?/i, why: "Währung aus dem Original (Power Points)" },
  { re: /power[\s_-]*level/i, why: "Stufenname aus dem Original (Power Level)" },
  { re: /\bgems?\b/i, why: "Währungsname aus dem Original (Gems), bitte „kristalle“ verwenden" },
  { re: /\btroph(y|ies)\b|trophäe/i, why: "Trophäen-System aus dem Original" },
  { re: /hypercharge|supercell/i, why: "Begriff oder Marke aus dem Original" },
  { re: /lilita/i, why: "Schrift mit typischem Original-Look, bitte Fredoka verwenden" },
  { re: /fonts\.googleapis\.com|fonts\.gstatic\.com/i, why: "Schrift von Google-Servern (Datenschutz), lokal einbinden" },
  { re: /google-analytics|googletagmanager|gtag\(|facebook\.net|hotjar/i, why: "Tracking-Dienst eines Dritten" }
];

const files = [];
function walk(p) {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) if (!SKIP_DIRS.has(e)) walk(join(p, e));
  } else if (TEXT_EXT.has(extname(p).toLowerCase())) files.push(p);
}
targets.forEach(walk);

const hits = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const r of RULES) if (r.re.test(line)) hits.push(`${f}:${i + 1}  ${r.why}\n    ${line.trim().slice(0, 140)}`);
  });
}

if (hits.length) {
  console.error(`Compliance-Prüfung fehlgeschlagen (${hits.length} Fundstellen):\n`);
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log(`Compliance-Prüfung bestanden (${files.length} Dateien geprüft).`);
