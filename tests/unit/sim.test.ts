import { describe, expect, it } from "vitest";
import { MATCH_TIME, PROJ_SPEED, RESPAWN_TIME, STEP, W } from "../../src/data/balance";
import { FIGURES } from "../../src/data/figures";
import { FIELD } from "../../src/data/maps";
import { damage, tryAttack, trySuper } from "../../src/sim/combat";
import { startMatch } from "../../src/sim/match";
import { NO_INPUT, tick, type Brain, type PlayerInput } from "../../src/sim/tick";
import { createWorld, type PlayerSetup, type SimEvent, type World } from "../../src/sim/world";

const idle: Brain = () => {};
const setup: PlayerSetup = { figure: "brecher", name: "Testi", level: 1, cosmetics: { krone: false, gold: false, spur: false } };

function run(w: World, seconds: number, input: PlayerInput = NO_INPUT, brain: Brain = idle): SimEvent[] {
  const events: SimEvent[] = [];
  for (let t = 0; t < seconds; t += STEP) { tick(w, STEP, input, brain); events.push(...w.events.splice(0)); }
  return events;
}

/** Match mit stillstehenden Bots, Anstoß-Countdown schon abgelaufen */
function liveMatch(seed = 1): World {
  const w = createWorld(FIELD, seed);
  startMatch(w, setup);
  run(w, 3.1);
  expect(w.phase).toBe("match");
  w.events.length = 0;
  return w;
}

/** Spieler mit Ball auf eine freie Bahn stellen (y = 250 hat zwischen x = 500 und 1300 keine Mauer) */
function giveBall(w: World, x: number, y: number): void {
  const p = w.player!;
  p.x = x; p.y = y; p.cool = 0;
  w.ball.carrier = p; w.ball.last = p; w.ball.x = x; w.ball.y = y;
  for (const e of w.ents) if (e !== p) { e.x = 900; e.y = 1000; }
}

describe("Ball", () => {
  it("normaler Schuss rollt ca. 300 px", () => {
    const w = liveMatch();
    giveBall(w, 600, 250);
    expect(tryAttack(w, w.player!, 0, 1)).toBe(true);
    const x0 = w.ball.x;
    run(w, 4);
    expect(w.ball.x - x0).toBeGreaterThan(285);
    expect(w.ball.x - x0).toBeLessThan(315);
  });

  it("Super-Schuss rollt ca. 500 px", () => {
    const w = liveMatch();
    giveBall(w, 600, 250);
    w.player!.superC = 1;
    expect(trySuper(w, w.player!, 0, 1)).toBe(true);
    const x0 = w.ball.x;
    run(w, 4);
    expect(w.ball.x - x0).toBeGreaterThan(480);
    expect(w.ball.x - x0).toBeLessThan(525);
  });

  it("Ballträger läuft mit 75 % Tempo", () => {
    const w = liveMatch();
    const p = w.player!;
    giveBall(w, 600, 250);
    run(w, 1, { mx: 1, my: 0, aim: null, commands: [] });
    const withBall = p.x - 600;
    w.ball.carrier = null; w.ball.x = 100; w.ball.y = 1000; p.x = 600;
    run(w, 1, { mx: 1, my: 0, aim: null, commands: [] });
    expect(withBall / (p.x - 600)).toBeCloseTo(0.75, 2);
  });

  it("wer ausgeschaltet wird, verliert den Ball und kommt nach 5 s zurück", () => {
    const w = liveMatch();
    const p = w.player!;
    giveBall(w, 600, 250);
    damage(w, p, 99999, w.ents[3], false);
    expect(p.alive).toBe(false);
    expect(w.ball.carrier).toBeNull();
    const events = run(w, RESPAWN_TIME - 0.2);
    expect(events).toContainEqual({ type: "playerKo" });
    expect(p.alive).toBe(false);
    run(w, 0.4);
    expect(p.alive).toBe(true);
  });
});

describe("Tore und Spielende", () => {
  it("Tor-Meldung nennt den Schützen, Sieg bei 2 Toren", () => {
    const w = liveMatch();
    giveBall(w, W - 200, 550);
    tryAttack(w, w.player!, 0, 1);
    const first = run(w, 1);
    expect(first).toContainEqual({ type: "goal", team: 0, msg: "Testi scored a goal" });
    expect(w.score).toEqual([1, 0]);
    expect(w.phase).toBe("countdown");
    run(w, 3.5);
    expect(w.phase).toBe("match");
    giveBall(w, W - 200, 550);
    tryAttack(w, w.player!, 0, 1);
    const second = run(w, 3);
    expect(second).toContainEqual({ type: "matchEnd", result: "win" });
    expect(w.phase).toBe("end");
  });

  it("Eigentor wird als own goal gemeldet", () => {
    const w = liveMatch();
    giveBall(w, 200, 550);
    tryAttack(w, w.player!, Math.PI, 1);
    const events = run(w, 1);
    expect(events).toContainEqual({ type: "goal", team: 1, msg: "Testi scored an own goal" });
    expect(w.score).toEqual([0, 1]);
  });

  it("bei Zeitablauf entscheidet der Spielstand", () => {
    const w = liveMatch();
    w.ball.x = 900; w.ball.y = 60;
    for (const e of w.ents) { e.x = 900; e.y = 1000; }
    w.score = [0, 1];
    w.timeLeft = 0.5;
    expect(run(w, 2.5)).toContainEqual({ type: "matchEnd", result: "loss" });
    expect(MATCH_TIME).toBe(150);
  });
});

describe("Kampf", () => {
  it("Geschosse fliegen mit 68 % der Basisgeschwindigkeit", () => {
    const w = liveMatch();
    const p = w.player!;
    p.x = 600; p.y = 250;
    w.ents[1].T = FIGURES.schuetze;
    const shooter = w.ents[1];
    shooter.x = 600; shooter.y = 100; shooter.ammo = 3; shooter.cool = 0;
    tryAttack(w, shooter, 0, 1);
    expect(w.projs).toHaveLength(1);
    expect(w.projs[0].spd).toBeCloseTo(FIGURES.schuetze.shot.kind === "bullet" ? FIGURES.schuetze.shot.speed * PROJ_SPEED : NaN, 5);
  });

  it("Super ist ohne Treffer nach ca. 18 s voll", () => {
    const w = liveMatch();
    w.ball.x = 900; w.ball.y = 60;
    for (const e of w.ents) { e.x = 900; e.y = 1000; }
    run(w, 17);
    expect(w.player!.superC).toBeLessThan(1);
    run(w, 1.2);
    expect(w.player!.superC).toBe(1);
  });
});

describe("Reproduzierbarkeit", () => {
  it("gleicher Startwert und gleiche Eingaben ergeben denselben Zustand", () => {
    const snapshot = () => {
      const w = liveMatch(42);
      run(w, 3, { mx: 0.6, my: -0.3, aim: 0.4, commands: [] });
      return w.ents.map(e => [e.type, e.x, e.y, e.hp]);
    };
    expect(snapshot()).toEqual(snapshot());
  });
});
