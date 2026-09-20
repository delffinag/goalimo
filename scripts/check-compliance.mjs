// Prüft, dass keine Begriffe oder Quellen verwendet werden, die zu nah am Original liegen
// oder Daten an fremde Server schicken. Aufruf: node scripts/check-compliance.mjs [ordner ...]
// Ohne Argumente werden die Ordner aus DEFAULT_TARGETS geprüft.
//
// Ausnahme: Steht in einer Zeile (oder in der Zeile darüber) das Wort `compliance-ok`, wird sie
// übersprungen. Das ist für Fälle gedacht, die technisch nötig sind – zum Beispiel alte
// Speicher-Schlüssel, die für die Migration noch gelesen werden müssen. Jede Ausnahme wird am
// Ende mitgezählt und ausgegeben, damit sie sichtbar bleibt.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

// docs/ und prototype/ enthalten die verbotenen Begriffe absichtlich (Regelwerk und alter Prototyp)
const DEFAULT_TARGETS = ["src", "public", "pwa", "tests", "index.html", "README.md", "THIRD_PARTY_NOTICES.md"];
const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx", ".html", ".css", ".json", ".webmanifest", ".svg", ".md", ".txt"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "licenses", "fonts"]);

const RULES = [
  // A. Eigenständigkeit gegenüber dem Original
  { re: /\bbrawl(er|ers|s)?\b/i, why: "Begriff aus dem Original (Brawl/Brawler)" },
  { re: /brawl\s*ball|brawl\s*box/i, why: "Modus- oder Boxname aus dem Original" },
  { re: /power[\s_-]*points?/i, why: "Währung aus dem Original (Power Points)" },
  { re: /power[\s_-]*level/i, why: "Stufenname aus dem Original (Power Level)" },
  { re: /\bgems?\b/i, why: "Währungsname aus dem Original (Gems), bitte „kristalle“ verwenden" },
  { re: /\btroph(y|ies)\b|trophäe/i, why: "Trophäen-System aus dem Original" },
  { re: /hypercharge|supercell/i, why: "Begriff oder Marke aus dem Original" },
  { re: /lilita/i, why: "Schrift mit typischem Original-Look, bitte Fredoka verwenden" },
  { re: /fonts\.googleapis\.com|fonts\.gstatic\.com/i, why: "Schrift von Google-Servern (Datenschutz), lokal einbinden" },
  { re: /google-analytics|googletagmanager|gtag\(|facebook\.net|hotjar/i, why: "Tracking-Dienst eines Dritten" },
  // C. Datenschutz: das Spiel lädt nichts von fremden Servern und schickt nichts dorthin
  { re: /(?:src|href)\s*=\s*["']https?:\/\//i, why: "Datei von einem fremden Server (alles gehört ins Spiel selbst)" },
  { re: /url\(\s*["']?https?:\/\//i, why: "CSS lädt von einem fremden Server" },
  { re: /\bfetch\(\s*["'`]https?:\/\//i, why: "Anfrage an einen fremden Server" },
  { re: /new\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/, why: "Verbindung nach außen (das Spiel läuft nur auf dem Gerät)" },
  // Eigene Benennung nach docs/UPDATE-eigene-identitaet.md: alte Wörter dürfen nicht zurückkommen
  { re: /\bMünzen?\b/, why: "alter Begriff, bitte „Taler“ verwenden" },
  { re: /\bPowerpunkte?\b/i, why: "alter Begriff, bitte „Trainingspunkte“ verwenden" },
  { re: /\bJuwelen?\b/i, why: "alter Begriff, bitte „Kristalle“ verwenden" },
  { re: /\bBox(en)?\b/, why: "alter Begriff, bitte „Siegprämie“ verwenden" },
  { re: /\bVerbessern\b/i, why: "alter Begriff, bitte „Trainieren“ verwenden" }
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
const exceptions = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    const allowed = /compliance-ok/.test(line) || (i > 0 && /compliance-ok/.test(lines[i - 1]));
    for (const r of RULES) {
      if (!r.re.test(line)) continue;
      const where = `${f}:${i + 1}  ${r.why}\n    ${line.trim().slice(0, 140)}`;
      if (allowed) exceptions.push(where); else hits.push(where);
    }
  });
}

if (hits.length) {
  console.error(`Compliance-Prüfung fehlgeschlagen (${hits.length} Fundstellen):\n`);
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log(`Compliance-Prüfung bestanden (${files.length} Dateien geprüft, ${exceptions.length} bewusste Ausnahmen).`);
if (exceptions.length) console.log(exceptions.join("\n"));
