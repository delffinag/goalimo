import { MEDAL_NAME, REWARD_PATH, type PraemieKind } from "../data/balance";
import { nextStation } from "../meta/progress";
import type { App } from "./app";
import { $ } from "./dom";
import { dragScroll } from "./scroll";

const LABEL: Record<PraemieKind, [cls: string, label: string]> = {
  taler: ["taler", "Taler"], training: ["training", "Trainingspunkte"], kristalle: ["kristall", "Kristalle"]
};

function icon(kind: PraemieKind): HTMLElement {
  const el = document.createElement("span");
  el.className = LABEL[kind][0];
  el.setAttribute("aria-hidden", "true");
  if (kind === "training") el.textContent = "T";
  return el;
}

/**
 * Belohnungsweg: feste Stationen, die mit Medaillen erreicht werden. Alle Belohnungen stehen offen da,
 * es gibt nichts zu kaufen und nichts zu ziehen. Erreichte Stationen sind abgehakt.
 * Gibt die Funktion zum Betreten zurück.
 */
export function initPath(app: App): () => void {
  const list = $("pathList");
  $("pathBack").addEventListener("click", () => app.show("lobby"));
  dragScroll(list, app.game.stage);

  return function enter() {
    const p = app.progress, next = nextStation(p);
    const medals = `${p.medaillen} ${p.medaillen === 1 ? MEDAL_NAME : MEDAL_NAME + "n"}`;
    $("pathHint").textContent = next
      ? `${medals}. Noch ${next.medals - p.medaillen} bis zur nächsten Station.`
      : `${medals}. Der Weg ist abgeschlossen.`;

    list.replaceChildren(...REWARD_PATH.map((st, i) => {
      const done = i < p.wegStufe;
      const row = document.createElement("div");
      row.className = "station"; row.dataset.state = done ? "done" : st === next ? "next" : "open";

      const mark = document.createElement("span");
      mark.className = "smark";
      mark.textContent = done ? "✓" : String(st.medals);
      mark.setAttribute("aria-hidden", "true");

      const reward = document.createElement("span");
      reward.className = "sreward";
      const amount = document.createElement("b"); amount.textContent = `${st.n}`;
      const label = document.createElement("span"); label.textContent = LABEL[st.k][1];
      reward.append(icon(st.k), amount, label);

      const state = document.createElement("small");
      state.textContent = done ? "abgeholt" : st === next ? "als Nächstes" : `ab ${st.medals}`;

      row.append(mark, reward, state);
      row.setAttribute("aria-label",
        `Station bei ${st.medals} Medaillen: ${st.n} ${LABEL[st.k][1]} – ${state.textContent}`);
      return row;
    }));
    // Beim Öffnen bei der nächsten Station stehen, nicht ganz oben
    requestAnimationFrame(() => {
      const el = list.querySelector<HTMLElement>('[data-state="next"]');
      if (el) list.scrollTop = Math.max(0, el.offsetTop - list.offsetTop - 60);
    });
  };
}
