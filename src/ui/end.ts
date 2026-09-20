import { FIGURES } from "../data/figures";
import { applyMatchResult } from "../meta/progress";
import type { MatchResult } from "../sim/world";
import type { App } from "./app";
import { $ } from "./dom";
import { updatePraemieButtons } from "./praemie";

const TITLE: Record<MatchResult, string> = { win: "Sieg!", draw: "Unentschieden", loss: "Niederlage" };

/** Spielende: Ergebnis verbuchen und anzeigen. Gibt die Funktion zum Anzeigen zurück. */
export function initEnd(app: App): (result: MatchResult) => void {
  $("endPraemie").addEventListener("click", () => app.openPraemie("end"));
  $("again").addEventListener("click", () => app.play());
  $("toMenu").addEventListener("click", () => { app.game.toMenu(); app.show("lobby"); });

  return result => {
    const p = app.progress, w = app.game.world;
    const s = applyMatchResult(p, w.player ? w.player.type : p.chosen, result);
    app.save();
    $("endTitle").textContent = TITLE[result];
    const main = result === "win" ? "Du hast eine Siegprämie gewonnen!"
      : result === "draw" ? "Unentschieden: keine Prämie."
      : s.kristalleLost > 0 ? `−${s.kristalleLost} Kristalle. Du hast jetzt ${p.kristalle}.` : "Keine Kristalle verloren, dein Konto war leer.";
    $("endInfo").textContent = `${main} ${FIGURES[s.figure].name}: +${s.epPlus} EP (jetzt ${s.epTotal}).`;
    const reward = $("endReward");
    reward.hidden = !s.fresh.length;
    reward.textContent = s.fresh.map(r => `${r.icon} Neue Belohnung: ${r.name}! ${r.desc}`).join(" ");
    const f = document.createElement("span"), i = document.createElement("span"), label = document.createElement("small");
    f.className = "f"; f.textContent = String(w.score[0]); i.className = "i"; i.textContent = String(w.score[1]);
    label.textContent = w.golden ? "Tore nach Golden Goal" : "Tore";
    $("endScore").replaceChildren(f, " : ", i, label);
    updatePraemieButtons(p);
    app.show("end");
  };
}
