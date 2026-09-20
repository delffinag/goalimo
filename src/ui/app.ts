import type { Game } from "../game";
import { loadProgress, playerSetup, saveProgress, type Progress } from "../meta/progress";
import { localStore } from "../meta/storage";
import { $ } from "./dom";
import { initEnd } from "./end";
import { initFigures } from "./figures";
import { initLobby } from "./lobby";
import { initPraemie } from "./praemie";
import { initWelcome } from "./welcome";

export type Screen = "welcome" | "lobby" | "figures" | "praemie" | "end" | "match";

/** Was jeder Screen braucht: Spiel, Fortschritt, Speichern und Navigation */
export interface App {
  game: Game;
  progress: Progress;
  save(): void;
  show(screen: Screen): void;
  play(): void;
  openPraemie(from: "lobby" | "end"): void;
}

const OVERLAYS: Record<Exclude<Screen, "match">, string> = { welcome: "welcome", lobby: "lobby", figures: "menu", praemie: "praemieView", end: "end" };

function goFullscreen(): void {
  try {
    const p = document.documentElement.requestFullscreen?.();
    // Ausrichtung sperren klappt nur im Vollbild und nicht auf iOS: dort greift die gedrehte Ansicht
    p?.then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape").catch(() => {})).catch(() => {});
  } catch { /* Vollbild nicht erlaubt */ }
}

export function initApp(game: Game): App {
  const progress = loadProgress(localStore);
  const enter: Partial<Record<Screen, () => void>> = {};

  const app: App = {
    game, progress,
    save: () => saveProgress(localStore, progress),
    show(screen) {
      for (const [name, id] of Object.entries(OVERLAYS)) $(id).hidden = name !== screen;
      enter[screen]?.();
    },
    play() {
      goFullscreen();
      app.show("match");
      game.play(playerSetup(progress), !progress.tutDone);
    },
    openPraemie: () => {}
  };

  initWelcome(app);
  enter.lobby = initLobby(app);
  enter.figures = initFigures(app);
  app.openPraemie = initPraemie(app);
  const showEnd = initEnd(app);

  $("skip").addEventListener("click", () => game.skipTutorial());
  game.onEvent(e => {
    if (e.type === "matchStart") { progress.tutDone = true; app.save(); }
    else if (e.type === "playerKo") { try { navigator.vibrate?.(80); } catch { /* kein Vibrationsmotor */ } }
    else if (e.type === "matchEnd") showEnd(e.result);
  });

  app.show(progress.playerName ? "lobby" : "welcome");
  return app;
}
