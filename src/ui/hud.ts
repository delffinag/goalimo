import { playing, type World } from "../sim/world";
import { $ } from "./dom";

const TUT_TEXT = [
  "Zieh links auf dem Bildschirm, um zu laufen.<small>Am Computer: WASD</small>",
  "Tipp rechts: Du schießt automatisch auf die Zielscheibe.<small>Rechts ziehen und loslassen zielt selbst. Zu weit weg? Geh näher ran.</small>",
  "Versteck dich im Busch. Dort sehen dich Gegner erst aus der Nähe.",
  "Dein Super ist geladen. Drück den gelben Knopf.<small>Am Computer: Leertaste</small>",
  "Stark. Jetzt Fußball: Lauf in den Ball, um ihn zu führen. Schießen kickt ihn. Wer zuerst 3 Tore schießt, gewinnt."
];
const MATCH_HINT = "Lauf in den Ball, um ihn zu führen. Schießen kickt ihn aufs Tor.<small>Ein Pass zu einem Mitspieler lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>";

export interface Hud { update(w: World): void }

/** Anzeigen über der Spielfläche: Spielstand, Uhr, Banner, Hinweise, Super-Knopf */
export function createHud(): Hud {
  const hud = $("hud"), sf = $("sf"), si = $("si"), timer = $("timer"), tut = $("tut"), skip = $("skip"), banner = $("banner"), superBtn = $("superBtn");
  let tutHtml = "";
  const setTut = (html: string) => { if (html !== tutHtml) { tutHtml = html; tut.innerHTML = html; } };

  return {
    update(w) {
      const inMatch = w.phase === "match" || w.phase === "countdown" || w.phase === "ending";
      const tutorial = w.phase === "tutorial";
      hud.hidden = !inMatch;
      skip.hidden = !tutorial;
      superBtn.hidden = !(inMatch || tutorial);
      if (inMatch) {
        sf.textContent = "⚽ " + w.score[0]; si.textContent = "⚽ " + w.score[1];
        const t = Math.ceil(w.timeLeft);
        timer.textContent = `${(t / 60) | 0}:${String(t % 60).padStart(2, "0")}`;
        // Verlängerung: goldene Uhr, das nächste Tor entscheidet
        timer.classList.toggle("golden", w.golden);
      }
      const hint = w.matchHint > 0 && (w.phase === "match" || w.phase === "countdown");
      tut.hidden = !(tutorial || hint);
      if (tutorial) setTut(TUT_TEXT[w.tut.step]); else if (hint) setTut(MATCH_HINT);

      const p = w.player;
      let text = "";
      if (w.phase === "countdown") text = w.goalFlash > 0 ? w.goalMsg : String(Math.ceil(w.countdown));
      else if (w.phase === "ending") text = w.timeLeft <= 0 ? "Zeit abgelaufen" : w.goalMsg;
      else if (p && !p.alive && playing(w)) text = `Zurück in ${Math.ceil(p.respawn)}`;
      if (banner.textContent !== text) banner.textContent = text;

      if (p) {
        superBtn.style.setProperty("--p", `${Math.round(p.superC * 360)}deg`);
        superBtn.classList.toggle("ready", p.superC >= 1);
      }
    }
  };
}
