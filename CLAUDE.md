# Fußballspiel – Projektkontext für Claude Code

## Worum es geht
Mobiles Arena-Fußballspiel im Stil von Brawl Stars (eigene Figuren, keine fremden Marken oder Grafiken).
3 gegen 3 im Querformat, gespielt mit Touch-Joysticks. Ziel des MVP: als Web-App (PWA) auf dem Handy spielbar,
ohne App-Store und ohne laufende Kosten.

## Ausgangslage
`prototype/fussballspiel-prototyp.html` ist ein funktionierender Prototyp in einer einzigen Datei (Canvas 2D, Vanilla JS,
Daten in localStorage). Er ist die fachliche Referenz: Verhalten, Zahlen und Texte daraus übernehmen,
den Code aber sauber in Module aufteilen.

## Wichtige Dokumente
- `docs/UPDATE-eigene-identitaet.md`: was sich zuletzt geändert hat (bei bestehendem Code umsetzen).
- `docs/RECHTLICHES.md`: verbindliche Regeln zu Eigenständigkeit, Lizenzen und Datenschutz.
- `scripts/check-compliance.mjs`: muss vor jedem Deployment grün sein (`npm run check:compliance`).
- `licenses/`: Lizenztexte der eingebetteten Schriften, gehören mit ins Deployment.

## Zielarchitektur (MVP, kostenlos)
- Vite + TypeScript, keine schwere Engine nötig. Das bestehende Canvas-Rendering in Module aufteilen.
- Module: `input` (Joysticks, Super-Stick, Tastatur), `sim` (fester Takt 60 Hz, Bewegung, Kollision, Geschosse, Ball),
  `ai` (Bots inkl. Pässe), `render` (Spielfeld, Figuren, HUD), `data` (Figuren, Karten, Balancing als Daten),
  `meta` (Lobby, Taler/Trainingspunkte/Kristalle, Siegprämien, Trainingsstufen, Erfahrung, Speicherung), `ui` (DOM-Screens).
- Simulation strikt getrennt vom Rendering halten, damit später ein Server die Simulation übernehmen kann (Online-Multiplayer).
- PWA: `manifest.webmanifest` mit `"display": "fullscreen"` und `"orientation": "landscape"`, Service Worker für Offline-Start.
  Die bisherige Drehung der Ansicht per CSS im Hochformat als Rückfallebene behalten (iOS sperrt die Ausrichtung nicht).
- Hosting: GitHub Pages oder Cloudflare Pages (kostenlos). Deployment per GitHub Action, die vorher Tests und `check:compliance` ausführt.
- Speicherung im MVP: localStorage. Später optional Supabase (Free Tier) für Konten, damit Name und Fortschritt geräteübergreifend gelten.

## Fachliche Regeln (Stand Prototyp)
- Zwei Modi, in der Lobby unten links wählbar (`src/data/modes.ts`), Spielzeit und Verlängerung gelten für beide:
  - **Fußball**: Sieg bei 3 Toren. Der Ball muss ins gegnerische Tor, egal wer ihn dorthin gebracht hat.
  - **Rugby**: Sieg bei 3 Versuchen. Eine Figur muss den Ball selbst über die gegnerische Linie tragen; ein
    geschossener Ball im Malfeld zählt nicht. Das Malfeld geht über die volle Feldhöhe (`TRY_ZONES` in `data/maps.ts`).
- Spielzeit 3:00. Bei Gleichstand nach Ablauf: Golden Goal (max. 60 s), danach Unentschieden.
- Gelungener Pass zu einem Mitspieler lädt den Super des Passgebers um 25 %.
- Normaler Schuss mit Ball: ca. 300 px (3 Rasenstreifen à 100 px). Super-Schuss: ca. 500 px. Ballreibung exp(-3·t).
- Ballträger läuft mit 75 % Tempo. Wer ausgeschaltet wird, verliert den Ball. Respawn nach 5 s.
- Geschosse fliegen mit 68 % der Basisgeschwindigkeit (Ausweichen soll möglich sein). Gegner zielen bewusst ungenau.
- Super lädt durch Treffer und zusätzlich mit der Zeit (voll nach ca. 18 s). Super-Knopf: tippen = automatisch, ziehen = zielen.
- Bots passen, wenn sie bedrängt werden und ein Mitspieler freier und näher am Tor steht. Kein Torwart.
- Punkt-Anzeige: „<Name> scored a goal“ bzw. im Rugby „<Name> scored a try“, bei einem Eigentor „… an own goal“.
- Aktuell 3 Figuren: Rumpel (rot, hält am meisten aus), Zisch (gelb, am schnellsten), Falka (blau, größte Reichweite).
  Weitere 47 Figuren liegen im Prototyp in `ROSTER_ALL` bereit.
- Beim ersten Start einmalig Spielernamen abfragen (2–12 Zeichen), danach nicht mehr änderbar.
- Lobby: Name als Quadrat oben links mit der Medaille darunter, Taler/Trainingspunkte/Kristalle oben rechts,
  Knopf „Figuren“ links, Spielmodus unten links, gewählte Figur über dem Knopf „Spielen“ unten rechts,
  Spielname in der Mitte.
- Sitzung: Nach jedem Match wählt der Spieler „Nochmal spielen“ oder „Spiel verlassen“. Der Bildschirm nach dem Match
  zeigt nur Ergebnis, Spielstand und den Stand der Sitzung – gutgeschrieben wird nichts. Erst beim Verlassen wird alles
  auf einmal verbucht (je Sieg eine Siegprämie, dazu Medaillen, Erfahrung und Kristallverlust) und in einer
  Abschluss-Übersicht gezeigt. Eine Sitzung, die nie verlassen wurde (Tab geschlossen), wird beim nächsten Start
  abgerechnet; sie liegt dafür unter `gl-sitzung` im Speicher.
- Medaille: Es gibt genau eine Art Medaille, eine pro Sieg. Sie kann nie verloren gehen und steht in der Lobby
  unter dem Namen; ein Tipp darauf öffnet den Belohnungsweg.
- Belohnungsweg (`REWARD_PATH` in `data/balance.ts`): feste Stationen bei steigenden Medaillenzahlen, jede mit einer
  offen sichtbaren Belohnung (Taler, Trainingspunkte oder Kristalle). Erreichte Stationen werden beim Verbuchen einer
  Sitzung automatisch gutgeschrieben. Der Weg ist endlich; danach ist er abgeschlossen.
- Belohnung: Ein Sieg gibt eine Siegprämie, gewählt wird sie beim Verlassen. Der Spieler wählt 1 von 3 sichtbaren Angeboten
  (40–60 Taler, 15–25 Trainingspunkte oder 2–4 Kristalle). Keine Zufallsziehung, keine Boxen.
  Niederlage: −3 Kristalle (nie unter 0). Erfahrung (EP) pro Figur, steigt nur: Sieg +10, Unentschieden +5, Niederlage +2.
- Trainingsstufe 1–5 (als Sterne), jede Stufe +8 % Leben/Schaden/Heilung. Kosten: 50/20, 100/40, 180/70, 300/100 (Taler/Trainingspunkte).
- Kosmetik über Kristall-Schwellen 10/25/45 (Krone, Goldrand, Funkenspur), einmal freigeschaltet bleibt freigeschaltet.
- Figurenkarten: helle Karte, Farbband oben, rundes Medaillon mit Porträt, Name, Stärke als Pille, Sterne und EP unten.

## Qualitätsregeln
- Mobile first, Querformat. Mindestens testen bei 760×320, 667×300 und hochkant 390×740 (gedrehte Ansicht).
- Playwright-Tests für: Namenseingabe, Figur wählen, Match starten, Tor fällt, Siegprämie wählen, Trainieren,
  Golden Goal, Pass-Bonus, Rugby-Modus und dass keine Anfrage an einen fremden Server geht.
- Nur die Spielfläche darf `position: fixed` als Vollbild haben (früherer Fehler: eine globale `canvas`-Regel hat alle Bilder überdeckt).
- Keine fremden Marken, Figuren oder Grafiken verwenden. Eigenständigkeit gegenüber Brawl Stars wahren:
  keine Begriffe wie Brawl, Brawler, Brawl Ball, Power Points, Power Level, Gems, Trophies oder Boxen;
  kein Nachbau der Original-Oberfläche. Schriften (Fredoka, Nunito, SIL OFL) als lokale woff2-Dateien unter `public/fonts/` einbinden (Quelle: npm-Pakete @fontsource/fredoka und @fontsource/nunito), nie von Google laden.
- Interne Bezeichner ebenfalls neutral benennen: `taler`, `training`, `kristalle`, `erfahrung`, `trainingsstufe`, `siegpraemie` statt `coins`, `pp`, `gems`, `figGems`, `level`, `box`.
- Texte im Spiel auf Deutsch (außer der Tor-Meldung, siehe oben).
