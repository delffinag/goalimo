import { FIGURES } from "../data/figures";
import type { App } from "./app";
import { updateBoxButtons } from "./box";
import { $ } from "./dom";

/** Lobby: Name oben links, Währungen oben rechts, „Figuren“ links, „Spielen“ in der Mitte */
export function initLobby(app: App): () => void {
  $("lobbyPlay").addEventListener("click", () => app.play());
  $("lobbySetup").addEventListener("click", () => app.show("figures"));
  $("lobbyBox").addEventListener("click", () => app.openBox("lobby"));

  return function render() {
    const p = app.progress, T = FIGURES[p.chosen];
    $("pName").textContent = p.playerName;
    $("coinCount").textContent = String(p.coins); $("ppCount").textContent = String(p.pp); $("gemCount").textContent = String(p.gems);
    $("lobbyInfo").textContent = `${T.name}, ${T.className}`;
    updateBoxButtons(p);
  };
}
