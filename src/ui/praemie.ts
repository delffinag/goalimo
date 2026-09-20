import type { PraemieKind } from "../data/balance";
import { praemieAngebote, waehlePraemie, type PraemieItem, type Progress } from "../meta/progress";
import type { App } from "./app";
import { $ } from "./dom";

const LABEL: Record<PraemieKind, [cls: string, label: string]> = {
  taler: ["taler", "Taler"], training: ["training", "Trainingspunkte"], kristalle: ["kristall", "Kristalle"]
};

/** Symbol einer Währung. Die Trainingspunkte tragen ein „T“ im grünen Kreis. */
function icon(kind: PraemieKind): HTMLElement {
  const el = document.createElement("span");
  el.className = LABEL[kind][0];
  el.setAttribute("aria-hidden", "true");
  if (kind === "training") el.textContent = "T";
  return el;
}

/** Der Knopf „Prämie wählen“ ist nur sichtbar, solange eine Siegprämie offen ist */
export function updatePraemieButtons(p: Progress): void {
  const text = p.siegpraemien > 1 ? `Prämie wählen (${p.siegpraemien})` : "Prämie wählen";
  const b = $("lobbyPraemie");
  b.hidden = p.siegpraemien < 1;
  b.textContent = text;
}

function offerButton(item: PraemieItem, choose: (item: PraemieItem) => void): HTMLButtonElement {
  const [, label] = LABEL[item.k];
  const b = document.createElement("button");
  b.className = "offer"; b.dataset.k = item.k;
  b.setAttribute("aria-label", `${item.n} ${label} wählen`);
  const n = document.createElement("span"); n.className = "n"; n.textContent = String(item.n);
  const l = document.createElement("span"); l.className = "l"; l.textContent = label;
  b.append(icon(item.k), n, l);
  b.addEventListener("click", () => choose(item));
  return b;
}

/**
 * Siegprämie: drei offene Angebote nebeneinander, der Spieler wählt genau eines.
 * Keine verdeckte Zufallsziehung, kein Kauf mit echtem Geld. Offene Prämien werden
 * nacheinander abgearbeitet – eine pro Sieg der letzten Sitzung.
 * Gibt die Funktion zum Öffnen zurück.
 */
export function initPraemie(app: App): (from: "lobby" | "summary") => void {
  const offers = $("offers"), hint = $("praemieHint"), result = $("praemieResult"), done = $("praemieDone");
  let origin: "lobby" | "summary" = "lobby";
  let total = 0, taken = 0;

  function showOffers(): void {
    offers.replaceChildren(...praemieAngebote().map(item => offerButton(item, choose)));
    hint.textContent = total > 1
      ? `Prämie ${taken + 1} von ${total}: drei Angebote, du wählst genau eines.`
      : "Drei Angebote, du wählst genau eines.";
    done.hidden = true;
  }

  function choose(item: PraemieItem): void {
    const fresh = waehlePraemie(app.progress, item);
    if (!fresh) return;
    app.save();
    taken++;
    for (const b of offers.children) (b as HTMLButtonElement).disabled = true;
    const label = LABEL[item.k][1];
    const got = document.createElement("div"); got.className = "item";
    got.append(icon(item.k), document.createTextNode(`+${item.n} ${label}`));
    result.append(got);
    for (const r of fresh) {
      const el = document.createElement("div"); el.className = "item";
      el.textContent = `${r.icon} Neu: ${r.name}`;
      result.append(el);
    }
    const left = app.progress.siegpraemien;
    hint.textContent = left
      ? `Gewählt: ${item.n} ${label}. Noch ${left === 1 ? "eine Prämie" : `${left} Prämien`} offen.`
      : `Gewählt: ${item.n} ${label}.`;
    done.textContent = left ? "Nächste Prämie" : "Fertig";
    done.hidden = false;
  }

  done.addEventListener("click", () => {
    if (app.progress.siegpraemien > 0) { showOffers(); return; }
    updatePraemieButtons(app.progress);
    app.show(origin);
  });

  return from => {
    if (app.progress.siegpraemien < 1) return;
    origin = from;
    total = app.progress.siegpraemien; taken = 0;
    result.replaceChildren();
    showOffers();
    app.show("praemie");
  };
}
