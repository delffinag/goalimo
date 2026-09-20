import { FIGURES } from "../data/figures";
import type { App } from "./app";
import { $ } from "./dom";
import { updatePraemieButtons } from "./praemie";

/** Lobby: Name oben links, Taler/Trainingspunkte/Kristalle oben rechts, „Figuren“ links, „Spielen“ in der Mitte */
export function initLobby(app: App): () => void {
  $("lobbyPlay").addEventListener("click", () => app.play());
  $("lobbySetup").addEventListener("click", () => app.show("figures"));
  $("lobbyPraemie").addEventListener("click", () => app.openPraemie("lobby"));

  return function render() {
    const p = app.progress, T = FIGURES[p.chosen];
    $("pName").textContent = p.playerName;
    $("talerCount").textContent = String(p.taler);
    $("trainingCount").textContent = String(p.training);
    $("kristallCount").textContent = String(p.kristalle);
    $("lobbyInfo").textContent = `${T.name}, ${T.className}`;
    updatePraemieButtons(p);
  };
}
