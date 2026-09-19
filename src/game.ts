import { botThink } from "./ai/bot";
import { STEP } from "./data/balance";
import { FIELD } from "./data/maps";
import { createInput } from "./input/input";
import { createRenderer } from "./render/renderer";
import { startMatch, startTutorial, toMenu } from "./sim/match";
import { tick } from "./sim/tick";
import { createWorld, type PlayerSetup, type SimEvent, type World } from "./sim/world";
import { $ } from "./ui/dom";
import { createHud } from "./ui/hud";
import { createStage, type Stage } from "./ui/stage";

export interface Game {
  world: World;
  stage: Stage;
  /** Startet ein Match, beim allerersten Mal davor die Übungsrunde */
  play(setup: PlayerSetup, withTutorial: boolean): void;
  skipTutorial(): void;
  toMenu(): void;
  onEvent(handler: (e: SimEvent) => void): void;
}

/** Verbindet Eingabe → Simulation → Darstellung. Die Simulation läuft im festen Takt, gezeichnet wird pro Bildschirm-Frame. */
export function createGame(): Game {
  const canvas = $<HTMLCanvasElement>("c");
  const stage = createStage($("stage"), canvas);
  const renderer = createRenderer(canvas, stage);
  const input = createInput(canvas, $("superBtn"), stage, renderer.screenToWorld);
  const hud = createHud();
  const world = createWorld(FIELD);
  const handlers: ((e: SimEvent) => void)[] = [];

  let last = performance.now(), acc = 0;
  function frame(now: number): void {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) {
      tick(world, STEP, input.poll(), botThink);
      acc -= STEP;
      for (const e of world.events.splice(0)) for (const h of handlers) h(e);
    }
    renderer.render(world, input);
    hud.update(world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    world, stage,
    play(setup, withTutorial) {
      input.reset();
      if (withTutorial) startTutorial(world, setup); else startMatch(world, setup);
    },
    skipTutorial() { if (world.phase === "tutorial" && world.setup) { input.reset(); startMatch(world, world.setup); } },
    toMenu() { input.reset(); toMenu(world); },
    onEvent(handler) { handlers.push(handler); }
  };
}
