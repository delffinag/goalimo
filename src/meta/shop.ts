import type { CosmeticReward } from "../data/balance";
import {
  SHOP_FIGUREN, SHOP_KOSMETIK, SHOP_TAUSCH, TAGES_ANZAHL, TAGES_VORRAT, type ShopAngebot
} from "../data/shop";
import { mulberry32, shuffled } from "../sim/math";
import { unlockRewards, type Progress } from "./progress";

/** Kalendertag in Ortszeit, z. B. „2026-10-05“. Um Mitternacht wechseln die Tagesangebote. */
export function tagOf(date: Date): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

/** Die drei Tagesangebote eines Tages. Sie stehen für den ganzen Tag fest. */
export function tagesAngebote(tag: string): ShopAngebot[] {
  let seed = 0;
  for (const ch of tag) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return shuffled(mulberry32(seed), TAGES_VORRAT).slice(0, TAGES_ANZAHL);
}

const istTagesangebot = (a: ShopAngebot) => TAGES_VORRAT.includes(a);

/** Gekaufte Tagesangebote gelten nur für den Tag, an dem sie gekauft wurden */
function heuteGekauft(p: Progress, tag: string): string[] {
  return p.tageskauf.tag === tag ? p.tageskauf.ids : [];
}

export type KaufStatus = "kaufbar" | "zuTeuer" | "besessen" | "heuteGekauft";

export function kaufStatus(p: Progress, a: ShopAngebot, tag: string): KaufStatus {
  const w = a.ware;
  if (w.art === "figur" && p.figuren.has(w.figur)) return "besessen";
  if (w.art === "kosmetik" && p.unlocked.has(w.id)) return "besessen";
  if (istTagesangebot(a) && heuteGekauft(p, tag).includes(a.id)) return "heuteGekauft";
  return p[a.preis.w] >= a.preis.n ? "kaufbar" : "zuTeuer";
}

/**
 * Kauft ein Angebot: zieht den Preis ab und schreibt die Ware gut.
 * Gibt die Kosmetik zurück, die dadurch über eine Kristall-Schwelle neu freigeschaltet wurde, oder `null`, wenn der Kauf nicht geht.
 */
export function kaufen(p: Progress, a: ShopAngebot, tag: string): CosmeticReward[] | null {
  if (kaufStatus(p, a, tag) !== "kaufbar") return null;
  p[a.preis.w] -= a.preis.n;
  const w = a.ware;
  if (w.art === "figur") p.figuren.add(w.figur);
  else if (w.art === "kosmetik") p.unlocked.add(w.id);
  else p[w.w] += w.n;
  if (istTagesangebot(a)) p.tageskauf = { tag, ids: [...heuteGekauft(p, tag), a.id] };
  return unlockRewards(p);
}

/** Alle Bereiche des Shops für einen Tag, in der Reihenfolge der Anzeige */
export function shopBereiche(tag: string): { key: string; titel: string; angebote: ShopAngebot[] }[] {
  return [
    { key: "tag", titel: "Tagesangebote", angebote: tagesAngebote(tag) },
    { key: "figuren", titel: "Figuren", angebote: SHOP_FIGUREN },
    { key: "kosmetik", titel: "Kosmetik", angebote: SHOP_KOSMETIK },
    { key: "tausch", titel: "Tausch", angebote: SHOP_TAUSCH }
  ];
}
