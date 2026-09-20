import { MAX_STUFE } from "../data/balance";
import { descShot, descSup, FIGURE_KEYS, FIGURES, scaledType } from "../data/figures";
import { canTrainieren, epOf, stufeOf, trainieren, trainingCost } from "../meta/progress";
import { drawPortrait } from "../render/portrait";
import type { App } from "./app";
import { $ } from "./dom";
import { dragScroll } from "./scroll";

function statBar(label: string, v: number): HTMLElement {
  const row = document.createElement("div"); row.className = "stat";
  const b = document.createElement("b"); b.textContent = label;
  const bar = document.createElement("span"); bar.className = "bar";
  const fill = document.createElement("i"); fill.style.width = `${Math.round(Math.min(1, v) * 100)}%`;
  bar.append(fill); row.append(b, bar);
  return row;
}

function ability(el: HTMLElement, label: string, text: string): void {
  const b = document.createElement("b"); b.textContent = label;
  el.replaceChildren(b, " " + text);
}

/** Trainingsstufe als Sterne: gefüllte Sterne bis zur Stufe, der Rest bleibt leer */
function stars(el: HTMLElement, stufe: number): void {
  el.replaceChildren(...Array.from({ length: MAX_STUFE }, (_, i) => {
    const s = document.createElement("i");
    s.textContent = "★";
    if (i < stufe) s.className = "on";
    return s;
  }));
  el.setAttribute("aria-label", `Trainingsstufe ${stufe} von ${MAX_STUFE}`);
}

/** Figurenauswahl mit Karten und Detailansicht (Werte, Trainieren, Auswählen). Gibt die Funktion zum Betreten zurück. */
export function initFigures(app: App): () => void {
  const cards = $("cards"), modal = $("figModal");
  const p = app.progress;
  let detailKey = p.chosen;

  // Karte: helle Fläche, oben ein Farbband, rundes Medaillon mit Porträt, Name, Stärke als Pille, unten Sterne und EP
  for (const k of FIGURE_KEYS) {
    const T = FIGURES[k];
    const tile = document.createElement("button");
    tile.className = "tile"; tile.dataset.k = k;
    tile.style.setProperty("--c", T.look[1]);
    tile.innerHTML = '<span class="tband" aria-hidden="true"></span><span class="tcheck" aria-hidden="true">✓</span>' +
      '<span class="tmedal"><canvas class="cv"></canvas></span><span class="tname"></span><span class="tstr"></span>' +
      '<span class="tfoot"><span class="tstars"></span><span class="tep"></span></span>';
    tile.querySelector(".tname")!.textContent = T.name;
    tile.querySelector(".tstr")!.textContent = T.strength;
    tile.addEventListener("click", () => { if (!scroll.dragged()) openDetail(k); });
    cards.append(tile);
  }
  $("figCount").textContent = `(${FIGURE_KEYS.length})`;

  function refreshTiles(): void {
    for (const tile of cards.children as HTMLCollectionOf<HTMLElement>) {
      const k = tile.dataset.k!, stufe = stufeOf(p, k), ep = epOf(p, k);
      tile.setAttribute("aria-pressed", String(k === p.chosen));
      stars(tile.querySelector<HTMLElement>(".tstars")!, stufe);
      tile.querySelector(".tep")!.textContent = `${ep} EP`;
      tile.setAttribute("aria-label", `${FIGURES[k].name}, Trainingsstufe ${stufe}, ${ep} EP`);
    }
  }

  function openDetail(k: string): void {
    detailKey = k;
    const stufe = stufeOf(p, k), T = scaledType(k, stufe);
    $("detName").textContent = T.name;
    const info = $("detStufe");
    const label = document.createElement("span"), st = document.createElement("span");
    st.className = "stars"; stars(st, stufe);
    label.textContent = `Trainingsstufe ${stufe} von ${MAX_STUFE}, ${epOf(p, k)} EP `;
    info.replaceChildren(label, st);
    const up = $<HTMLButtonElement>("detTrain"), cost = trainingCost(p, k);
    up.textContent = cost ? `Trainieren: ${cost[0]} Taler + ${cost[1]} Trainingspunkte` : "Höchste Stufe";
    up.disabled = !canTrainieren(p, k);
    $("detRole").textContent = `${T.className}. Stärke: ${T.strength}`;
    ability($("detAtk"), "Angriff:", descShot(T.shot));
    ability($("detSup"), "Super:", descSup(T.sup));
    $("detStats").replaceChildren(statBar(`Leben ${T.hp}`, T.hp / 9000), statBar(`Reichweite ${T.range}`, T.range / 560), statBar(`Tempo ${T.speed}`, T.speed / 250));
    modal.hidden = false;
    requestAnimationFrame(() => drawPortrait($<HTMLCanvasElement>("detCv"), k));
  }

  function pick(): void {
    p.chosen = detailKey; app.save();
    refreshTiles();
  }

  $("detTrain").addEventListener("click", () => {
    if (!trainieren(p, detailKey)) return;
    app.save();
    openDetail(detailKey); refreshTiles();
  });
  $("detPick").addEventListener("click", () => { pick(); modal.hidden = true; });
  $("detClose").addEventListener("click", () => { modal.hidden = true; });
  $("play").addEventListener("click", () => { pick(); modal.hidden = true; app.play(); });
  $("menuBack").addEventListener("click", () => app.show("lobby"));

  const scroll = dragScroll(cards, app.game.stage);

  return function enter() {
    modal.hidden = true;
    refreshTiles();
    // Porträts erst zeichnen, wenn die Karten sichtbar sind und eine Größe haben
    requestAnimationFrame(() => {
      for (const tile of cards.children) drawPortrait(tile.querySelector<HTMLCanvasElement>(".cv")!, (tile as HTMLElement).dataset.k!);
      const sel = cards.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (sel) cards.scrollTop = Math.max(0, sel.offsetTop - cards.offsetTop - 8);
    });
  };
}
