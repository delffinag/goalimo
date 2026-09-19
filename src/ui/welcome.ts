import { setPlayerName, validName } from "../meta/progress";
import type { App } from "./app";
import { $ } from "./dom";

/** Beim ersten Start einmalig den Spielernamen abfragen */
export function initWelcome(app: App): void {
  const input = $<HTMLInputElement>("welcomeName"), go = $<HTMLButtonElement>("welcomeGo");
  input.addEventListener("input", () => { go.disabled = !validName(input.value); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !go.disabled) go.click(); });
  // Nach dem Schließen der Bildschirmtastatur die Bühne neu vermessen
  input.addEventListener("blur", () => setTimeout(() => app.game.stage.resize(), 250));
  go.addEventListener("click", () => {
    if (!setPlayerName(app.progress, input.value)) return;
    app.save();
    input.blur();
    app.show("lobby");
  });
}
