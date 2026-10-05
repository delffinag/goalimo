import { FIGURES } from "../data/figures";
import { SHOP_KOSMETIK, type ShopAngebot, type Waehrung } from "../data/shop";
import { kaufen, kaufStatus, shopBereiche, tagOf, type KaufStatus } from "../meta/shop";
import { drawPortrait } from "../render/portrait";
import type { App } from "./app";
import { $ } from "./dom";
import { dragScroll } from "./scroll";

const LABEL: Record<Waehrung, [cls: string, label: string]> = {
  taler: ["taler", "Taler"], training: ["training", "Trainingspunkte"], kristalle: ["kristall", "Kristalle"]
};

function icon(kind: Waehrung): HTMLElement {
  const el = document.createElement("span");
  el.className = LABEL[kind][0];
  el.setAttribute("aria-hidden", "true");
  if (kind === "training") el.textContent = "T";
  return el;
}

const STATUS_TEXT: Partial<Record<KaufStatus, string>> = { besessen: "Gehört dir", heuteGekauft: "Heute gekauft" };

/** Bild oben auf der Karte: Porträt bei Figuren, Symbol bei Kosmetik, Währungssymbol beim Tausch */
function picture(a: ShopAngebot): HTMLElement {
  const box = document.createElement("span");
  box.className = "spic"; box.setAttribute("aria-hidden", "true");
  const w = a.ware;
  if (w.art === "figur") {
    box.style.setProperty("--c", FIGURES[w.figur].look[1]);
    const cv = document.createElement("canvas"); cv.className = "cv"; cv.dataset.k = w.figur;
    box.append(cv);
  } else if (w.art === "kosmetik") {
    box.textContent = SHOP_KOSMETIK.find(k => k.id === a.id)?.icon ?? "";
  } else box.append(icon(w.w));
  return box;
}

/**
 * Shop: alles mit festem Preis in Spielwährung, offen sichtbar. Keine Zufallsziehung, kein echtes Geld, keine Medaillen.
 * Gibt die Funktion zum Betreten zurück.
 */
export function initShop(app: App): () => void {
  const body = $("shopBody"), note = $("shopNote");
  $("shopBack").addEventListener("click", () => app.show("lobby"));
  const scroll = dragScroll(body, app.game.stage);

  function counts(): void {
    const p = app.progress;
    $("shopTaler").textContent = String(p.taler);
    $("shopTraining").textContent = String(p.training);
    $("shopKristalle").textContent = String(p.kristalle);
  }

  function card(a: ShopAngebot, tag: string): HTMLElement {
    const st = kaufStatus(app.progress, a, tag);
    const el = document.createElement("div");
    el.className = "scard"; el.dataset.id = a.id; el.dataset.state = st;
    const name = document.createElement("b"); name.className = "sname"; name.textContent = a.name;
    const desc = document.createElement("small"); desc.textContent = a.desc;
    const buy = document.createElement("button");
    buy.className = "sbuy";
    const done = STATUS_TEXT[st];
    if (done) { buy.textContent = done; buy.disabled = true; }
    else {
      const n = document.createElement("b"); n.textContent = String(a.preis.n);
      buy.append(icon(a.preis.w), n);
      buy.disabled = st === "zuTeuer";
      buy.setAttribute("aria-label", `${a.name} für ${a.preis.n} ${LABEL[a.preis.w][1]} kaufen`);
      buy.addEventListener("click", () => { if (!scroll.dragged()) buyIt(a, tag); });
    }
    el.append(picture(a), name, desc, buy);
    return el;
  }

  function buyIt(a: ShopAngebot, tag: string): void {
    const fresh = kaufen(app.progress, a, tag);
    if (!fresh) return;
    app.save();
    const extra = fresh.map(r => ` ${r.icon} Neue Belohnung: ${r.name}!`).join("");
    note.textContent = (a.ware.art === "figur" ? `${a.name} gehört jetzt dir. Wähle die Figur unter „Figuren“.` : `Gekauft: ${a.name}.`) + extra;
    render();
  }

  function render(): void {
    const tag = tagOf(new Date());
    counts();
    body.replaceChildren(...shopBereiche(tag).map(b => {
      const sec = document.createElement("section");
      sec.className = "ssec"; sec.dataset.bereich = b.key;
      const h = document.createElement("h2"); h.className = "display"; h.textContent = b.titel;
      const grid = document.createElement("div"); grid.className = "sgrid";
      grid.append(...b.angebote.map(a => card(a, tag)));
      sec.append(h, grid);
      return sec;
    }));
    // Porträts erst zeichnen, wenn die Karten im Layout eine Größe haben
    requestAnimationFrame(() => {
      for (const cv of body.querySelectorAll<HTMLCanvasElement>("canvas.cv")) drawPortrait(cv, cv.dataset.k!);
    });
  }

  return function enter() {
    note.textContent = "";
    render();
    body.scrollTop = 0;
  };
}
