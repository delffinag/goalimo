import { describe, expect, it } from "vitest";
import { FIGURES, scaledType } from "../../src/data/figures";
import {
  applyMatchResult, canTrainieren, claimPath, epOf, loadProgress, nextStation, playerSetup, praemieAngebote,
  saveProgress, setPlayerName, stufeOf, trainieren, waehlePraemie
} from "../../src/meta/progress";
import { REWARD_PATH } from "../../src/data/balance";
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

describe("Nach dem Match", () => {
  it("nur ein Sieg gibt eine Siegprämie", () => {
    const p = fresh();
    expect(applyMatchResult(p, "brecher", "draw").praemieWon).toBe(false);
    expect(applyMatchResult(p, "brecher", "loss").praemieWon).toBe(false);
    expect(p.siegpraemien).toBe(0);
    expect(applyMatchResult(p, "brecher", "win").praemieWon).toBe(true);
    expect(p.siegpraemien).toBe(1);
  });

  it("Niederlage kostet 3 Kristalle, aber nie unter 0", () => {
    const p = fresh({ "gl-kristalle": "5" });
    expect(applyMatchResult(p, "brecher", "loss").kristalleLost).toBe(3);
    expect(applyMatchResult(p, "brecher", "loss").kristalleLost).toBe(2);
    expect(p.kristalle).toBe(0);
    expect(applyMatchResult(p, "brecher", "loss").kristalleLost).toBe(0);
  });

  it("Erfahrung: Sieg +10, Unentschieden +5, Niederlage +2, sinkt nie", () => {
    const p = fresh();
    expect(applyMatchResult(p, "flitzer", "win").epTotal).toBe(10);
    expect(applyMatchResult(p, "flitzer", "draw").epTotal).toBe(15);
    expect(applyMatchResult(p, "flitzer", "loss").epTotal).toBe(17);
    expect(epOf(p, "schuetze")).toBe(0);
  });
});

describe("Medaille und Belohnungsweg", () => {
  it("jeder Sieg gibt genau eine Medaille, Unentschieden und Niederlage keine", () => {
    const p = fresh();
    expect(applyMatchResult(p, "brecher", "win").medal).toBe(true);
    expect(applyMatchResult(p, "brecher", "win").medal).toBe(true);
    expect(applyMatchResult(p, "brecher", "draw").medal).toBe(false);
    expect(applyMatchResult(p, "brecher", "loss").medal).toBe(false);
    expect(p.medaillen).toBe(2);
  });

  it("Medaillen gehen nie verloren und überstehen das Speichern", () => {
    const store = memoryStore();
    const p = loadProgress(store);
    applyMatchResult(p, "brecher", "win");
    applyMatchResult(p, "brecher", "win");
    for (let i = 0; i < 5; i++) applyMatchResult(p, "brecher", "loss");
    expect(p.medaillen).toBe(2);
    saveProgress(store, p);
    expect(loadProgress(store).medaillen).toBe(2);
  });

  it("alte Spielstände mit Gold, Silber und Bronze werden zusammengezählt", () => {
    const p = loadProgress(memoryStore({ "gl-medaillen": '{"gold":4,"silber":7,"bronze":2}' }));
    expect(p.medaillen).toBe(13);
    expect(p.wegStufe).toBe(0);
  });

  it("der Weg beginnt bei der ersten Station und schreitet mit den Medaillen voran", () => {
    const p = fresh();
    expect(nextStation(p)).toEqual(REWARD_PATH[0]);
    expect(claimPath(p)).toEqual([]);

    applyMatchResult(p, "brecher", "win");
    expect(claimPath(p)).toEqual([REWARD_PATH[0]]);
    expect(p.taler).toBe(REWARD_PATH[0].n);
    expect(p.wegStufe).toBe(1);
    // Eine Station wird nur einmal abgeholt
    expect(claimPath(p)).toEqual([]);
    expect(p.taler).toBe(REWARD_PATH[0].n);
  });

  it("mehrere Stationen auf einmal, wenn der Sprung groß genug ist", () => {
    const p = fresh();
    p.medaillen = REWARD_PATH[3].medals;
    const reached = claimPath(p);
    expect(reached).toEqual(REWARD_PATH.slice(0, 4));
    expect(p.wegStufe).toBe(4);
    expect(p.taler).toBe(REWARD_PATH[0].n + REWARD_PATH[3].n);
    expect(p.training).toBe(REWARD_PATH[1].n);
    expect(p.kristalle).toBe(REWARD_PATH[2].n);
  });

  it("am Ende ist der Weg abgeschlossen und gibt nichts mehr", () => {
    const p = fresh();
    p.medaillen = 9999;
    const reached = claimPath(p);
    expect(reached).toHaveLength(REWARD_PATH.length);
    expect(nextStation(p)).toBeNull();
    expect(claimPath(p)).toEqual([]);
  });

  it("der Stand auf dem Weg übersteht das Speichern", () => {
    const store = memoryStore();
    const p = loadProgress(store);
    p.medaillen = 5;
    claimPath(p);
    saveProgress(store, p);
    const q = loadProgress(store);
    expect(q.wegStufe).toBe(p.wegStufe);
    expect(nextStation(q)).toEqual(nextStation(p));
  });
});

describe("Siegprämie", () => {
  it("drei offene Angebote: 40–60 Taler, 15–25 Trainingspunkte, 2–4 Kristalle", () => {
    const spannen = { taler: [40, 60], training: [15, 25], kristalle: [2, 4] } as const;
    for (let i = 0; i < 300; i++) {
      const angebote = praemieAngebote();
      expect(angebote.map(a => a.k)).toEqual(["taler", "training", "kristalle"]);
      for (const a of angebote) {
        expect(a.n).toBeGreaterThanOrEqual(spannen[a.k][0]);
        expect(a.n).toBeLessThanOrEqual(spannen[a.k][1]);
      }
    }
  });

  it("die Wahl bucht genau ein Angebot und verbraucht eine Prämie", () => {
    const p = fresh();
    applyMatchResult(p, "brecher", "win");
    const [taler, training, kristalle] = praemieAngebote();
    expect(waehlePraemie(p, training)).toEqual([]);
    expect(p.training).toBe(training.n);
    expect(p.taler).toBe(0);
    expect(p.kristalle).toBe(0);
    expect(p.siegpraemien).toBe(0);
    // Ohne offene Prämie wird nichts gebucht
    expect(waehlePraemie(p, taler)).toBeNull();
    expect(waehlePraemie(p, kristalle)).toBeNull();
    expect(p.taler).toBe(0);
  });

  it("Kosmetik schaltet bei 10/25/45 Kristallen frei und bleibt erhalten", () => {
    const p = fresh({ "gl-kristalle": "8", "gl-siegpraemien": "1" });
    expect(waehlePraemie(p, { k: "kristalle", n: 3 })!.map(r => r.id)).toEqual(["krone"]);
    for (let i = 0; i < 5; i++) applyMatchResult(p, "brecher", "loss");
    expect(p.kristalle).toBe(0);
    expect(playerSetup(p).cosmetics).toEqual({ krone: true, gold: false, spur: false });
  });
});

describe("Trainingsstufe", () => {
  it("Kosten 50/20, 100/40, 180/70, 300/100, höchstens Stufe 5", () => {
    const p = fresh({ "gl-taler": "630", "gl-training": "230" });
    for (const stufe of [2, 3, 4, 5]) { expect(trainieren(p, "brecher")).toBe(true); expect(stufeOf(p, "brecher")).toBe(stufe); }
    expect([p.taler, p.training]).toEqual([0, 0]);
    p.taler = 999; p.training = 999;
    expect(canTrainieren(p, "brecher")).toBe(false);
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
    setPlayerName(p, "Testi"); p.taler = 12; p.chosen = "flitzer"; p.tutDone = true; p.stufen.flitzer = 2;
    p.medaillen = 3; p.wegStufe = 2;
    saveProgress(store, p);
    expect(loadProgress(store)).toEqual(p);
  });

  it("alte Spielstände werden einmalig übernommen", () => {
    const store = memoryStore({
      // compliance-ok: alte Speicher-Schlüssel, nur zum Prüfen der Migration
      "fgf-player": "Alt", "fgf-coins": "120", "fgf-pp": "45", "fgf-gems": "12", "fgf-boxes": "2",
      "fgf-levels": '{"brecher":3}', "fgf-figgems": '{"brecher":7}', "fgf-chosen": "flitzer", "fgf-tut": "1"
    });
    const p = loadProgress(store);
    expect(p.playerName).toBe("Alt");
    expect([p.taler, p.training, p.kristalle, p.siegpraemien]).toEqual([120, 45, 12, 2]);
    expect(stufeOf(p, "brecher")).toBe(3);
    expect(epOf(p, "brecher")).toBe(7);
    expect(p.chosen).toBe("flitzer");
    expect(p.tutDone).toBe(true);
    // 12 Kristalle schalten die Krone frei
    expect(playerSetup(p).cosmetics.krone).toBe(true);

    // Danach zählt nur noch der neue Stand: ein alter Wert überschreibt ihn nicht mehr
    p.taler = 5;
    saveProgress(store, p);
    store.set("fgf-coins", "999");
    expect(loadProgress(store).taler).toBe(5);
  });
});
