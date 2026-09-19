import { FIGURES } from "../data/figures";
import { applyMatchResult } from "../meta/progress";
import type { MatchResult } from "../sim/world";
import type { App } from "./app";
import { updateBoxButtons } from "./box";
import { $ } from "./dom";

const TITLE: Record<MatchResult, string> = { win: "Sieg!", draw: "Unentschieden", loss: "Niederlage" };

/** Spielende: Ergebnis verbuchen und anzeigen. Gibt die Funktion zum Anzeigen zurück. */
export function initEnd(app: App): (result: MatchResult) => void {
  $("endBox").addEventListener("click", () => app.openBox("end"));
  $("again").addEventListener("click", () => app.play());
  $("toMenu").addEventListener("click", () => { app.game.toMenu(); app.show("lobby"); });

  return result => {
    const p = app.progress, w = app.game.world;
    const s = applyMatchResult(p, w.player ? w.player.type : p.chosen, result);
    app.save();
    $("endTitle").textContent = TITLE[result];
    const main = result === "win" ? "Du hast eine Box gewonnen!"
      : result === "draw" ? "Unentschieden: keine Box."
      : s.gemsLost > 0 ? `−${s.gemsLost} Juwelen. Du hast jetzt ${p.gems}.` : "Keine Juwelen verloren, dein Konto war leer.";
    $("endGems").textContent = `${main} ${FIGURES[s.figure].name}: ${s.figChange >= 0 ? "+" : "−"}${Math.abs(s.figChange)} Figuren-Juwelen (jetzt ${s.figTotal}).`;
    const reward = $("endReward");
    reward.hidden = !s.fresh.length;
    reward.textContent = s.fresh.map(r => `${r.icon} Neue Belohnung: ${r.name}! ${r.desc}`).join(" ");
    const f = document.createElement("span"), i = document.createElement("span"), label = document.createElement("small");
    f.className = "f"; f.textContent = String(w.score[0]); i.className = "i"; i.textContent = String(w.score[1]); label.textContent = "Tore";
    $("endScore").replaceChildren(f, " : ", i, label);
    updateBoxButtons(p);
    app.show("end");
  };
}
