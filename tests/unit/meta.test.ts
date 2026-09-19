import { describe, expect, it } from "vitest";
import { FIGURES, scaledType } from "../../src/data/figures";
import {
  applyMatchResult, canUpgrade, collectItem, levelOf, loadProgress, playerSetup, rollBox, saveProgress, setPlayerName, upgrade, useBox
} from "../../src/meta/progress";
import { memoryStore } from "../../src/meta/storage";

const fresh = (data: Record<string, string> = {}) => loadProgress(memoryStore(data));

describe("Spielername", () => {
  it("2–12 Zeichen, danach nicht mehr änderbar", () => {
    const p = fresh();
    expect(setPlayerName(p, " A ")).toBe(false);
    expect(setPlayerName(p, "  Frederik der Große  ")).toBe(true);
    expect(p.playerName).toBe("Frederik der");
    expect(setPlayerName(p, "Anders")).toBe(false);
    expect(p.playerName).toBe("Frederik der");
  });
});

describe("Belohnung nach dem Match", () => {
  it("nur ein Sieg gibt eine Box", () => {
    const p = fresh();
    expect(applyMatchResult(p, "brecher", "draw").boxWon).toBe(false);
    expect(applyMatchResult(p, "brecher", "loss").boxWon).toBe(false);
    expect(p.boxes).toBe(0);
    expect(applyMatchResult(p, "brecher", "win").boxWon).toBe(true);
    expect(p.boxes).toBe(1);
  });

  it("Niederlage kostet 3 Juwelen, aber nie unter 0", () => {
    const p = fresh({ "fgf-gems": "5" });
    expect(applyMatchResult(p, "brecher", "loss").gemsLost).toBe(3);
    expect(applyMatchResult(p, "brecher", "loss").gemsLost).toBe(2);
    expect(p.gems).toBe(0);
    expect(applyMatchResult(p, "brecher", "loss").gemsLost).toBe(0);
  });

  it("Figuren-Juwelen: Sieg +8, Unentschieden +2, Niederlage −4", () => {
    const p = fresh();
    expect(applyMatchResult(p, "flitzer", "win").figTotal).toBe(8);
    expect(applyMatchResult(p, "flitzer", "draw").figTotal).toBe(10);
    expect(applyMatchResult(p, "flitzer", "loss").figTotal).toBe(6);
    expect(applyMatchResult(p, "schuetze", "loss").figTotal).toBe(0);
  });
});

describe("Box", () => {
  it("enthält 3 Objekte in den erlaubten Bereichen", () => {
    const ranges = { coins: [10, 30], pp: [5, 15], gems: [1, 4] };
    for (let i = 0; i < 300; i++) {
      const items = rollBox();
      expect(items).toHaveLength(3);
      for (const it of items) { expect(it.n).toBeGreaterThanOrEqual(ranges[it.k][0]); expect(it.n).toBeLessThanOrEqual(ranges[it.k][1]); }
    }
  });

  it("Kosmetik schaltet bei 10/25/45 Juwelen frei und bleibt erhalten", () => {
    const p = fresh({ "fgf-gems": "8", "fgf-boxes": "1" });
    expect(useBox(p)).toBe(true);
    expect(useBox(p)).toBe(false);
    expect(collectItem(p, { k: "gems", n: 3 }).map(r => r.id)).toEqual(["krone"]);
    for (let i = 0; i < 5; i++) applyMatchResult(p, "brecher", "loss");
    expect(p.gems).toBe(0);
    expect(playerSetup(p).cosmetics).toEqual({ krone: true, gold: false, spur: false });
  });
});

describe("Power-Level", () => {
  it("Kosten 50/20, 100/40, 180/70, 300/100, höchstens Stufe 5", () => {
    const p = fresh({ "fgf-coins": "630", "fgf-pp": "230" });
    for (const lv of [2, 3, 4, 5]) { expect(upgrade(p, "brecher")).toBe(true); expect(levelOf(p, "brecher")).toBe(lv); }
    expect([p.coins, p.pp]).toEqual([0, 0]);
    p.coins = 999; p.pp = 999;
    expect(canUpgrade(p, "brecher")).toBe(false);
  });

  it("jede Stufe gibt +8 % Leben und Schaden", () => {
    const T = scaledType("brecher", 3), base = FIGURES.brecher;
    expect(T.hp).toBe(Math.round(base.hp * 1.16));
    expect("dmg" in T.shot && "dmg" in base.shot && T.shot.dmg).toBe(Math.round((base.shot as { dmg: number }).dmg * 1.16));
  });
});

describe("Speicherung", () => {
  it("Fortschritt übersteht Speichern und Laden", () => {
    const store = memoryStore();
    const p = loadProgress(store);
    setPlayerName(p, "Testi"); p.coins = 12; p.chosen = "flitzer"; p.tutDone = true; p.levels.flitzer = 2;
    saveProgress(store, p);
    const q = loadProgress(store);
    expect(q).toEqual(p);
  });
});
