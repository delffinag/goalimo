# Update: Eigene Identität (Stand 20.09.2026)

Ziel: Das Spiel soll sich klar von Brawl Stars unterscheiden. Referenz für Verhalten und Aussehen ist
`prototype/fussballspiel-prototyp.html`. Falls der Code schon existiert, diese Punkte dort umsetzen.
Falls noch kein Code existiert, gilt einfach der Prototyp.

## 1. Begriffe (sichtbare Texte und interne Bezeichner)
| Alt | Neu | Interner Bezeichner |
|---|---|---|
| Münzen | Taler | `taler` |
| Powerpunkte | Trainingspunkte | `training` |
| Juwelen | Kristalle | `kristalle` |
| Power-Level | Trainingsstufe (1–5, als Sterne) | `trainingsstufe` |
| Figuren-Juwelen | Erfahrung (EP), steigt nur | `erfahrung` |
| Box, „Box öffnen“ | Siegprämie, „Prämie wählen“ | `siegpraemie` |
| „Verbessern“ | „Trainieren“ | – |

Gespeicherte Werte beim Umbenennen migrieren (alte localStorage-Schlüssel einmalig lesen, in neue schreiben).

## 2. Siegprämie statt Zufallsbox
- Ein Sieg ergibt eine Siegprämie (auch mehrere können sich ansammeln).
- Anzeige: drei offene Angebote nebeneinander, z. B. 40–60 Taler, 15–25 Trainingspunkte, 2–4 Kristalle.
- Der Spieler wählt genau eines. Keine verdeckte Zufallsziehung, kein Kauf mit echtem Geld.
- Unentschieden: keine Prämie. Niederlage: −3 Kristalle (nie unter 0).

## 3. Erfahrung pro Figur
Sieg +10 EP, Unentschieden +5 EP, Niederlage +2 EP. EP sinken nie.

## 4. Kartendesign der Figuren
Helle Karte, oben ein Farbband in der Figurenfarbe, rundes Medaillon mit Porträt, darunter Name,
Stärke als farbige Pille, unten Sterne (Trainingsstufe) und EP. Gewählte Figur mit Häkchen oben rechts.
Nicht verwenden: vollflächig farbige Karte mit dunklen Balken, Zahl oben links, Level-Kreis unten links.

## 5. Schriften
„Lilita One“ entfernen. Überschriften: Fredoka (600). Fließtext: Nunito (600/800).
Beide lokal als woff2 unter `public/fonts/`, Lizenzen aus `licenses/` mit ausliefern. Keine Google-Server.

## 6. Symbole
Taler: goldene Münze. Trainingspunkte: grüner Kreis mit „T“. Kristalle: sechseckiger Kristall (lila-blau).

## 7. Fußballregeln
- Sieg bei 3 Toren, Spielzeit 3:00.
- Gleichstand nach Ablauf: Golden Goal, max. 60 s. Fällt kein Tor, endet das Spiel unentschieden.
- Gelungener Pass zu einem Mitspieler lädt den Super des Passgebers um 25 % (Hinweis „Pass! Super +25 %“).
- Tor-Meldung: „<Name> scored a goal“, Eigentor: „<Name> scored an own goal“.

## 8. Tests (Playwright, Querformat 760×320 und 667×300, hochkant 390×740)
- Siegprämie: drei Angebote sichtbar, Auswahl bucht genau ein Angebot, Knopf verschwindet danach.
- Golden Goal: mit verkürzter Spielzeit (Testparameter) bei 0:0 aktiv, nächstes Tor beendet das Spiel.
- Pass-Bonus: Super des Passgebers steigt um 25 %.
- Trainieren: Kosten werden abgezogen, Sterne steigen.
- Keine Schrift- oder sonstigen Anfragen an fremde Server (Netzwerk-Log im Test prüfen).
