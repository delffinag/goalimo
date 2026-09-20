# Verwendetes Material von Dritten

Diese Liste gilt für alles, was mit dem Spiel ausgeliefert wird (`dist/`).

| Material | Quelle | Lizenz | Lizenztext |
|---|---|---|---|
| Schrift Fredoka (Gewicht 600, Latin) | npm-Paket `@fontsource/fredoka` 5.3.0, © 2016 The Fredoka Project Authors | SIL Open Font License 1.1 | `licenses/OFL-Fredoka.txt` |
| Schrift Nunito (Gewichte 600 und 800, Latin) | npm-Paket `@fontsource/nunito` 5.3.0, © 2014 The Nunito Project Authors | SIL Open Font License 1.1 | `licenses/OFL-Nunito.txt` |

Die Schriftdateien liegen als woff2 in `public/fonts/`; `npm run fonts` holt sie zusammen mit den Lizenztexten aus den
npm-Paketen. Der Build kopiert `licenses/` und diese Datei mit nach `dist/`, damit die Lizenzhinweise mit ausgeliefert werden.

Alle Figuren, Porträts, Spielfelder, Icons und Symbole sind eigene, im Code gezeichnete Grafiken. Es werden keine
Sounddateien und keine Laufzeit-Bibliotheken ausgeliefert: Der ausgelieferte Code besteht nur aus eigenem TypeScript.

Die Werkzeuge zum Bauen und Testen (Vite, TypeScript, Vitest, Playwright, @types/node) stehen unter MIT bzw. Apache 2.0
und landen nicht im Build.

Jede neue Bibliothek, Schrift, Grafik oder Sounddatei wird hier mit Quelle und Lizenz ergänzt. Es werden nur Lizenzen
verwendet, die kommerzielle Nutzung erlauben (z. B. MIT, Apache 2.0, OFL, CC0, CC BY mit Namensnennung).
