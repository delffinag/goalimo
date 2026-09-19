# Fußballspiel – Projektkontext für Claude Code

## Worum es geht
Mobiles Arena-Fußballspiel im Stil von Brawl Stars (eigene Figuren, keine fremden Marken oder Grafiken).
3 gegen 3 im Querformat, gespielt mit Touch-Joysticks. Ziel des MVP: als Web-App (PWA) auf dem Handy spielbar,
ohne App-Store und ohne laufende Kosten.

## Ausgangslage
`fussballspiel-prototyp.html` ist ein funktionierender Prototyp in einer einzigen Datei (Canvas 2D, Vanilla JS,
Daten in localStorage). Er ist die fachliche Referenz: Verhalten, Zahlen und Texte daraus übernehmen,
den Code aber sauber in Module aufteilen.

## Zielarchitektur (MVP, kostenlos)
- Vite + TypeScript, keine schwere Engine nötig. Das bestehende Canvas-Rendering in Module aufteilen.
- Module: `input` (Joysticks, Super-Stick, Tastatur), `sim` (fester Takt 60 Hz, Bewegung, Kollision, Geschosse, Ball),
  `ai` (Bots inkl. Pässe), `render` (Spielfeld, Figuren, HUD), `data` (Figuren, Karten, Balancing als Daten),
  `meta` (Lobby, Währungen, Boxen, Level, Speicherung), `ui` (DOM-Screens).
- Simulation strikt getrennt vom Rendering halten, damit später ein Server die Simulation übernehmen kann (Online-Multiplayer).
- PWA: `manifest.webmanifest` mit `"display": "fullscreen"` und `"orientation": "landscape"`, Service Worker für Offline-Start.
  Die bisherige Drehung der Ansicht per CSS im Hochformat als Rückfallebene behalten (iOS sperrt die Ausrichtung nicht).
- Hosting: GitHub Pages oder Cloudflare Pages (kostenlos). Deployment per GitHub Action.
- Speicherung im MVP: localStorage. Später optional Supabase (Free Tier) für Konten, damit Name und Fortschritt geräteübergreifend gelten.

## Fachliche Regeln (Stand Prototyp)
- Nur Modus Fußball. Sieg bei 2 Toren, Spielzeit 2:30, bei Zeitablauf entscheidet der Spielstand.
- Normaler Schuss mit Ball: ca. 300 px (3 Rasenstreifen à 100 px). Super-Schuss: ca. 500 px. Ballreibung exp(-3·t).
- Ballträger läuft mit 75 % Tempo. Wer ausgeschaltet wird, verliert den Ball. Respawn nach 5 s.
- Geschosse fliegen mit 68 % der Basisgeschwindigkeit (Ausweichen soll möglich sein). Gegner zielen bewusst ungenau.
- Super lädt durch Treffer und zusätzlich mit der Zeit (voll nach ca. 18 s). Super-Knopf: tippen = automatisch, ziehen = zielen.
- Bots passen, wenn sie bedrängt werden und ein Mitspieler freier und näher am Tor steht. Kein Torwart.
- Tor-Anzeige: „<Name> scored a goal“, bei Eigentor „<Name> scored an own goal“.
- Aktuell 3 Figuren: Rumpel (rot, hält am meisten aus), Zisch (gelb, am schnellsten), Falka (blau, größte Reichweite).
  Weitere 47 Figuren liegen im Prototyp in `ROSTER_ALL` bereit.
- Beim ersten Start einmalig Spielernamen abfragen (2–12 Zeichen), danach nicht mehr änderbar.
- Lobby: Name oben links, Münzen/Powerpunkte/Juwelen oben rechts, Knopf „Figuren“ links, „Spielen“ in der Mitte.
- Belohnung: Nur ein Sieg gibt eine Box mit 3 Objekten (Münzen 10–30, Powerpunkte 5–15, selten Juwelen 1–4).
  Niederlage: −3 Juwelen (nie unter 0). Figuren-Juwelen: Sieg +8, Unentschieden +2, Niederlage −4.
- Power-Level 1–5, jede Stufe +8 % Leben/Schaden/Heilung. Kosten: 50/20, 100/40, 180/70, 300/100 (Münzen/Powerpunkte).
- Kosmetik über Juwelen-Schwellen 10/25/45 (Krone, Goldrand, Funkenspur), einmal freigeschaltet bleibt freigeschaltet.

## Qualitätsregeln
- Mobile first, Querformat. Mindestens testen bei 760×320, 667×300 und hochkant 390×740 (gedrehte Ansicht).
- Playwright-Tests für: Namenseingabe, Figur wählen, Match starten, Tor fällt, Box öffnen, Aufwerten.
- Nur die Spielfläche darf `position: fixed` als Vollbild haben (früherer Fehler: eine globale `canvas`-Regel hat alle Bilder überdeckt).
- Keine fremden Marken, Figuren oder Grafiken verwenden.
- Texte im Spiel auf Deutsch (außer der Tor-Meldung, siehe oben).
