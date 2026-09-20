import type { LootKind } from "../data/balance";
import { collectItem, rollBox, useBox, type LootItem, type Progress } from "../meta/progress";
import type { App } from "./app";
import { $ } from "./dom";

const LOOT_LABEL: Record<LootKind, [cls: string, label: string]> = { coins: ["coin", "Münzen"], pp: ["pp", "Powerpunkte"], gems: ["gem", "Juwelen"] };

export function updateBoxButtons(p: Progress): void {
  const text = p.boxes > 1 ? `Box öffnen (${p.boxes})` : "Box öffnen";
  for (const id of ["endBox", "lobbyBox"]) { const b = $(id); b.hidden = p.boxes < 1; b.textContent = text; }
}

function lootEl(text: string, cls?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "item";
  if (cls) { const icon = document.createElement("span"); icon.className = cls; icon.setAttribute("aria-hidden", "true"); if (cls === "pp") icon.textContent = "⚡"; el.append(icon); }
  const label = document.createElement("span"); label.textContent = text; el.append(label);
  return el;
}

/** Box: jedes Tippen zieht eines der 3 Objekte. Gibt die Funktion zum Öffnen zurück. */
export function initBox(app: App): (from: "lobby" | "end") => void {
  const btn = $("boxBtn"), hint = $("boxHint"), loot = $("loot"), done = $("boxDone");
  let draws: LootItem[] = [], drawn = 0, origin: "lobby" | "end" = "lobby";

  btn.addEventListener("click", () => {
    if (drawn >= draws.length) return;
    if (drawn === 0 && !useBox(app.progress)) return;
    const item = draws[drawn++];
    const fresh = collectItem(app.progress, item);
    app.save();
    const [cls, label] = LOOT_LABEL[item.k];
    loot.append(lootEl(`+${item.n} ${label}`, cls));
    for (const r of fresh) loot.append(lootEl(`${r.icon} Neu: ${r.name}`));
    btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
    const left = draws.length - drawn;
    if (left === 0) { btn.hidden = true; done.hidden = false; hint.textContent = "Die Box ist leer."; }
    else hint.textContent = `Noch ${left} ${left === 1 ? "Objekt" : "Objekte"}. Tippe weiter.`;
  });
  done.addEventListener("click", () => { updateBoxButtons(app.progress); app.show(origin); });

  return from => {
    if (app.progress.boxes < 1) return;
    origin = from; draws = rollBox(); drawn = 0;
    loot.replaceChildren(); done.hidden = true; btn.hidden = false;
    hint.textContent = `Tippe auf die Box. Sie enthält ${draws.length} Objekte.`;
    app.show("box");
  };
}
