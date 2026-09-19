# Fußballspiel

Mobiles Arena-Fußballspiel, 3 gegen 3 im Querformat, gespielt mit Touch-Joysticks. Läuft als Web-App (PWA) auf dem Handy:
ohne App-Store, ohne Server, ohne laufende Kosten. Alle Figuren und Grafiken sind eigene.

Fachliche Regeln und Projektkontext stehen in [CLAUDE.md](CLAUDE.md). Der ursprüngliche Prototyp in einer Datei liegt als
Referenz in [fussballspiel-prototyp.html](fussballspiel-prototyp.html).

## Entwickeln

```sh
npm install
npm run dev          # Entwicklungsserver
npm test             # Unit-Tests (Simulation, Bots, Fortschritt)
npm run test:e2e     # Playwright: baut das Spiel und testet es in drei Bildschirmgrößen
npm run build        # Typprüfung + Build nach dist/
npm run preview      # Build lokal ansehen (mit Service Worker)
```

Einmalig für Playwright: `npx playwright install chromium`.

Steuerung am Computer: WASD oder Pfeiltasten laufen, Mausklick schießt, Leertaste löst das Super aus.

## Aufbau

| Modul | Aufgabe |
| --- | --- |
| `src/data` | Figuren, Karte und Balancing als Daten. Zahlen ändert man hier, nicht im Code. |
| `src/sim` | Simulation im festen Takt (60 Hz): Bewegung, Kollision, Geschosse, Ball, Tore, Tutorial. Kein DOM, eigene Zufallsquelle. |
| `src/ai` | Bots: Wegfindung, Pässe, bewusst ungenaues Zielen. |
| `src/input` | Joysticks, Super-Stick, Tastatur, Maus. Liefert pro Tick eine `PlayerInput`. |
| `src/render` | Canvas-Darstellung von Spielfeld, Figuren, Zielhilfe und Porträts. Liest die Welt nur. |
| `src/meta` | Name, Währungen, Boxen, Level, Kosmetik, Speicherung (localStorage, austauschbar). |
| `src/ui` | DOM-Screens: Willkommen, Lobby, Figuren, Box, Spielende, Anzeigen im Match, Bühne. |
| `src/game.ts` | Verbindet Eingabe → Simulation → Darstellung. |

Die Simulation ist strikt vom Rendering getrennt: Sie bekommt pro Tick nur die Eingabe des Spielers und meldet Ereignisse
(Tor, K.o., Spielende) nach außen. Mit festem Startwert läuft ein Match reproduzierbar ab. So kann später ein Server die
Simulation übernehmen (Online-Multiplayer), ohne dass Rendering oder Eingabe umgebaut werden müssen.

## PWA

- `public/manifest.webmanifest`: `"display": "fullscreen"`, `"orientation": "landscape"`.
- Service Worker (`pwa/sw.js`): Beim Build trägt `vite.config.ts` die Dateiliste und einen Hash darüber ein. Danach startet
  das Spiel offline. Eine neue Version ersetzt den alten Cache beim nächsten Laden.
- Hochkant wird die Ansicht per CSS um 90° gedreht, weil iOS die Ausrichtung nicht sperrt.
- Schriften sind lokal gebündelt, das Spiel lädt nichts von fremden Servern.
- Icons: `public/icons/icon.svg` ist die Vorlage, `npm run icons` erzeugt daraus die PNGs.

Auf dem Handy installieren: Seite im Browser öffnen, dann „Zum Startbildschirm hinzufügen“ (iOS: Teilen-Menü in Safari,
Android: Menü in Chrome).

## Veröffentlichen

Jeder Push auf `main` startet `.github/workflows/deploy.yml`: Unit-Tests, Playwright-Tests, und nur wenn alles grün ist,
geht `dist/` auf GitHub Pages. In den Repository-Einstellungen muss dafür unter Pages als Quelle „GitHub Actions“ gewählt sein.
Der Build nutzt relative Pfade und läuft deshalb unter `https://<name>.github.io/<repo>/` genauso wie auf einer eigenen
Domain oder auf Cloudflare Pages.
