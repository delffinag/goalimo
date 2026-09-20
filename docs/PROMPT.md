# Prompts für Claude Code

## Variante A: Es gibt schon ein Projekt aus der ersten Übergabe

```
Wir haben den Prototyp weiterentwickelt. Lies zuerst CLAUDE.md, docs/UPDATE-eigene-identitaet.md
und docs/RECHTLICHES.md. Vergleiche prototype/fussballspiel-prototyp.html mit dem aktuellen Code.

Setze alle Punkte aus docs/UPDATE-eigene-identitaet.md um, inklusive Umbenennung der internen
Bezeichner und einer Migration der gespeicherten Daten.

Richte außerdem ein:
1. npm-Skript "check:compliance", das scripts/check-compliance.mjs ausführt.
2. Die GitHub Action so, dass Tests und check:compliance vor jedem Deployment laufen und es bei
   Fehlern abbricht.
3. Die Schriften Fredoka und Nunito als lokale woff2-Dateien unter public/fonts/ (aus
   @fontsource/fredoka und @fontsource/nunito), die Lizenzen aus licenses/ im Build mitliefern
   und THIRD_PARTY_NOTICES.md aktuell halten.
4. Playwright-Tests aus Abschnitt 8 des Update-Dokuments.

Zeig mir zuerst einen kurzen Plan. Arbeite danach in kleinen Commits. Liste am Ende auf, was
erledigt ist, was check:compliance meldet und welche Punkte aus docs/RECHTLICHES.md Abschnitt E
noch offen sind.
```

## Variante B: Noch kein Projekt

```
Lies CLAUDE.md, docs/UPDATE-eigene-identitaet.md, docs/RECHTLICHES.md und den Prototyp
prototype/fussballspiel-prototyp.html. Baue daraus eine PWA mit Vite und TypeScript nach der
Zielarchitektur in CLAUDE.md. Der Prototyp ist die fachliche Referenz; übernimm Regeln, Zahlen
und Texte, benenne interne Bezeichner aber nach docs/UPDATE-eigene-identitaet.md.

Richte ein: Git-Repository, npm-Skript "check:compliance" (scripts/check-compliance.mjs),
Playwright-Tests für Handy-Querformat, lokale Schriften mit Lizenzen, THIRD_PARTY_NOTICES.md
und Deployment auf GitHub Pages per GitHub Action, die vorher Tests und check:compliance ausführt.

Zeig mir zuerst einen kurzen Plan. Arbeite in kleinen Schritten und zeig mir nach jedem Schritt
den Stand. Liste am Ende die offenen Punkte aus docs/RECHTLICHES.md Abschnitt E auf.
```
