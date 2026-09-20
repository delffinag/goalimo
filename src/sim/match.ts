import { COUNTDOWN_AFTER_GOAL, COUNTDOWN_START, H } from "../data/balance";
import { FIGURE_KEYS, FIGURES, scaledType } from "../data/figures";
import { collide } from "./geometry";
import { clamp, shuffled } from "./math";
import type { GameMode } from "../data/modes";
import { makeKicker, resetBall, respawnKicker, type MatchResult, type PlayerSetup, type World } from "./world";

function resetWorld(w: World): void {
  w.projs = []; w.lobs = []; w.fx = []; w.floaters = []; resetBall(w);
}

/** Übungsrunde vor dem ersten Match: laufen, schießen, Busch, Super */
export function startTutorial(w: World, setup: PlayerSetup, mode: GameMode = w.mode): void {
  resetWorld(w);
  w.setup = setup; w.mode = mode; w.phase = "tutorial";
  w.player = makeKicker(w, scaledType(setup.figure, setup.stufe), 0, 1, setup);
  w.ents = [w.player];
  w.tut = { step: 0, moved: 0, hits: 0, superUsed: false, doneT: 0 };
}

/** 3 gegen 3: Der Spieler bekommt die zwei anderen Figuren als Mitspieler, die Gegner sind zufällig aufgestellt. */
export function startMatch(w: World, setup: PlayerSetup, mode: GameMode = w.mode): void {
  resetWorld(w);
  w.setup = setup; w.mode = mode; w.matchHint = 5;
  const player = makeKicker(w, scaledType(setup.figure, setup.stufe), 0, 0, setup);
  const allies = shuffled(w.rng, FIGURE_KEYS.filter(t => t !== setup.figure));
  const foes = shuffled(w.rng, FIGURE_KEYS);
  w.player = player;
  w.ents = [player, makeKicker(w, FIGURES[allies[0]], 0, 1, null), makeKicker(w, FIGURES[allies[1]], 0, 2, null),
    makeKicker(w, FIGURES[foes[0]], 1, 0, null), makeKicker(w, FIGURES[foes[1]], 1, 1, null), makeKicker(w, FIGURES[foes[2]], 1, 2, null)];
  w.score = [0, 0]; w.timeLeft = w.matchTime; w.golden = false; w.countdown = COUNTDOWN_START; w.phase = "countdown";
  w.events.push({ type: "matchStart" });
}

/** Verlängerung bei Gleichstand: neuer Anstoß, das erste Tor entscheidet. Fällt keines, bleibt es unentschieden. */
export function startGoldenGoal(w: World): void {
  w.golden = true; w.timeLeft = w.goldenTime;
  w.projs = []; w.lobs = [];
  resetBall(w);
  for (const b of w.ents) { respawnKicker(w, b); b.cool = 0; b.pickCool = 0; }
  w.goalMsg = w.mode.goldenLabel; w.goalFlash = 2.6;
  w.phase = "countdown"; w.countdown = COUNTDOWN_AFTER_GOAL;
  w.events.push({ type: "goldenGoal" });
}

export function toMenu(w: World): void {
  resetWorld(w);
  w.phase = "menu"; w.ents = []; w.player = null;
}

function spawnDummy(w: World): void {
  const p = w.player!;
  const T = { ...FIGURES.brecher, hp: 4000 };
  const dummy = makeKicker(w, T, 1, 1, null);
  Object.assign(dummy, { dummy: true, x: p.x + 240, y: clamp(p.y + 40, 120, H - 120) });
  collide(w.map, dummy);
  w.ents.push(dummy);
}

export function tutorialUpdate(w: World, dt: number): void {
  const tut = w.tut, p = w.player!;
  const s = tut.step;
  if (s === 0 && tut.moved > 250) { tut.step = 1; spawnDummy(w); }
  else if (s === 1 && tut.hits >= 2) tut.step = 2;
  else if (s === 2 && p.bush >= 0) { tut.step = 3; p.superC = 1; tut.superUsed = false; }
  else if (s === 3 && tut.superUsed) { tut.step = 4; tut.doneT = 2.2; }
  else if (s === 4) { tut.doneT -= dt; if (tut.doneT <= 0) startMatch(w, w.setup!); }
  if (s === 3 && p.superC < 1 && !tut.superUsed) p.superC = 1;
}

/** Bei Zeitablauf entscheidet der Spielstand. Nach dem Golden Goal ohne Tor bleibt es unentschieden. */
export function matchResult(w: World): MatchResult {
  return w.score[0] > w.score[1] ? "win" : w.score[0] < w.score[1] ? "loss" : "draw";
}
