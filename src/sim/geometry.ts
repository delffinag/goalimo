import { BUSH_REVEAL_DIST, H, W } from "../data/balance";
import type { Point, Rect } from "../data/types";
import { clamp, hyp, norm } from "./math";
import type { Kicker, LoadedMap, World } from "./world";

export const inRect = (x: number, y: number, r: Rect, pad = 0) =>
  x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

export function bushAt(map: LoadedMap, x: number, y: number): number {
  for (let i = 0; i < map.bushes.length; i++) if (inRect(x, y, map.bushes[i])) return i;
  return -1;
}

export function segHitsRect(x1: number, y1: number, x2: number, y2: number, r: Rect): boolean {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy], q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

/** Freie Sichtlinie (keine Mauer dazwischen) */
export function los(map: LoadedMap, a: Point, b: Point): boolean {
  for (const w of map.walls) if (segHitsRect(a.x, a.y, b.x, b.y, w)) return false;
  return true;
}
export function losWide(map: LoadedMap, a: Point, b: Point, r: number): boolean {
  const [nx, ny] = norm(b.x - a.x, b.y - a.y);
  const px = -ny * r, py = nx * r;
  return los(map, a, b) && los(map, { x: a.x + px, y: a.y + py }, { x: b.x + px, y: b.y + py })
    && los(map, { x: a.x - px, y: a.y - py }, { x: b.x - px, y: b.y - py });
}

/** Schiebt einen Kreis aus Mauern heraus und hält ihn im Spielfeld */
export function collide(map: LoadedMap, e: { x: number; y: number; r: number }): void {
  for (const w of map.walls) {
    const cx = clamp(e.x, w.x, w.x + w.w), cy = clamp(e.y, w.y, w.y + w.h);
    const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
    if (d2 < e.r * e.r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); e.x = cx + dx / d * e.r; e.y = cy + dy / d * e.r; }
      else {
        const l = e.x - w.x, r = w.x + w.w - e.x, t = e.y - w.y, bo = w.y + w.h - e.y, m = Math.min(l, r, t, bo);
        if (m === l) e.x = w.x - e.r; else if (m === r) e.x = w.x + w.w + e.r; else if (m === t) e.y = w.y - e.r; else e.y = w.y + w.h + e.r;
      }
    }
  }
  e.x = clamp(e.x, e.r, W - e.r); e.y = clamp(e.y, e.r, H - e.r);
  keepInCorners(map, e);
}

/** Mittelpunkt der runden Ecke, in der (x, y) liegt, oder null außerhalb der Ecken */
function cornerCenter(map: LoadedMap, x: number, y: number): Point | null {
  const R = map.corner;
  if (R <= 0) return null;
  const cx = x < R ? R : x > W - R ? W - R : -1, cy = y < R ? R : y > H - R ? H - R : -1;
  return cx < 0 || cy < 0 ? null : { x: cx, y: cy };
}

/** Liegt (x, y) mit Abstand `pad` hinter der runden Bande einer Ecke? */
export function outsideCorner(map: LoadedMap, x: number, y: number, pad = 0): boolean {
  const c = cornerCenter(map, x, y);
  return !!c && hyp(x - c.x, y - c.y) > map.corner - pad;
}

/**
 * Runde Ecken der Bande: schiebt einen Kreis zurück aufs Feld.
 * Gibt die Normale zur Feldmitte hin zurück, wenn er angestoßen ist, sonst null.
 */
export function keepInCorners(map: LoadedMap, e: { x: number; y: number; r: number }): [number, number] | null {
  const c = cornerCenter(map, e.x, e.y);
  if (!c) return null;
  const dx = e.x - c.x, dy = e.y - c.y, d = hyp(dx, dy), max = map.corner - e.r;
  if (d <= max) return null;
  const nx = dx / d, ny = dy / d;
  e.x = c.x + nx * max; e.y = c.y + ny * max;
  return [-nx, -ny];
}

/** Im Busch sieht das andere Team eine Figur erst aus der Nähe oder wenn sie sich verrät */
export function visibleTo(w: World, e: Kicker, team: number): boolean {
  if (e.team === team) return true;
  if (!e.alive) return false;
  if (e.bush < 0 || e.reveal > 0) return true;
  for (const v of w.ents) if (v.alive && v.team === team && !v.dummy && hyp(v.x - e.x, v.y - e.y) < BUSH_REVEAL_DIST) return true;
  return false;
}
