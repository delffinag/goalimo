# Goalimo

Mobiles Arena-Fußballspiel, 3 gegen 3 im Querformat, gespielt mit Touch-Joysticks. Läuft als Web-App (PWA) auf dem Handy:
ohne App-Store, ohne Server, ohne laufende Kosten. Alle Figuren und Grafiken sind eigene.

Fachliche Regeln und Projektkontext stehen in [CLAUDE.md](CLAUDE.md), die verbindlichen Regeln zu Eigenständigkeit,
Lizenzen und Datenschutz in [docs/RECHTLICHES.md](docs/RECHTLICHES.md). Der ursprüngliche Prototyp in einer Datei liegt
als Referenz in [prototype/fussballspiel-prototyp.html](prototype/fussballspiel-prototyp.html).

> Der Spielname „Goalimo“ ist ein Arbeitstitel. Vor einer Veröffentlichung sind die offenen Punkte aus
> [docs/RECHTLICHES.md](docs/RECHTLICHES.md) Abschnitt E zu erledigen (Markenrecherche, Impressum, Prüfung durch eine Fachperson).

## Entwickeln

```sh
npm install
npm run dev               # Entwicklungsserver
npm test                  # Unit-Tests (Simulation, Bots, Fortschritt)
npm run test:e2e          # Playwright: baut das Spiel und testet es in drei Bildschirmgrößen
npm run check:compliance  # Eigenständigkeit, Schriften, Datenschutz
npm run build             # Typprüfung + Build nach dist/
npm run preview           # Build lokal ansehen (mit Service Worker)
npm run fonts             # Schriften und Lizenztexte aus den npm-Paketen holen
npm run icons             # Icons aus public/icons/icon.svg erzeugen
```

Einmalig für Playwright: `npx playwright install chromium`.

Steuerung am Computer: WASD oder Pfeiltasten laufen, Mausklick schießt, Leertaste löst das Super aus.

Für Tests lässt sich die Spielwelt mit `?debug` von außen erreichen (`window.__game`); `?debug&spielzeit=4&goldengoal=20`
verkürzt zusätzlich Spielzeit und Verlängerung.

## Spielregeln (Kurzfassung)

3 gegen 3, zwei Modi, in der Lobby unten links wählbar:

| Modus | Punkt | Sieg |
| --- | --- | --- |
| **Fußball** | Der Ball muss ins gegnerische Tor. | 3 Tore |
| **Rugby** | Eine Figur muss den Ball selbst über die gegnerische Linie tragen – geschossen zählt nicht. | 3 Versuche |

- Spielzeit **3:00**.
- Gleichstand nach Ablauf: **Golden Goal**, höchstens 60 s. Fällt kein Punkt, endet das Spiel unentschieden.
- Ein **gelungener Pass** lädt den Super des Passgebers um 25 %.
- Ein Sieg gibt eine **Siegprämie**: drei offene Angebote (40–60 Taler, 15–25 Trainingspunkte, 2–4 Kristalle),
  der Spieler wählt genau eines. Keine Zufallsziehung, kein Kauf mit echtem Geld.
- Unentschieden: keine Prämie. Niederlage: −3 Kristalle (nie unter 0).
- **Erfahrung** (EP) je Figur steigt immer: Sieg +10, Unentschieden +5, Niederlage +2.
- **Trainingsstufe** 1–5 (als Sterne), je Stufe +8 % Leben, Schaden und Heilung.

## Aufbau

| Modul | Aufgabe |
| --- | --- |
| `src/data` | Figuren, Karte, Spielmodi und Balancing als Daten. Zahlen ändert man hier, nicht im Code. |
| `src/sim` | Simulation im festen Takt (60 Hz): Bewegung, Kollision, Geschosse, Ball, Tore, Übungsrunde. Kein DOM, eigene Zufallsquelle. |
| `src/ai` | Bots: Wegfindung, Pässe, bewusst ungenaues Zielen. |
| `src/input` | Joysticks, Super-Stick, Tastatur, Maus. Liefert pro Tick eine `PlayerInput`. |
| `src/render` | Canvas-Darstellung von Spielfeld, Figuren, Zielhilfe und Porträts. Liest die Welt nur. |
| `src/meta` | Name, Taler, Trainingspunkte, Kristalle, Siegprämien, Trainingsstufen, Erfahrung, Speicherung (localStorage, austauschbar). |
| `src/ui` | DOM-Screens: Willkommen, Lobby, Figuren, Siegprämie, Spielende, Anzeigen im Match, Bühne. |
| `src/game.ts` | Verbindet Eingabe → Simulation → Darstellung. |

Die Simulation ist strikt vom Rendering getrennt: Sie bekommt pro Tick nur die Eingabe des Spielers und meldet Ereignisse
(Tor, K.o., Golden Goal, Spielende) nach außen. Mit festem Startwert läuft ein Match reproduzierbar ab. So kann später ein
Server die Simulation übernehmen (Online-Multiplayer), ohne dass Rendering oder Eingabe umgebaut werden müssen.

Ein alter Spielstand des Vorgängers wird beim ersten Start einmalig übernommen (siehe `migrate` in `src/meta/progress.ts`).

## Schriften und Lizenzen

Fredoka (600) für Überschriften, Nunito (600/800) für Fließtext, beide unter der SIL Open Font License 1.1.
Die Dateien liegen als woff2 in `public/fonts/` und werden in `index.html` per `@font-face` eingebunden – es wird nichts
von Google oder anderen fremden Servern geladen. `npm run fonts` holt sie aus `@fontsource/fredoka` und `@fontsource/nunito`
und legt die Lizenztexte in `licenses/` ab; der Build kopiert `licenses/` und `THIRD_PARTY_NOTICES.md` mit nach `dist/`.

## PWA

- `public/manifest.webmanifest`: `"display": "fullscreen"`, `"orientation": "landscape"`.
- Service Worker (`pwa/sw.js`): Beim Build trägt `vite.config.ts` die Dateiliste und einen Hash darüber ein. Danach startet
  das Spiel offline. Eine neue Version ersetzt den alten Cache beim nächsten Laden.
- Hochkant wird die Ansicht per CSS um 90° gedreht, weil iOS die Ausrichtung nicht sperrt.
- Icons: `public/icons/icon.svg` ist die Vorlage, `npm run icons` erzeugt daraus die PNGs.

Auf dem Handy installieren: Seite im Browser öffnen, dann „Zum Startbildschirm hinzufügen“ (iOS: Teilen-Menü in Safari,
Android: Menü in Chrome).

## Veröffentlichen

Jeder Push auf `main` startet `.github/workflows/deploy.yml`: `npm run check:compliance`, Unit-Tests, Playwright-Tests,
und nur wenn alles grün ist, geht `dist/` auf GitHub Pages. In den Repository-Einstellungen muss dafür unter Pages als
Quelle „GitHub Actions“ gewählt sein. Der Build nutzt relative Pfade und läuft deshalb unter
`https://<name>.github.io/<repo>/` genauso wie auf einer eigenen Domain oder auf Cloudflare Pages.
