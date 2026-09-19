import { MAX_LEVEL } from "../data/balance";
import { descShot, descSup, FIGURE_KEYS, FIGURES, scaledType } from "../data/figures";
import { canUpgrade, figGemsOf, levelOf, upgrade, upgradeCost } from "../meta/progress";
import { drawPortrait } from "../render/portrait";
import type { App } from "./app";
import { $ } from "./dom";

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

/** Figurenauswahl mit Kacheln und Detailansicht (Werte, Verbessern, Auswählen). Gibt die Funktion zum Betreten zurück. */
export function initFigures(app: App): () => void {
  const cards = $("cards"), modal = $("figModal");
  const p = app.progress;
  let detailKey = p.chosen, dragged = false;

  for (const k of FIGURE_KEYS) {
    const T = FIGURES[k];
    const tile = document.createElement("button");
    tile.className = "tile"; tile.dataset.k = k;
    tile.style.setProperty("--c", T.look[1]);
    tile.innerHTML = '<span class="tg"><span class="gem" aria-hidden="true"></span><b></b></span><canvas class="cv"></canvas>' +
      '<span class="tbar"><span class="tlvl" title="Power-Level"></span><span class="tname"></span></span><span class="tstr"></span>';
    tile.querySelector(".tname")!.textContent = T.name;
    tile.querySelector(".tstr")!.textContent = T.strength;
    tile.addEventListener("click", () => { if (!dragged) openDetail(k); });
    cards.append(tile);
  }
  $("figCount").textContent = `(${FIGURE_KEYS.length})`;

  function refreshTiles(): void {
    for (const tile of cards.children as HTMLCollectionOf<HTMLElement>) {
      const k = tile.dataset.k!, lv = levelOf(p, k), gems = figGemsOf(p, k);
      tile.setAttribute("aria-pressed", String(k === p.chosen));
      tile.querySelector(".tlvl")!.textContent = String(lv);
      tile.querySelector(".tg b")!.textContent = String(gems);
      tile.setAttribute("aria-label", `${FIGURES[k].name}, Power-Level ${lv}, ${gems} Juwelen`);
    }
  }

  function openDetail(k: string): void {
    detailKey = k;
    const lv = levelOf(p, k), T = scaledType(k, lv);
    $("detName").textContent = T.name;
    $("detLvl").textContent = `Power-Level ${lv} von ${MAX_LEVEL}, ${figGemsOf(p, k)} Juwelen`;
    const up = $<HTMLButtonElement>("detUp"), cost = upgradeCost(p, k);
    up.textContent = cost ? `Verbessern: ${cost[0]} Münzen + ${cost[1]} Powerpunkte` : "Maximale Stufe";
    up.disabled = !canUpgrade(p, k);
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

  $("detUp").addEventListener("click", () => {
    if (!upgrade(p, detailKey)) return;
    app.save();
    openDetail(detailKey); refreshTiles();
  });
  $("detPick").addEventListener("click", () => { pick(); modal.hidden = true; });
  $("detClose").addEventListener("click", () => { modal.hidden = true; });
  $("play").addEventListener("click", () => { pick(); modal.hidden = true; app.play(); });
  $("menuBack").addEventListener("click", () => app.show("lobby"));

  // Eigenes Wischen zum Scrollen, damit es auch in der gedrehten Ansicht richtig herum funktioniert
  let drag: { id: number; y: number; top: number } | null = null;
  const stage = app.game.stage;
  cards.addEventListener("pointerdown", e => {
    dragged = false;
    if (e.pointerType !== "mouse") drag = { id: e.pointerId, y: stage.toLocal(e).y, top: cards.scrollTop };
  });
  cards.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = stage.toLocal(e).y - drag.y;
    if (Math.abs(dy) > 8) dragged = true;
    if (dragged) cards.scrollTop = drag.top - dy;
  });
  const endDrag = (e: PointerEvent) => { if (drag && e.pointerId === drag.id) drag = null; };
  cards.addEventListener("pointerup", endDrag);
  cards.addEventListener("pointercancel", endDrag);

  return function enter() {
    modal.hidden = true;
    refreshTiles();
    // Porträts erst zeichnen, wenn die Kacheln sichtbar sind und eine Größe haben
    requestAnimationFrame(() => {
      for (const tile of cards.children) drawPortrait(tile.querySelector<HTMLCanvasElement>(".cv")!, (tile as HTMLElement).dataset.k!);
      const sel = cards.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (sel) cards.scrollTop = Math.max(0, sel.offsetTop - cards.offsetTop - 8);
    });
  };
}
