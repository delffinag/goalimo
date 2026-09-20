import { FIGURES } from "../data/figures";
import { medalEntries, resultLine, type SessionSummary } from "../meta/session";
import type { App } from "./app";
import { $ } from "./dom";
import { medalChip } from "./end";

/**
 * Abschluss einer Sitzung: hier wird gezeigt, was gerade gutgeschrieben wurde.
 * Danach wählt der Spieler seine Siegprämien – eine pro Sieg.
 */
export function initSummary(app: App): { show(sum: SessionSummary): void; refresh(): void } {
  $("sumDone").addEventListener("click", () => { app.game.toMenu(); app.show("lobby"); });
  $("sumPraemie").addEventListener("click", () => app.openPraemie("summary"));

  /** Der Prämienknopf hängt daran, wie viele Prämien noch offen sind – auch nach der Rückkehr aus der Wahl */
  function refresh(): void {
    const praemie = $("sumPraemie"), offen = app.progress.siegpraemien;
    praemie.hidden = offen < 1;
    praemie.textContent = offen > 1 ? `${offen} Prämien wählen` : "Prämie wählen";
    // Solange Prämien offen sind, ist „Zur Lobby“ der ruhigere Knopf
    $("sumDone").classList.toggle("ghostBig", offen > 0);
  }

  const show = (sum: SessionSummary) => {
    const matches = sum.matches === 1 ? "1 Match" : `${sum.matches} Matches`;
    $("sumMatches").textContent = sum.matches ? `${matches}: ${resultLine(sum)}` : "Kein Match gespielt.";

    const medals = $("sumMedals");
    const chips = medalEntries(sum.medals).map(([kind, n]) => medalChip(kind, n));
    medals.replaceChildren(...chips);
    medals.hidden = !chips.length;

    // Erfahrung je Figur und Kristallverlust
    const lines: string[] = sum.ep.map(e => `${FIGURES[e.figure].name}: +${e.plus} EP (jetzt ${e.total})`);
    if (sum.kristalleLost > 0) lines.push(`−${sum.kristalleLost} Kristalle`);
    if (!chips.length && sum.matches) lines.push("Keine Medaille – die gibt es nur für einen Sieg.");
    const list = $("sumEp");
    list.replaceChildren(...lines.map(text => {
      const div = document.createElement("div");
      div.textContent = text;
      return div;
    }));
    list.hidden = !lines.length;

    const reward = $("sumReward");
    reward.hidden = !sum.fresh.length;
    reward.textContent = sum.fresh.map(r => `${r.icon} Neue Belohnung: ${r.name}! ${r.desc}`).join(" ");

    app.show("summary");
  };

  return { show, refresh };
}
