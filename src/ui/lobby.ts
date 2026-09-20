import { FIGURES } from "../data/figures";
import { MODE_KEYS, MODES } from "../data/modes";
import type { App } from "./app";
import { $ } from "./dom";
import { updatePraemieButtons } from "./praemie";

/**
 * Lobby: Name oben links, Taler/Trainingspunkte/Kristalle oben rechts, „Figuren“ links,
 * Spielmodus unten links, „Spielen“ unten rechts.
 */
export function initLobby(app: App): () => void {
  const btns = $("modeBtns");

  $("lobbyPlay").addEventListener("click", () => app.play());
  $("lobbySetup").addEventListener("click", () => app.show("figures"));
  $("lobbyPraemie").addEventListener("click", () => app.openPraemie("lobby"));

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
    const p = app.progress, T = FIGURES[p.chosen], m = MODES[p.modus];
    $("pName").textContent = p.playerName;
    $("talerCount").textContent = String(p.taler);
    $("trainingCount").textContent = String(p.training);
    $("kristallCount").textContent = String(p.kristalle);
    $("lobbyInfo").textContent = `${T.name}, ${T.className}`;
    $("lobbyDesc").textContent = `${m.name} 3 gegen 3: ${m.desc}`;
    for (const b of btns.children as HTMLCollectionOf<HTMLElement>)
      b.setAttribute("aria-pressed", String(b.dataset.m === p.modus));
    updatePraemieButtons(p);
  }

  return render;
}
