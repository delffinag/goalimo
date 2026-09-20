import { describe, expect, it } from "vitest";
import { REWARD_PATH } from "../../src/data/balance";
import { loadProgress } from "../../src/meta/progress";
import {
  applySession, clearSession, emptySession, loadSession, resultLine, saveSession, sessionTally, type Session
} from "../../src/meta/session";
import { memoryStore } from "../../src/meta/storage";

const sitzung = (...matches: Session["matches"]): Session => ({ matches });
const sieg = (score: [number, number] = [3, 0], figure = "brecher") => ({ result: "win" as const, figure, score });
const niederlage = (figure = "brecher") => ({ result: "loss" as const, figure, score: [0, 3] as [number, number] });
const remis = (figure = "brecher") => ({ result: "draw" as const, figure, score: [2, 2] as [number, number] });

describe("Sitzung", () => {
  it("zählt mit, ohne etwas zu verbuchen", () => {
    const p = loadProgress(memoryStore());
    const s = sitzung(sieg([3, 0]), niederlage(), sieg([3, 2]));
    const t = sessionTally(s);
    expect(t).toEqual({ matches: 3, wins: 2, draws: 0, losses: 1, praemien: 2, medals: 2 });
    // Der Fortschritt ist unberührt
    expect(p.siegpraemien).toBe(0);
    expect(p.medaillen).toBe(0);
    expect(p.wegStufe).toBe(0);
  });

  it("verbucht beim Verlassen alles auf einmal: eine Prämie pro Sieg", () => {
    const p = loadProgress(memoryStore({ "gl-kristalle": "10" }));
    const sum = applySession(p, sitzung(sieg([3, 0]), sieg([3, 1]), niederlage(), remis()));

    expect(sum.matches).toBe(4);
    expect([sum.wins, sum.draws, sum.losses]).toEqual([2, 1, 1]);
    expect(sum.praemien).toBe(2);
    expect(p.siegpraemien).toBe(2);
    expect(sum.medals).toBe(2);
    expect(p.medaillen).toBe(2);
    // Zwei Medaillen erreichen die ersten beiden Stationen des Belohnungswegs
    expect(sum.path).toEqual(REWARD_PATH.slice(0, 2));
    expect(p.taler).toBe(REWARD_PATH[0].n);
    expect(p.training).toBe(REWARD_PATH[1].n);
    // Erfahrung: 10 + 10 + 2 + 5
    expect(sum.ep).toEqual([{ figure: "brecher", plus: 27, total: 27 }]);
    expect(sum.kristalleLost).toBe(3);
    expect(p.kristalle).toBe(7);
  });

  it("fasst die Erfahrung je Figur zusammen", () => {
    const p = loadProgress(memoryStore());
    const sum = applySession(p, sitzung(sieg([3, 0], "brecher"), sieg([3, 0], "flitzer"), niederlage("brecher")));
    expect(sum.ep).toEqual([
      { figure: "brecher", plus: 12, total: 12 },
      { figure: "flitzer", plus: 10, total: 10 }
    ]);
  });

  it("eine leere Sitzung ändert nichts", () => {
    const p = loadProgress(memoryStore({ "gl-taler": "5" }));
    const sum = applySession(p, emptySession());
    expect(sum.matches).toBe(0);
    expect(sum.praemien).toBe(0);
    expect(sum.medals).toBe(0);
    expect(sum.path).toEqual([]);
    expect(p.taler).toBe(5);
    expect(p.siegpraemien).toBe(0);
  });

  it("überlebt das Speichern und wird beim Leeren verworfen", () => {
    const store = memoryStore();
    const s = sitzung(sieg([3, 1]), niederlage("flitzer"));
    saveSession(store, s);
    expect(loadSession(store)).toEqual(s);
    clearSession(store);
    expect(loadSession(store).matches).toEqual([]);
  });

  it("kaputte oder unbekannte Einträge werden aussortiert", () => {
    const store = memoryStore({
      "gl-sitzung": JSON.stringify([
        { result: "win", figure: "brecher", score: [3, 0] },
        { result: "sieg", figure: "brecher", score: [3, 0] },
        { result: "win", figure: "gibtsnicht", score: [3, 0] },
        { result: "win", figure: "brecher", score: [3] },
        null
      ])
    });
    expect(loadSession(store).matches).toEqual([{ result: "win", figure: "brecher", score: [3, 0] }]);
    expect(loadSession(memoryStore({ "gl-sitzung": "kein json" })).matches).toEqual([]);
  });

  it("schreibt die Ergebniszeile in ganzen Wörtern", () => {
    expect(resultLine({ wins: 1, draws: 0, losses: 0 })).toBe("1 Sieg");
    expect(resultLine({ wins: 2, draws: 1, losses: 3 })).toBe("2 Siege, 1 Unentschieden, 3 Niederlagen");
    expect(resultLine({ wins: 0, draws: 0, losses: 1 })).toBe("1 Niederlage");
  });
});
