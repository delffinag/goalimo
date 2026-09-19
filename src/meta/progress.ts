import {
  BOX_ITEMS, FIGURE_GEMS, LOOT_TABLE, LOSS_GEMS, MAX_LEVEL, NAME_MAX, NAME_MIN, REWARDS, UPGRADE_COST,
  type CosmeticReward, type LootKind
} from "../data/balance";
import { clampLevel, DEFAULT_FIGURE, FIGURES } from "../data/figures";
import type { MatchResult, PlayerSetup } from "../sim/world";
import type { Store } from "./storage";

// Dieselben Schlüssel wie im Prototyp, damit vorhandene Spielstände weiter gelten
const K = {
  player: "fgf-player", gems: "fgf-gems", coins: "fgf-coins", pp: "fgf-pp", boxes: "fgf-boxes", levels: "fgf-levels",
  figGems: "fgf-figgems", unlocked: "fgf-unlocked", chosen: "fgf-chosen", tut: "fgf-tut"
};

export interface Progress {
  playerName: string;
  coins: number; pp: number; gems: number; boxes: number;
  levels: Record<string, number>;
  figGems: Record<string, number>;
  unlocked: Set<string>;
  chosen: string;
  tutDone: boolean;
}

export interface LootItem { k: LootKind; n: number }

export interface MatchSummary {
  result: MatchResult;
  boxWon: boolean;
  gemsLost: number;
  figure: string; figChange: number; figTotal: number;
  fresh: CosmeticReward[];
}

const int = (s: string | null) => Math.max(0, parseInt(s || "0", 10) || 0);
function json<T>(s: string | null, fallback: T): T {
  try { return (s && JSON.parse(s)) || fallback; } catch { return fallback; }
}

/** Kosmetik über Juwelen-Schwellen: einmal freigeschaltet bleibt freigeschaltet */
function unlockRewards(p: Progress): CosmeticReward[] {
  const fresh = REWARDS.filter(r => !p.unlocked.has(r.id) && p.gems >= r.cost);
  for (const r of fresh) p.unlocked.add(r.id);
  return fresh;
}

export function loadProgress(store: Store): Progress {
  const chosen = store.get(K.chosen);
  const p: Progress = {
    playerName: (store.get(K.player) || "").trim(),
    coins: int(store.get(K.coins)), pp: int(store.get(K.pp)), gems: int(store.get(K.gems)), boxes: int(store.get(K.boxes)),
    levels: json(store.get(K.levels), {}), figGems: json(store.get(K.figGems), {}),
    unlocked: new Set(json<string[]>(store.get(K.unlocked), [])),
    chosen: chosen && FIGURES[chosen] ? chosen : DEFAULT_FIGURE,
    tutDone: store.get(K.tut) === "1"
  };
  unlockRewards(p);
  return p;
}

export function saveProgress(store: Store, p: Progress): void {
  if (p.playerName) store.set(K.player, p.playerName);
  store.set(K.coins, String(p.coins)); store.set(K.pp, String(p.pp)); store.set(K.gems, String(p.gems)); store.set(K.boxes, String(p.boxes));
  store.set(K.levels, JSON.stringify(p.levels)); store.set(K.figGems, JSON.stringify(p.figGems));
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

export const levelOf = (p: Progress, key: string) => clampLevel(p.levels[key]);
export const figGemsOf = (p: Progress, key: string) => p.figGems[key] || 0;

export function upgradeCost(p: Progress, key: string): [coins: number, pp: number] | null {
  const lv = levelOf(p, key);
  return lv >= MAX_LEVEL ? null : UPGRADE_COST[lv + 1];
}
export function canUpgrade(p: Progress, key: string): boolean {
  const cost = upgradeCost(p, key);
  return !!cost && p.coins >= cost[0] && p.pp >= cost[1];
}
export function upgrade(p: Progress, key: string): boolean {
  const cost = upgradeCost(p, key);
  if (!cost || !canUpgrade(p, key)) return false;
  p.coins -= cost[0]; p.pp -= cost[1]; p.levels[key] = levelOf(p, key) + 1;
  return true;
}

/** Nur ein Sieg gibt eine Box. Niederlage kostet Juwelen (nie unter 0). Figuren-Juwelen: Sieg +8, Unentschieden +2, Niederlage −4. */
export function applyMatchResult(p: Progress, figure: string, result: MatchResult): MatchSummary {
  if (result === "win") p.boxes++;
  const figBefore = figGemsOf(p, figure);
  p.figGems[figure] = Math.max(0, figBefore + FIGURE_GEMS[result]);
  const gemsBefore = p.gems;
  if (result === "loss") p.gems = Math.max(0, p.gems + LOSS_GEMS);
  return {
    result, boxWon: result === "win", gemsLost: gemsBefore - p.gems,
    figure, figChange: p.figGems[figure] - figBefore, figTotal: p.figGems[figure], fresh: unlockRewards(p)
  };
}

function rollItem(random: () => number): LootItem {
  const r = random();
  const row = LOOT_TABLE.find(x => r < x.upTo) ?? LOOT_TABLE[LOOT_TABLE.length - 1];
  return { k: row.k, n: row.min + Math.floor(random() * (row.max - row.min + 1)) };
}

/** Eine Box enthält 3 Objekte: Münzen 10–30, Powerpunkte 5–15, selten Juwelen 1–4 */
export function rollBox(random: () => number = Math.random): LootItem[] {
  return Array.from({ length: BOX_ITEMS }, () => rollItem(random));
}

export function useBox(p: Progress): boolean {
  if (p.boxes < 1) return false;
  p.boxes--;
  return true;
}

export function collectItem(p: Progress, item: LootItem): CosmeticReward[] {
  p[item.k] += item.n;
  return unlockRewards(p);
}

export function playerSetup(p: Progress): PlayerSetup {
  return {
    figure: p.chosen, name: p.playerName, level: levelOf(p, p.chosen),
    cosmetics: { krone: p.unlocked.has("krone"), gold: p.unlocked.has("gold"), spur: p.unlocked.has("spur") }
  };
}
