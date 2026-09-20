// Holt die Schriften aus den npm-Paketen nach public/fonts/ und die Lizenztexte nach licenses/.
// Aufruf: npm run fonts. Die Dateien liegen im Repository, damit der Build nichts nachladen muss
// und das Spiel nie eine Schrift von einem fremden Server holt.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// [npm-Paket, Datei im Paket, Ziel in public/fonts/]
const FONTS = [
  ["@fontsource/fredoka", "files/fredoka-latin-600-normal.woff2", "fredoka-600.woff2"],
  ["@fontsource/nunito", "files/nunito-latin-600-normal.woff2", "nunito-600.woff2"],
  ["@fontsource/nunito", "files/nunito-latin-800-normal.woff2", "nunito-800.woff2"]
];
// [npm-Paket, Lizenzdatei im Paket, Ziel in licenses/]
const LICENSES = [
  ["@fontsource/fredoka", "LICENSE", "OFL-Fredoka.txt"],
  ["@fontsource/nunito", "LICENSE", "OFL-Nunito.txt"]
];

const inPkg = (pkg, file) => require.resolve(`${pkg}/package.json`).replace(/package\.json$/, file);

mkdirSync("public/fonts", { recursive: true });
for (const [pkg, from, to] of FONTS) {
  copyFileSync(inPkg(pkg, from), `public/fonts/${to}`);
  console.log(`public/fonts/${to}  (${pkg} ${require(`${pkg}/package.json`).version})`);
}
for (const [pkg, from, to] of LICENSES) {
  copyFileSync(inPkg(pkg, from), `licenses/${to}`);
  console.log(`licenses/${to}`);
}

// Stichprobe: die Lizenz muss die SIL Open Font License sein
for (const [, , to] of LICENSES) {
  const text = readFileSync(`licenses/${to}`, "utf8");
  if (!/SIL OPEN FONT LICENSE/i.test(text)) throw new Error(`licenses/${to} ist keine OFL`);
}
