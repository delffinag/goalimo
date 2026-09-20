import { H, W } from "../data/balance";
import type { Point } from "../data/types";
import { inRect, losWide } from "../sim/geometry";
import { clamp, hyp } from "../sim/math";
import type { Kicker, LoadedMap } from "../sim/world";

// Wegfindung: Raster + Breitensuche
const GC = 50, GW = W / GC, GH = H / GC;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

const grids = new WeakMap<LoadedMap, Uint8Array>();
function blockedGrid(map: LoadedMap): Uint8Array {
  let g = grids.get(map);
  if (!g) {
    g = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const cx = (i + 0.5) * GC, cy = (j + 0.5) * GC;
      for (const w of map.walls) if (inRect(cx, cy, w, 24)) { g[j * GW + i] = 1; break; }
    }
    grids.set(map, g);
  }
  return g;
}

const cellOf = (x: number, y: number) => clamp((y / GC) | 0, 0, GH - 1) * GW + clamp((x / GC) | 0, 0, GW - 1);

export function findPath(map: LoadedMap, sx: number, sy: number, tx: number, ty: number): Point[] | null {
  const blocked = blockedGrid(map);
  const si = cellOf(sx, sy), ti = cellOf(tx, ty);
  if (si === ti) return [{ x: tx, y: ty }];
  const prev = new Int16Array(GW * GH).fill(-1);
  prev[si] = si;
  const q = [si];
  let h = 0, found = false;
  while (h < q.length) {
    const c = q[h++];
    if (c === ti) { found = true; break; }
    const ci = c % GW, cj = (c / GW) | 0;
    for (const [di, dj] of DIRS) {
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
      const n = nj * GW + ni;
      if (prev[n] !== -1) continue;
      if (blocked[n] && n !== ti && !blocked[c]) continue;
      if (di && dj && (blocked[cj * GW + ni] || blocked[nj * GW + ci])) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (!found) return null;
  const path: Point[] = [];
  let c = ti;
  while (c !== si) { path.push({ x: (c % GW + 0.5) * GC, y: (((c / GW) | 0) + 0.5) * GC }); c = prev[c]; }
  path.reverse(); path[path.length - 1] = { x: tx, y: ty };
  return path;
}

/** Nächster Punkt, auf den der Bot zulaufen soll: direkt, wenn frei, sonst entlang des Pfads */
export function steerTo(map: LoadedMap, b: Kicker, goal: Point): Point {
  if (losWide(map, b, goal, b.r * 0.9)) return goal;
  const ai = b.ai;
  if (ai.pathT <= 0 || !ai.path) { ai.path = findPath(map, b.x, b.y, goal.x, goal.y); ai.pathT = 0.5; }
  const p = ai.path;
  if (!p || !p.length) return goal;
  while (p.length > 1 && hyp(p[0].x - b.x, p[0].y - b.y) < 30) p.shift();
  for (let k = Math.min(3, p.length - 1); k > 0; k--) if (losWide(map, b, p[k], b.r * 0.8)) return p[k];
  return p[0];
}
