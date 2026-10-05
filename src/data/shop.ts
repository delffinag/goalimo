import type { PraemieKind } from "./balance";

// Shop: alles ist offen sichtbar und hat einen festen Preis in Spielwährung.
// Keine Zufallsziehung, kein Kauf mit echtem Geld, und Medaillen gibt es hier nie: sie werden nur erspielt.

/** Womit bezahlt wird und was es zu tauschen gibt. Medaillen gehören bewusst nicht dazu. */
export type Waehrung = PraemieKind;
export interface Preis { w: Waehrung; n: number }

/** Kosmetik, die es nur im Shop gibt. Die Kosmetik über Kristall-Schwellen (Krone, Goldrand, Funkenspur) bleibt erspielt. */
export type ShopKosmetikId = "brille" | "schein" | "feuerwerk";

export type Ware =
  | { art: "figur"; figur: string }
  | { art: "kosmetik"; id: ShopKosmetikId }
  | { art: "waehrung"; w: Waehrung; n: number };

export interface ShopAngebot {
  id: string;
  name: string;
  /** Kurzer Text unter dem Namen */
  desc: string;
  ware: Ware;
  preis: Preis;
}

/** Figuren, die man im Shop freischaltet. Die drei Startfiguren hat jeder von Anfang an. */
export const SHOP_FIGUREN: ShopAngebot[] = [
  { id: "figur-werfer", name: "Kabumm", desc: "Wirft Bomben über Mauern", ware: { art: "figur", figur: "werfer" }, preis: { w: "taler", n: 300 } },
  { id: "figur-heilerin", name: "Lumi", desc: "Heilt sich und ihr Team", ware: { art: "figur", figur: "heilerin" }, preis: { w: "taler", n: 400 } },
  { id: "figur-mauli", name: "Mauli", desc: "Schild gegen Schaden", ware: { art: "figur", figur: "mauli" }, preis: { w: "taler", n: 500 } }
];

export const SHOP_KOSMETIK: (ShopAngebot & { icon: string })[] = [
  { id: "kosmetik-brille", icon: "🕶️", name: "Sonnenbrille", desc: "Deine Figur trägt eine coole Brille.", ware: { art: "kosmetik", id: "brille" }, preis: { w: "kristalle", n: 15 } },
  { id: "kosmetik-schein", icon: "💫", name: "Leuchtring", desc: "Ein heller Schein umgibt deine Figur.", ware: { art: "kosmetik", id: "schein" }, preis: { w: "kristalle", n: 25 } },
  { id: "kosmetik-feuerwerk", icon: "🎆", name: "Torfeuerwerk", desc: "Triffst du, gibt es ein Feuerwerk.", ware: { art: "kosmetik", id: "feuerwerk" }, preis: { w: "kristalle", n: 35 } }
];

/** Tausch zu festen Kursen, beliebig oft */
export const SHOP_TAUSCH: ShopAngebot[] = [
  { id: "tausch-taler", name: "120 Taler", desc: "für 5 Kristalle", ware: { art: "waehrung", w: "taler", n: 120 }, preis: { w: "kristalle", n: 5 } },
  { id: "tausch-training", name: "40 Trainingspunkte", desc: "für 5 Kristalle", ware: { art: "waehrung", w: "training", n: 40 }, preis: { w: "kristalle", n: 5 } },
  { id: "tausch-taler-training", name: "25 Trainingspunkte", desc: "für 100 Taler", ware: { art: "waehrung", w: "training", n: 25 }, preis: { w: "taler", n: 100 } }
];

/**
 * Tagesangebote: jeden Tag drei Angebote aus diesem Vorrat, günstiger als der Tausch und je einmal pro Tag kaufbar.
 * Welche drei es sind, steht für einen Tag fest und ist für alle gleich.
 */
export const TAGES_VORRAT: ShopAngebot[] = [
  { id: "tag-training", name: "40 Trainingspunkte", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "training", n: 40 }, preis: { w: "taler", n: 100 } },
  { id: "tag-training-gross", name: "80 Trainingspunkte", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "training", n: 80 }, preis: { w: "taler", n: 180 } },
  { id: "tag-taler", name: "200 Taler", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "taler", n: 200 }, preis: { w: "kristalle", n: 6 } },
  { id: "tag-taler-training", name: "120 Taler", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "taler", n: 120 }, preis: { w: "training", n: 35 } },
  { id: "tag-kristalle", name: "4 Kristalle", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "kristalle", n: 4 }, preis: { w: "taler", n: 180 } },
  { id: "tag-kristalle-training", name: "6 Kristalle", desc: "Nur heute, einmal", ware: { art: "waehrung", w: "kristalle", n: 6 }, preis: { w: "training", n: 60 } }
];
export const TAGES_ANZAHL = 3;
