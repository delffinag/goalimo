import {
  AIM_NOISE_ALLY, AIM_NOISE_FOE, BALL_RADIUS, BRAWLER_RADIUS, H, MATCH_TIME, W
} from "../data/balance";
import { FIGURES } from "../data/figures";
import type { FigureType, MapDef, Point, Rect } from "../data/types";
import { mulberry32, type Rng } from "./math";

export type Phase = "menu" | "tutorial" | "countdown" | "match" | "ending" | "end";
export type MatchResult = "win" | "draw" | "loss";

export interface Cosmetics { krone: boolean; gold: boolean; spur: boolean }

/** Womit der Spieler ins Match geht. Kommt aus `meta`, die Simulation kennt keine Speicherung. */
export interface PlayerSetup { figure: string; name: string; level: number; cosmetics: Cosmetics }

export interface BotState {
  path: Point[] | null; pathT: number; shootDelay: number; strafe: number; strafeT: number;
  target: Brawler | null; noise: number; passWait: number;
}

export interface Dash { vx: number; vy: number; t: number; dmg: number; hit: Set<Brawler> }

export interface Brawler {
  type: string; T: FigureType; team: number; slot: number; isPlayer: boolean; name: string;
  x: number; y: number; r: number; vx: number; vy: number; aim: number;
  hp: number; alive: boolean; ammo: number; cool: number; superC: number; respawn: number;
  reveal: number; sinceHurt: number; sinceShot: number; pickCool: number; shieldT: number; turboT: number;
  bush: number; dummy: boolean; dash: Dash | null; cosmetics: Cosmetics | null; ai: BotState;
}

export interface Projectile {
  x: number; y: number; vx: number; vy: number; spd: number; trav: number; range: number; dmg: number;
  team: number; owner: Brawler; pierce: boolean; rad: number; hit: Set<Brawler>; sup: boolean;
}
export interface Lob {
  x0: number; y0: number; x1: number; y1: number; t: number; dur: number; radius: number; dmg: number;
  team: number; owner: Brawler; sup: boolean;
}
export interface Ball { x: number; y: number; vx: number; vy: number; r: number; carrier: Brawler | null; superT: number; last: Brawler | null }

/** Rein optische Effekte. Ein Server könnte sie weglassen. */
export interface Ring { x: number; y: number; r0: number; r1: number; t: number; dur: number; col: string }
export interface Floater { x: number; y: number; t: number; txt: string; col: string }

export interface LoadedMap { walls: Rect[]; bushes: Rect[]; spawns: [Point[], Point[]] }

export interface TutorialState { step: number; moved: number; hits: number; superUsed: boolean; doneT: number }

export type SimEvent =
  | { type: "matchStart" }
  | { type: "goal"; team: number; msg: string }
  | { type: "playerKo" }
  | { type: "matchEnd"; result: MatchResult };

export interface World {
  rng: Rng;
  phase: Phase;
  map: LoadedMap;
  ents: Brawler[]; projs: Projectile[]; lobs: Lob[]; fx: Ring[]; floaters: Floater[];
  ball: Ball;
  score: [number, number];
  timeLeft: number; countdown: number; endWait: number;
  goalFlash: number; goalMsg: string; matchHint: number;
  player: Brawler | null;
  setup: PlayerSetup | null;
  tut: TutorialState;
  /** Wird von außen nach jedem Tick gelesen und geleert */
  events: SimEvent[];
}

export function loadMap(def: MapDef): LoadedMap {
  const mirror = (list: MapDef["walls"]) => {
    const out: Rect[] = [];
    for (const [x, y, w, h] of list) {
      out.push({ x, y, w, h });
      const mx = W - x - w;
      if (Math.abs(mx - x) > 1) out.push({ x: mx, y, w, h });
    }
    return out;
  };
  return {
    walls: mirror(def.walls), bushes: mirror(def.bushes),
    spawns: [def.spawns.map(([x, y]) => ({ x, y })), def.spawns.map(([x, y]) => ({ x: W - x, y }))]
  };
}

const newBall = (): Ball => ({ x: W / 2, y: H / 2, vx: 0, vy: 0, r: BALL_RADIUS, carrier: null, superT: 0, last: null });

export function createWorld(def: MapDef, seed: number = Date.now()): World {
  return {
    rng: mulberry32(seed), phase: "menu", map: loadMap(def),
    ents: [], projs: [], lobs: [], fx: [], floaters: [], ball: newBall(),
    score: [0, 0], timeLeft: MATCH_TIME, countdown: 0, endWait: 0, goalFlash: 0, goalMsg: "", matchHint: 0,
    player: null, setup: null, tut: { step: 0, moved: 0, hits: 0, superUsed: false, doneT: 0 }, events: []
  };
}

export function resetBall(w: World): void { Object.assign(w.ball, newBall()); }

export function makeBrawler(w: World, T: FigureType, team: number, slot: number, player: PlayerSetup | null): Brawler {
  const s = w.map.spawns[team][slot];
  return {
    type: T.key, T, team, slot, isPlayer: !!player, name: player && player.name ? player.name : T.name,
    x: s.x, y: s.y, r: BRAWLER_RADIUS, vx: 0, vy: 0, aim: team === 0 ? 0 : Math.PI,
    hp: T.hp, alive: true, ammo: T.ammo, cool: 0, superC: 0, respawn: 0, reveal: 0, sinceHurt: 9, sinceShot: 9,
    pickCool: 0, shieldT: 0, turboT: 0, bush: -1, dummy: false, dash: null, cosmetics: player ? player.cosmetics : null,
    ai: { path: null, pathT: 0, shootDelay: 0.6, strafe: w.rng() < 0.5 ? 1 : -1, strafeT: 0, target: null,
      noise: team === 0 ? AIM_NOISE_ALLY : AIM_NOISE_FOE, passWait: 0 }
  };
}

export function respawnBrawler(w: World, b: Brawler): void {
  const s = w.map.spawns[b.team][b.slot];
  Object.assign(b, { dash: null, x: s.x, y: s.y, hp: b.T.hp, alive: true, ammo: b.T.ammo, reveal: 0, sinceHurt: 9, vx: 0, vy: 0 });
  b.ai.path = null;
}

export const playing = (w: World) => w.phase === "match" || w.phase === "tutorial";
export const botType = (key: string) => FIGURES[key];
