import { H, W } from "../data/balance";
import { GOALS } from "../data/maps";
import { mulberry32, rnd } from "../sim/math";
import type { LoadedMap, World } from "../sim/world";
import { circle, roundRect, type Ctx } from "./draw";

interface Blob { x: number; y: number; r: number }

// Büsche bestehen aus vielen Kreisen. Fester Startwert, damit sie bei jedem Start gleich aussehen.
const blobCache = new WeakMap<LoadedMap, Blob[][]>();
function bushBlobs(map: LoadedMap): Blob[][] {
  let all = blobCache.get(map);
  if (!all) {
    const rng = mulberry32(7);
    all = map.bushes.map(b => {
      const blobs: Blob[] = [];
      for (let x = b.x + 18; x <= b.x + b.w - 14; x += 30)
        for (let y = b.y + 18; y <= b.y + b.h - 14; y += 30)
          blobs.push({ x: x + rnd(rng, -4, 4), y: y + rnd(rng, -4, 4), r: rnd(rng, 22, 27) });
      return blobs;
    });
    blobCache.set(map, all);
  }
  return all;
}

/** Rasen mit Streifen à 100 px, Linien und Tore */
export function drawFloor(ctx: Ctx): void {
  ctx.fillStyle = "#7fbf66"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#74b45b";
  for (let x = 100; x < W; x += 200) ctx.fillRect(x, 0, 100, H);
  ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  circle(ctx, W / 2, H / 2, 110); ctx.stroke();
  GOALS.forEach((g, i) => {
    ctx.fillStyle = i ? "rgba(63,184,240,.5)" : "rgba(255,122,47,.5)"; ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2;
    for (let yy = g.y + 16; yy < g.y + g.h; yy += 16) { ctx.beginPath(); ctx.moveTo(g.x, yy); ctx.lineTo(g.x + g.w, yy); ctx.stroke(); }
    for (let xx = g.x + 12; xx < g.x + g.w; xx += 12) { ctx.beginPath(); ctx.moveTo(xx, g.y); ctx.lineTo(xx, g.y + g.h); ctx.stroke(); }
  });
}

export function drawWalls(ctx: Ctx, map: LoadedMap): void {
  for (const w of map.walls) {
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(w.x + 6, w.y + 8, w.w, w.h);
    ctx.fillStyle = "#4f5f77"; roundRect(ctx, w.x, w.y, w.w, w.h, 8); ctx.fill();
    ctx.fillStyle = "#7d90ac"; roundRect(ctx, w.x, w.y - 10, w.w, w.h, 8); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.stroke();
  }
}

/** Der Busch, in dem der Spieler steht, wird durchsichtig */
export function drawBushes(ctx: Ctx, w: World): void {
  const pb = w.player && w.player.alive ? w.player.bush : -1;
  bushBlobs(w.map).forEach((blobs, i) => {
    ctx.globalAlpha = i === pb ? 0.5 : 0.96;
    for (const b of blobs) { circle(ctx, b.x, b.y, b.r); ctx.fillStyle = "#2f7a3e"; ctx.fill(); }
    for (const b of blobs) { circle(ctx, b.x - 5, b.y - 6, b.r * 0.55); ctx.fillStyle = "#45a257"; ctx.fill(); }
  });
  ctx.globalAlpha = 1;
}

export function drawBall(ctx: Ctx, w: World): void {
  if (!(w.phase === "match" || w.phase === "countdown" || w.phase === "ending")) return;
  const B = w.ball;
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(B.x, B.y + 13, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  circle(ctx, B.x, B.y, B.r); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#2d2d33"; ctx.stroke();
  ctx.fillStyle = "#2d2d33"; circle(ctx, B.x, B.y, 5); ctx.fill();
  for (let k = 0; k < 5; k++) {
    const a = k * 1.2566 + (B.x + B.y) * 0.03;
    circle(ctx, B.x + Math.cos(a) * 11, B.y + Math.sin(a) * 11, 3); ctx.fill();
  }
}
