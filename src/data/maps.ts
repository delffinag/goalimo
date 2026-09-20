import { H, W } from "./balance";
import type { ScoreBy } from "./modes";
import type { MapDef, Point, Rect } from "./types";

export const FIELD: MapDef = {
  walls: [[0, 440, 70, 30], [0, 630, 70, 30], [380, 190, 60, 170], [380, 740, 60, 170], [640, 470, 60, 160]],
  bushes: [[520, 50, 170, 110], [520, 940, 170, 110], [160, 170, 130, 110], [160, 820, 130, 110]],
  spawns: [[300, 380], [250, 550], [300, 720]]
};

/** Tor von Team 0 links, Tor von Team 1 rechts */
export const GOALS: Rect[] = [{ x: 0, y: 470, w: 50, h: 160 }, { x: W - 50, y: 470, w: 50, h: 160 }];
export const goalCenter = (team: number): Point => ({ x: team ? W - 25 : 25, y: H / 2 });

/** Rugby: Malfeld über die volle Höhe. TRY_ZONES[t] verteidigt Team t, wer es mit Ball betritt, punktet für das andere Team. */
export const TRY_DEPTH = 150;
export const TRY_ZONES: Rect[] = [{ x: 0, y: 0, w: TRY_DEPTH, h: H }, { x: W - TRY_DEPTH, y: 0, w: TRY_DEPTH, h: H }];
export const tryCenter = (team: number): Point => ({ x: team ? W - TRY_DEPTH / 2 : TRY_DEPTH / 2, y: H / 2 });

/** Wohin ein Angreifer von Team `team` will: aufs Tor oder ins Malfeld */
export const targetCenter = (mode: ScoreBy, team: number): Point =>
  (mode === "carry" ? tryCenter(1 - team) : goalCenter(1 - team));

/** Haltepositionen der Bots auf drei Bahnen */
export const LANES = [300, 550, 800];
