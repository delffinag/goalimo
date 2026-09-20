import { MEDAL_NAME } from "../data/balance";
import { FIGURES } from "../data/figures";
import { MODE_KEYS, MODES } from "../data/modes";
import { drawPortrait } from "../render/portrait";
import type { App } from "./app";
import { $ } from "./dom";
import { updatePraemieButtons } from "./praemie";

/**
 * Lobby: Name als Schild oben links mit der Medaille darunter, Währungen oben rechts,
 * „Figuren“ links, Spielmodus unten links, gewählte Figur über dem Knopf „Spielen“ unten rechts.
 */
export function initLobby(app: App): () => void {
  const btns = $("modeBtns");

  $("lobbyPlay").addEventListener("click", () => app.play());
  $("lobbySetup").addEventListener("click", () => app.show("figures"));
  $("lobbyPraemie").addEventListener("click", () => app.openPraemie("lobby"));
  $("medalBtn").addEventListener("click", () => app.show("path"));

  for (const key of MODE_KEYS) {
    const m = MODES[key];
    const b = document.createElement("button");
    b.className = "mbtn"; b.dataset.m = key;
    b.innerHTML = '<span class="mi" aria-hidden="true"></span><span class="mn"></span>';
    b.querySelector(".mi")!.textContent = m.icon;
    b.querySelector(".mn")!.textContent = m.name;
    b.addEventListener("click", () => {
      if (app.progress.modus === key) return;
      app.progress.modus = key;
      app.save();
      render();
    });
    btns.append(b);
  }

  function render(): void {
    const p = app.progress, T = FIGURES[p.chosen];
    // Das Namensschild ist quadratisch: längere Namen brauchen eine kleinere Schrift
    const plate = $("pName");
    plate.textContent = p.playerName;
    plate.dataset.len = p.playerName.length > 9 ? "lang" : p.playerName.length > 6 ? "mittel" : "kurz";
    $("talerCount").textContent = String(p.taler);
    $("trainingCount").textContent = String(p.training);
    $("kristallCount").textContent = String(p.kristalle);
    $("medalCount").textContent = String(p.medaillen);
    $("medalBtn").setAttribute("aria-label",
      `${p.medaillen} ${p.medaillen === 1 ? MEDAL_NAME : MEDAL_NAME + "n"}, Belohnungsweg öffnen`);
    $("lobbyName").textContent = T.name;
    $("lobbyClass").textContent = T.className;
    $("lobbyFigure").style.setProperty("--c", T.look[1]);
    for (const b of btns.children as HTMLCollectionOf<HTMLElement>)
      b.setAttribute("aria-pressed", String(b.dataset.m === p.modus));
    updatePraemieButtons(p);
    // Das Porträt erst zeichnen, wenn die Lobby sichtbar ist und der Canvas eine Größe hat
    requestAnimationFrame(() => drawPortrait($<HTMLCanvasElement>("lobbyCv"), p.chosen));
  }

  return render;
}
