import { FIGURES } from "../data/figures";
import { MEDALS } from "../data/balance";
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
    const s = applyMatchResult(p, w.player ? w.player.type : p.chosen, result, w.score);
    app.save();
    $("endTitle").textContent = TITLE[result];
    const main = result === "win" ? "Du hast eine Siegprämie gewonnen!"
      : result === "draw" ? "Unentschieden: keine Prämie."
      : s.kristalleLost > 0 ? `−${s.kristalleLost} Kristalle. Du hast jetzt ${p.kristalle}.` : "Keine Kristalle verloren, dein Konto war leer.";
    $("endInfo").textContent = `${main} ${FIGURES[s.figure].name}: +${s.epPlus} EP (jetzt ${s.epTotal}).`;
    // Medaille für den Sieg: bleibt für immer, unabhängig von der Siegprämie
    const medalBox = $("endMedal");
    medalBox.hidden = !s.medal;
    if (s.medal) {
      const m = MEDALS[s.medal];
      const icon = document.createElement("span");
      icon.className = `medaille gross ${s.medal}`; icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      const name = document.createElement("b"); name.textContent = m.name;
      const why = document.createElement("small"); why.textContent = m.why;
      text.append(name, why);
      medalBox.replaceChildren(icon, text);
    }
    const reward = $("endReward");
    reward.hidden = !s.fresh.length;
    reward.textContent = s.fresh.map(r => `${r.icon} Neue Belohnung: ${r.name}! ${r.desc}`).join(" ");
    const f = document.createElement("span"), i = document.createElement("span"), label = document.createElement("small");
    f.className = "f"; f.textContent = String(w.score[0]); i.className = "i"; i.textContent = String(w.score[1]);
    label.textContent = w.golden ? `${w.mode.label} nach Verlängerung` : w.mode.label;
    $("endScore").replaceChildren(f, " : ", i, label);
    updatePraemieButtons(p);
    app.show("end");
  };
}
