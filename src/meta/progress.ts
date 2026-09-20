import {
  ERFAHRUNG, LOSS_KRISTALLE, MAX_STUFE, NAME_MAX, NAME_MIN, PRAEMIE_ANGEBOTE, REWARDS, TRAINING_COST,
  type CosmeticReward, type PraemieKind
} from "../data/balance";
import { clampStufe, DEFAULT_FIGURE, FIGURES } from "../data/figures";
import type { MatchResult, PlayerSetup } from "../sim/world";
import type { Store } from "./storage";

const K = {
  player: "gl-name", kristalle: "gl-kristalle", taler: "gl-taler", training: "gl-training",
  siegpraemien: "gl-siegpraemien", stufen: "gl-trainingsstufen", erfahrung: "gl-erfahrung",
  unlocked: "gl-belohnungen", chosen: "gl-figur", tut: "gl-uebung", migriert: "gl-migriert"
};

/** Schlüssel des Vorgängers (Münzen, Powerpunkte, Juwelen, Boxen). Werden einmalig übernommen. */
const OLD: [alt: string, neu: string][] = [
  ["fgf-player", K.player], ["fgf-coins", K.taler], ["fgf-pp", K.training], ["fgf-gems", K.kristalle],
  ["fgf-boxes", K.siegpraemien], ["fgf-levels", K.stufen], ["fgf-figgems", K.erfahrung],
  ["fgf-unlocked", K.unlocked], ["fgf-chosen", K.chosen], ["fgf-tut", K.tut]
];

export interface Progress {
  playerName: string;
  taler: number; training: number; kristalle: number; siegpraemien: number;
  /** Trainingsstufe 1–5 je Figur */
  stufen: Record<string, number>;
  /** Erfahrung (EP) je Figur, steigt nur */
  erfahrung: Record<string, number>;
  unlocked: Set<string>;
  chosen: string;
  tutDone: boolean;
}

/** Ein Angebot der Siegprämie mit fester Menge, offen sichtbar */
export interface PraemieItem { k: PraemieKind; n: number }

export interface MatchSummary {
  result: MatchResult;
  praemieWon: boolean;
  kristalleLost: number;
  figure: string; epPlus: number; epTotal: number;
  fresh: CosmeticReward[];
}

const int = (s: string | null) => Math.max(0, parseInt(s || "0", 10) || 0);
function json<T>(s: string | null, fallback: T): T {
  try { return (s && JSON.parse(s)) || fallback; } catch { return fallback; }
}

/** Kosmetik über Kristall-Schwellen: einmal freigeschaltet bleibt freigeschaltet */
function unlockRewards(p: Progress): CosmeticReward[] {
  const fresh = REWARDS.filter(r => !p.unlocked.has(r.id) && p.kristalle >= r.cost);
  for (const r of fresh) p.unlocked.add(r.id);
  return fresh;
}

/** Alte Spielstände einmalig übernehmen: alte Schlüssel lesen, unter den neuen Namen schreiben. */
export function migrate(store: Store): void {
  if (store.get(K.migriert) === "1") return;
  for (const [alt, neu] of OLD) {
    const v = store.get(alt);
    if (v !== null && store.get(neu) === null) store.set(neu, v);
  }
  store.set(K.migriert, "1");
}

export function loadProgress(store: Store): Progress {
  migrate(store);
  const chosen = store.get(K.chosen);
  const p: Progress = {
    playerName: (store.get(K.player) || "").trim(),
    taler: int(store.get(K.taler)), training: int(store.get(K.training)), kristalle: int(store.get(K.kristalle)),
    siegpraemien: int(store.get(K.siegpraemien)),
    stufen: json(store.get(K.stufen), {}), erfahrung: json(store.get(K.erfahrung), {}),
    unlocked: new Set(json<string[]>(store.get(K.unlocked), [])),
    chosen: chosen && FIGURES[chosen] ? chosen : DEFAULT_FIGURE,
    tutDone: store.get(K.tut) === "1"
  };
  unlockRewards(p);
  return p;
}

export function saveProgress(store: Store, p: Progress): void {
  if (p.playerName) store.set(K.player, p.playerName);
  store.set(K.taler, String(p.taler)); store.set(K.training, String(p.training));
  store.set(K.kristalle, String(p.kristalle)); store.set(K.siegpraemien, String(p.siegpraemien));
  store.set(K.stufen, JSON.stringify(p.stufen)); store.set(K.erfahrung, JSON.stringify(p.erfahrung));
  store.set(K.unlocked, JSON.stringify([...p.unlocked])); store.set(K.chosen, p.chosen);
  if (p.tutDone) store.set(K.tut, "1");
}

export const validName = (raw: string) => raw.trim().length >= NAME_MIN;

/** Der Name wird einmalig vergeben (2–12 Zeichen) und ist danach nicht mehr änderbar */
export function setPlayerName(p: Progress, raw: string): boolean {
  if (p.playerName || !validName(raw)) return false;
  p.playerName = raw.trim().slice(0, NAME_MAX);
  return true;
}

export const stufeOf = (p: Progress, key: string) => clampStufe(p.stufen[key]);
export const epOf = (p: Progress, key: string) => p.erfahrung[key] || 0;

export function trainingCost(p: Progress, key: string): [taler: number, training: number] | null {
  const lv = stufeOf(p, key);
  return lv >= MAX_STUFE ? null : TRAINING_COST[lv + 1];
}
export function canTrainieren(p: Progress, key: string): boolean {
  const cost = trainingCost(p, key);
  return !!cost && p.taler >= cost[0] && p.training >= cost[1];
}
export function trainieren(p: Progress, key: string): boolean {
  const cost = trainingCost(p, key);
  if (!cost || !canTrainieren(p, key)) return false;
  p.taler -= cost[0]; p.training -= cost[1]; p.stufen[key] = stufeOf(p, key) + 1;
  return true;
}

/**
 * Nur ein Sieg gibt eine Siegprämie. Unentschieden gibt nichts, eine Niederlage kostet 3 Kristalle (nie unter 0).
 * Erfahrung steigt immer: Sieg +10, Unentschieden +5, Niederlage +2.
 */
export function applyMatchResult(p: Progress, figure: string, result: MatchResult): MatchSummary {
  if (result === "win") p.siegpraemien++;
  const before = epOf(p, figure);
  p.erfahrung[figure] = before + ERFAHRUNG[result];
  const kristalleBefore = p.kristalle;
  if (result === "loss") p.kristalle = Math.max(0, p.kristalle + LOSS_KRISTALLE);
  return {
    result, praemieWon: result === "win", kristalleLost: kristalleBefore - p.kristalle,
    figure, epPlus: ERFAHRUNG[result], epTotal: p.erfahrung[figure], fresh: unlockRewards(p)
  };
}

/** Die drei offenen Angebote einer Siegprämie: je eines pro Währung, Menge innerhalb der Spanne */
export function praemieAngebote(random: () => number = Math.random): PraemieItem[] {
  return PRAEMIE_ANGEBOTE.map(a => ({ k: a.k, n: a.min + Math.floor(random() * (a.max - a.min + 1)) }));
}

/** Der Spieler wählt genau eines der Angebote. Verbraucht eine Siegprämie. */
export function waehlePraemie(p: Progress, item: PraemieItem): CosmeticReward[] | null {
  if (p.siegpraemien < 1) return null;
  p.siegpraemien--;
  p[item.k] += item.n;
  return unlockRewards(p);
}

export function playerSetup(p: Progress): PlayerSetup {
  return {
    figure: p.chosen, name: p.playerName, stufe: stufeOf(p, p.chosen),
    cosmetics: { krone: p.unlocked.has("krone"), gold: p.unlocked.has("gold"), spur: p.unlocked.has("spur") }
  };
}
