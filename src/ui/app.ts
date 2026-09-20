import { modeOf } from "../data/modes";
import type { Game } from "../game";
import { loadProgress, playerSetup, saveProgress, type Progress } from "../meta/progress";
import {
  applySession, clearSession, loadSession, saveSession, type Session, type SessionSummary
} from "../meta/session";
import { localStore } from "../meta/storage";
import { $ } from "./dom";
import { initEnd } from "./end";
import { initFigures } from "./figures";
import { initLobby } from "./lobby";
import { initPath } from "./path";
import { initPraemie } from "./praemie";
import { initSummary } from "./summary";
import { initWelcome } from "./welcome";

export type Screen = "welcome" | "lobby" | "figures" | "path" | "praemie" | "end" | "summary" | "match";

/** Was jeder Screen braucht: Spiel, Fortschritt, laufende Sitzung, Speichern und Navigation */
export interface App {
  game: Game;
  progress: Progress;
  /** Matches seit dem letzten Verlassen. Noch nichts davon ist gutgeschrieben. */
  session: Session;
  save(): void;
  show(screen: Screen): void;
  play(): void;
  /** Sitzung beenden: alles auf einmal verbuchen und die Übersicht zeigen */
  leave(): void;
  openPraemie(from: "lobby" | "summary"): void;
}

const OVERLAYS: Record<Exclude<Screen, "match">, string> = {
  welcome: "welcome", lobby: "lobby", figures: "menu", path: "pathView", praemie: "praemieView",
  end: "end", summary: "summary"
};

function goFullscreen(): void {
  try {
    const p = document.documentElement.requestFullscreen?.();
    // Ausrichtung sperren klappt nur im Vollbild und nicht auf iOS: dort greift die gedrehte Ansicht
    p?.then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape").catch(() => {})).catch(() => {});
  } catch { /* Vollbild nicht erlaubt */ }
}

export function initApp(game: Game): App {
  const progress = loadProgress(localStore);
  const session = loadSession(localStore);
  const enter: Partial<Record<Screen, () => void>> = {};

  const app: App = {
    game, progress, session,
    save: () => saveProgress(localStore, progress),
    show(screen) {
      for (const [name, id] of Object.entries(OVERLAYS)) $(id).hidden = name !== screen;
      enter[screen]?.();
    },
    play() {
      goFullscreen();
      app.show("match");
      game.play(playerSetup(progress), modeOf(progress.modus), !progress.tutDone);
    },
    leave() {
      game.toMenu();
      showSummary(bookSession());
    },
    openPraemie: () => {}
  };

  /** Die ganze Sitzung auf einmal verbuchen und den Zwischenspeicher leeren */
  function bookSession(): SessionSummary {
    const sum = applySession(progress, app.session);
    app.session.matches.length = 0;
    clearSession(localStore);
    app.save();
    return sum;
  }

  initWelcome(app);
  enter.lobby = initLobby(app);
  enter.figures = initFigures(app);
  enter.path = initPath(app);
  app.openPraemie = initPraemie(app);
  const showEnd = initEnd(app);
  const summary = initSummary(app);
  const showSummary = summary.show;
  enter.summary = summary.refresh;

  $("skip").addEventListener("click", () => game.skipTutorial());
  game.onEvent(e => {
    if (e.type === "matchStart") { progress.tutDone = true; app.save(); }
    else if (e.type === "playerKo") { try { navigator.vibrate?.(80); } catch { /* kein Vibrationsmotor */ } }
    else if (e.type === "matchEnd") {
      const w = game.world;
      app.session.matches.push({
        result: e.result, figure: w.player ? w.player.type : progress.chosen, score: [w.score[0], w.score[1]]
      });
      saveSession(localStore, app.session);
      showEnd(e.result);
    }
  });

  if (!progress.playerName) app.show("welcome");
  // Eine Sitzung, die der Spieler nie verlassen hat (Tab geschlossen), wird beim nächsten Start abgerechnet
  else if (app.session.matches.length) showSummary(bookSession());
  else app.show("lobby");
  return app;
}
