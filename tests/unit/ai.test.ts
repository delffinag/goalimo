import { describe, expect, it } from "vitest";
import { botThink } from "../../src/ai/bot";
import { findPath } from "../../src/ai/pathfinding";
import { STEP } from "../../src/data/balance";
import { FIELD } from "../../src/data/maps";
import { inRect } from "../../src/sim/geometry";
import { startMatch } from "../../src/sim/match";
import { NO_INPUT, tick } from "../../src/sim/tick";
import { createWorld, type PlayerSetup, type SimEvent } from "../../src/sim/world";

const setup: PlayerSetup = { figure: "flitzer", name: "Testi", stufe: 1, cosmetics: { krone: false, gold: false, spur: false } };

describe("Bots", () => {
  it("spielen ein ganzes Match zu Ende, ohne dass Werte kaputtgehen", () => {
    for (const seed of [1, 2, 3]) {
      const w = createWorld(FIELD, seed);
      startMatch(w, setup);
      const events: SimEvent[] = [];
      // Spielzeit 3:00, dazu ein mögliches Golden Goal von 60 s und die Pausen nach Toren
      for (let i = 0; i < 300 / STEP && w.phase !== "end"; i++) { tick(w, STEP, NO_INPUT, botThink); events.push(...w.events.splice(0)); }
      expect(w.phase).toBe("end");
      expect(events.some(e => e.type === "matchEnd")).toBe(true);
      for (const e of w.ents) expect(Number.isFinite(e.x + e.y + e.hp)).toBe(true);
      expect(Number.isFinite(w.ball.x + w.ball.y)).toBe(true);
    }
  });

  it("passen, wenn sie bedrängt werden und ein Mitspieler freier und näher am Tor steht", () => {
    const w = createWorld(FIELD, 7);
    startMatch(w, setup);
    for (let i = 0; i < 3.1 / STEP; i++) tick(w, STEP, NO_INPUT, () => {});
    const [player, carrier, mate, foe, ...rest] = w.ents;
    player.x = 100; player.y = 1000;
    carrier.x = 700; carrier.y = 250; carrier.cool = 0; carrier.ai.passWait = 0;
    mate.x = 950; mate.y = 200;
    foe.x = 600; foe.y = 250;
    for (const e of rest) { e.x = 1700; e.y = 1000; }
    w.ball.carrier = carrier; w.ball.last = carrier;
    botThink(w, carrier, STEP);
    expect(w.ball.carrier).toBeNull();
    const dir = Math.atan2(w.ball.vy, w.ball.vx), want = Math.atan2(mate.y - carrier.y, mate.x - carrier.x);
    expect(Math.abs(dir - want)).toBeLessThan(0.15);
  });

  it("finden einen Weg um Mauern herum", () => {
    const w = createWorld(FIELD, 1);
    const path = findPath(w.map, 500, 550, 900, 550);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
    for (const p of path!) for (const wall of w.map.walls) expect(inRect(p.x, p.y, wall)).toBe(false);
  });
});
