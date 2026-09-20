import { MEDALS, type MedalKind } from "../data/balance";
import { medalEntries, resultLine, sessionTally } from "../meta/session";
import type { MatchResult } from "../sim/world";
import type { App } from "./app";
import { $ } from "./dom";

const TITLE: Record<MatchResult, string> = { win: "Sieg!", draw: "Unentschieden", loss: "Niederlage" };

export function medalChip(kind: MedalKind, n: number): HTMLElement {
  const chip = document.createElement("span");
  chip.className = "chip"; chip.dataset.m = kind;
  const icon = document.createElement("span");
  icon.className = `medaille ${kind}`; icon.setAttribute("aria-hidden", "true");
  const b = document.createElement("b"); b.textContent = String(n);
  chip.append(icon, b);
  chip.setAttribute("aria-label", `${n} × ${MEDALS[kind].name}`);
  return chip;
}

/**
 * Nach einem Match: Ergebnis, Spielstand und die Wahl „Nochmal spielen“ oder „Spiel verlassen“.
 * Gutgeschrieben wird hier nichts – das passiert gesammelt beim Verlassen (siehe meta/session.ts).
 * Gibt die Funktion zum Anzeigen zurück.
 */
export function initEnd(app: App): (result: MatchResult) => void {
  $("endAgain").addEventListener("click", () => app.play());
  $("endLeave").addEventListener("click", () => app.leave());

  return result => {
    const w = app.game.world;
    $("endTitle").textContent = TITLE[result];
    const f = document.createElement("span"), i = document.createElement("span"), label = document.createElement("small");
    f.className = "f"; f.textContent = String(w.score[0]); i.className = "i"; i.textContent = String(w.score[1]);
    label.textContent = w.golden ? `${w.mode.label} nach Verlängerung` : w.mode.label;
    $("endScore").replaceChildren(f, " : ", i, label);

    // Laufende Sitzung: was bisher zusammengekommen ist und beim Verlassen wartet
    const t = sessionTally(app.session);
    const line = document.createElement("div");
    line.className = "tline";
    line.textContent = `${t.matches === 1 ? "1 Match" : `${t.matches} Matches`}: ${resultLine(t)}`;
    const chips = document.createElement("div");
    chips.className = "chips";
    for (const [kind, n] of medalEntries(t.medals)) chips.append(medalChip(kind, n));
    if (t.praemien) {
      const prize = document.createElement("span");
      prize.className = "chip"; prize.dataset.m = "praemie";
      prize.textContent = t.praemien === 1 ? "1 Siegprämie" : `${t.praemien} Siegprämien`;
      chips.append(prize);
    }
    const hint = document.createElement("small");
    hint.textContent = t.praemien
      ? "Gutgeschrieben wird alles, wenn du das Spiel verlässt."
      : "Gewinn ein Match, dann gibt es beim Verlassen etwas zu holen.";
    $("endTally").replaceChildren(line, chips, hint);

    app.show("end");
  };
}
