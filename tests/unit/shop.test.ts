import { describe, expect, it } from "vitest";
import { FIGURE_KEYS, STARTER_FIGURES } from "../../src/data/figures";
import { SHOP_FIGUREN, SHOP_KOSMETIK, SHOP_TAUSCH, TAGES_VORRAT, type ShopAngebot } from "../../src/data/shop";
import { loadProgress, playerSetup, saveProgress } from "../../src/meta/progress";
import { kaufen, kaufStatus, shopBereiche, tagesAngebote, tagOf } from "../../src/meta/shop";
import { memoryStore } from "../../src/meta/storage";

const fresh = (data: Record<string, string> = {}) => loadProgress(memoryStore(data));
const TAG = "2026-10-05";
const alle = (): ShopAngebot[] => shopBereiche(TAG).flatMap(b => b.angebote);

describe("Shop", () => {
  it("verkauft keine Medaillen, nur Figuren, Kosmetik und Spielwährung", () => {
    for (const a of [...SHOP_FIGUREN, ...SHOP_KOSMETIK, ...SHOP_TAUSCH, ...TAGES_VORRAT]) {
      expect(["figur", "kosmetik", "waehrung"]).toContain(a.ware.art);
      if (a.ware.art === "waehrung") expect(["taler", "training", "kristalle"]).toContain(a.ware.w);
      expect(["taler", "training", "kristalle"]).toContain(a.preis.w);
      expect(a.preis.n).toBeGreaterThan(0);
    }
    const p = fresh({ "gl-taler": "9999", "gl-training": "9999", "gl-kristalle": "9999" });
    for (const a of alle()) kaufen(p, a, TAG);
    expect(p.medaillen).toBe(0);
  });

  it("ein Kauf zieht genau den Preis ab und schreibt die Ware gut", () => {
    const p = fresh({ "gl-kristalle": "12" });
    const tausch = SHOP_TAUSCH.find(a => a.id === "tausch-taler")!;
    expect(kaufen(p, tausch, TAG)).not.toBeNull();
    expect(p.kristalle).toBe(7);
    expect(p.taler).toBe(120);
    // Tausch geht beliebig oft, solange das Geld reicht
    expect(kaufen(p, tausch, TAG)).not.toBeNull();
    expect(kaufen(p, tausch, TAG)).toBeNull();
    expect(kaufStatus(p, tausch, TAG)).toBe("zuTeuer");
    expect(p.kristalle).toBe(2);
    expect(p.taler).toBe(240);
  });

  it("Figuren: drei zum Start, weitere einmal kaufen, danach gehören sie dir", () => {
    const p = fresh({ "gl-taler": "1000" });
    expect([...p.figuren].sort()).toEqual([...STARTER_FIGURES].sort());
    expect(FIGURE_KEYS.length).toBe(STARTER_FIGURES.length + SHOP_FIGUREN.length);
    const kabumm = SHOP_FIGUREN[0];
    expect(kaufen(p, kabumm, TAG)).not.toBeNull();
    expect(p.figuren.has("werfer")).toBe(true);
    expect(p.taler).toBe(700);
    expect(kaufStatus(p, kabumm, TAG)).toBe("besessen");
    expect(kaufen(p, kabumm, TAG)).toBeNull();
    expect(p.taler).toBe(700);
  });

  it("gekaufte Figuren und Kosmetik bleiben nach dem Speichern erhalten", () => {
    const store = memoryStore({ "gl-taler": "500", "gl-kristalle": "20" });
    const p = loadProgress(store);
    kaufen(p, SHOP_FIGUREN[0], TAG);
    kaufen(p, SHOP_KOSMETIK[0], TAG);
    p.chosen = "werfer";
    saveProgress(store, p);
    const q = loadProgress(store);
    expect(q.figuren.has("werfer")).toBe(true);
    expect(q.chosen).toBe("werfer");
    expect(playerSetup(q).cosmetics.brille).toBe(true);
    expect(playerSetup(q).cosmetics.schein).toBe(false);
  });

  it("eine nicht gekaufte Figur kann nicht gewählt sein", () => {
    expect(fresh({ "gl-figur": "mauli" }).chosen).toBe("brecher");
  });

  it("Shop-Kosmetik kostet Kristalle; Krone und Co. über die Schwellen bleiben freigeschaltet", () => {
    const p = fresh({ "gl-kristalle": "30" });
    expect(p.unlocked.has("krone")).toBe(true);
    expect(p.unlocked.has("gold")).toBe(true);
    expect(kaufen(p, SHOP_KOSMETIK.find(k => k.ware.art === "kosmetik" && k.ware.id === "schein")!, TAG)).not.toBeNull();
    expect(p.kristalle).toBe(5);
    expect(p.unlocked.has("schein")).toBe(true);
    expect(p.unlocked.has("gold")).toBe(true);
  });

  it("wer über eine Kristall-Schwelle kauft, bekommt die Kosmetik dazu", () => {
    const p = fresh({ "gl-kristalle": "8", "gl-taler": "200" });
    const kristalle = TAGES_VORRAT.find(a => a.id === "tag-kristalle")!;
    expect(kaufen(p, kristalle, TAG)?.map(r => r.id)).toEqual(["krone"]);
  });
});

describe("Tagesangebote", () => {
  it("drei verschiedene Angebote, für einen Tag immer dieselben", () => {
    const heute = tagesAngebote(TAG);
    expect(heute).toHaveLength(3);
    expect(new Set(heute.map(a => a.id)).size).toBe(3);
    expect(tagesAngebote(TAG)).toEqual(heute);
  });

  it("wechseln von Tag zu Tag", () => {
    const tage = Array.from({ length: 14 }, (_, i) => tagesAngebote(tagOf(new Date(2026, 9, 1 + i))).map(a => a.id).join());
    expect(new Set(tage).size).toBeGreaterThan(3);
  });

  it("jedes Angebot einmal pro Tag, am nächsten Tag wieder", () => {
    const p = fresh({ "gl-taler": "2000", "gl-training": "500", "gl-kristalle": "50" });
    const a = tagesAngebote(TAG)[0];
    expect(kaufen(p, a, TAG)).not.toBeNull();
    expect(kaufStatus(p, a, TAG)).toBe("heuteGekauft");
    expect(kaufen(p, a, TAG)).toBeNull();
    expect(kaufStatus(p, a, "2026-10-06")).toBe("kaufbar");
  });

  it("Kalendertag in Ortszeit", () => {
    expect(tagOf(new Date(2026, 0, 9, 23, 59))).toBe("2026-01-09");
  });
});
