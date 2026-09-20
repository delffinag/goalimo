# Rechtliche Leitplanken

Hinweis: Diese Liste ist eine technische Arbeitsgrundlage und keine Rechtsberatung. Vor einer
öffentlichen Veröffentlichung prüft eine Fachperson für Immaterialgüter- und Datenschutzrecht das Spiel.

## A. Eigenständigkeit gegenüber Brawl Stars (von Claude Code einzuhalten)
Spielideen und Genre-Konventionen sind in der Regel frei: 3 gegen 3, Draufsicht, Twin-Stick,
Büsche, Super-Angriff. Geschützt sind Namen, Figuren, Grafik, Oberfläche und der Gesamteindruck.

Verboten in Code, Texten, Dateinamen, Grafiken und Metadaten:
- Namen und Begriffe des Originals: Brawl, Brawler, Brawl Ball, Brawl Box, Power Points, Power Level,
  Gems, Trophies, Hypercharge, Supercell sowie Namen seiner Figuren.
- Nachbau der Original-Oberfläche (Kartenlayout, Menüaufbau, Icons, Schrift „Lilita One“).
- Grafiken, Sounds oder Musik aus dem Original oder aus Fan-Material.
- Vergleiche mit dem Original in Beschreibung, Store-Text oder Werbung („wie Brawl Stars“).

Automatische Prüfung: `npm run check:compliance` (Skript `scripts/check-compliance.mjs`).
Der Build und das Deployment brechen ab, wenn die Prüfung fehlschlägt.

## B. Lizenzen
- Schriften Fredoka und Nunito: SIL Open Font License 1.1. Lizenztexte in `licenses/` mitliefern
  und in `THIRD_PARTY_NOTICES.md` aufführen.
- Jede neue Bibliothek, Schrift, Grafik oder Sounddatei mit Quelle und Lizenz in
  `THIRD_PARTY_NOTICES.md` eintragen. Nur Lizenzen verwenden, die kommerzielle Nutzung erlauben
  (z. B. MIT, Apache 2.0, OFL, CC0, CC BY mit Namensnennung).
- Eigene Grafiken später von einer Grafikerin oder einem Grafiker: Rechteübertragung schriftlich regeln.

## C. Datenschutz (Privacy by Design)
- MVP speichert nur auf dem Gerät (localStorage): Spielername, Fortschritt, Einstellungen.
- Keine Analyse- oder Werbe-Tools, keine Cookies von Dritten, keine Anfragen an fremde Server.
- Sobald Daten auf einen Server gehen (z. B. Supabase-Konten): Datenschutzerklärung, Einwilligung,
  Löschfunktion und besondere Sorgfalt bei Minderjährigen (Schweizer DSG, in der EU DSGVO).

## D. Belohnungen und Geld
- Siegprämien werden nur erspielt, nie verkauft. Angebote sind offen sichtbar, keine Zufallsziehung.
- Keine Käufe mit echtem Geld im MVP. Später höchstens Kosmetik, keine Vorteile im Spiel.

## E. Offene Punkte für Menschen (nicht durch Code lösbar)
1. Eigenen Spielnamen finden und vorab in Swissreg (IGE) und bei EUIPO auf Verwechslungsgefahr prüfen.
2. Domain und Social-Media-Namen passend zum Spielnamen sichern.
3. Vor der Veröffentlichung: kurze Prüfung durch eine Fachperson (Marke, Gesamteindruck, Datenschutz).
4. Impressum und Datenschutzerklärung auf der Webseite, sobald das Spiel öffentlich ist.
5. Für App-Stores später: Altersfreigabe über IARC.
