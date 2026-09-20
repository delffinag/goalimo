import { MEDAL_KINDS, type CosmeticReward, type MedalKind } from "../data/balance";
import { FIGURES } from "../data/figures";
import type { MatchResult } from "../sim/world";
import { applyMatchResult, medalFor, type Progress } from "./progress";
import type { Store } from "./storage";

/**
 * Eine Sitzung ist eine Reihe von Matches am Stück: nach jedem Match wählt der Spieler
 * „Nochmal“ oder „Spiel verlassen“. Erst beim Verlassen wird alles auf einmal gutgeschrieben –
 * Medaillen, Erfahrung, Kristallverlust und je Sieg eine Siegprämie.
 */
export interface SessionMatch { result: MatchResult; figure: string; score: [number, number] }
export interface Session { matches: SessionMatch[] }

export interface SessionSummary {
  matches: number;
  wins: number; draws: number; losses: number;
  medals: Record<MedalKind, number>;
  /** Erfahrung je eingesetzter Figur */
  ep: { figure: string; plus: number; total: number }[];
  kristalleLost: number;
  /** Offene Siegprämien aus dieser Sitzung: eine pro Sieg */
  praemien: number;
  fresh: CosmeticReward[];
}

const noMedals = (): Record<MedalKind, number> => ({ gold: 0, silber: 0, bronze: 0 });

export const emptySession = (): Session => ({ matches: [] });

/** Was die Sitzung bisher eingebracht hat, ohne etwas zu verbuchen (Anzeige nach jedem Match) */
export function sessionTally(s: Session) {
  const medals = noMedals();
  let wins = 0, draws = 0, losses = 0;
  for (const m of s.matches) {
    if (m.result === "win") { wins++; medals[medalFor(m.score[0], m.score[1])]++; }
    else if (m.result === "draw") draws++;
    else losses++;
  }
  return { matches: s.matches.length, wins, draws, losses, medals, praemien: wins };
}

/**
 * Verbucht die ganze Sitzung. Jedes Match wird einzeln über `applyMatchResult` abgerechnet,
 * damit für die Wirtschaft dieselben Regeln gelten wie zuvor – nur eben alle auf einmal.
 */
export function applySession(p: Progress, s: Session): SessionSummary {
  const medals = noMedals(), ep = new Map<string, { plus: number; total: number }>();
  const fresh: CosmeticReward[] = [];
  let wins = 0, draws = 0, losses = 0, kristalleLost = 0;
  for (const m of s.matches) {
    const sum = applyMatchResult(p, m.figure, m.result, m.score);
    if (m.result === "win") wins++; else if (m.result === "draw") draws++; else losses++;
    if (sum.medal) medals[sum.medal]++;
    kristalleLost += sum.kristalleLost;
    const before = ep.get(m.figure);
    ep.set(m.figure, { plus: (before?.plus ?? 0) + sum.epPlus, total: sum.epTotal });
    for (const r of sum.fresh) if (!fresh.includes(r)) fresh.push(r);
  }
  return {
    matches: s.matches.length, wins, draws, losses, medals, kristalleLost, praemien: wins,
    ep: [...ep].map(([figure, e]) => ({ figure, ...e })), fresh
  };
}

// ---------- Speicherung ----------
// Die offene Sitzung liegt im Speicher, damit ein geschlossener Tab sie nicht verschluckt.
const K = "gl-sitzung";
const RESULTS: MatchResult[] = ["win", "draw", "loss"];

const validMatch = (m: unknown): m is SessionMatch => {
  const x = m as SessionMatch;
  return !!x && RESULTS.includes(x.result) && typeof x.figure === "string" && !!FIGURES[x.figure]
    && Array.isArray(x.score) && x.score.length === 2 && x.score.every(n => Number.isFinite(n));
};

export function loadSession(store: Store): Session {
  try {
    const raw = JSON.parse(store.get(K) || "[]");
    return { matches: Array.isArray(raw) ? raw.filter(validMatch) : [] };
  } catch { return emptySession(); }
}

export function saveSession(store: Store, s: Session): void { store.set(K, JSON.stringify(s.matches)); }
export function clearSession(store: Store): void { store.set(K, "[]"); }

/** Zeile „2 Siege, 1 Niederlage“ */
export function resultLine(t: { wins: number; draws: number; losses: number }): string {
  const parts: string[] = [];
  if (t.wins) parts.push(t.wins === 1 ? "1 Sieg" : `${t.wins} Siege`);
  if (t.draws) parts.push(t.draws === 1 ? "1 Unentschieden" : `${t.draws} Unentschieden`);
  if (t.losses) parts.push(t.losses === 1 ? "1 Niederlage" : `${t.losses} Niederlagen`);
  return parts.join(", ");
}

export const medalEntries = (medals: Record<MedalKind, number>) =>
  MEDAL_KINDS.filter(k => medals[k] > 0).map(k => [k, medals[k]] as const);
