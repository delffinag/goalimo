import { H, KICK_DIST, SUPER_KICK_DIST, W } from "../data/balance";
import { FIRE, ICE } from "../data/colors";
import { STICK_R, TAP_DIST, type Input } from "../input/input";
import { visibleTo } from "../sim/geometry";
import { clamp } from "../sim/math";
import { playing, type World } from "../sim/world";
import type { Stage } from "../ui/stage";
import { drawBars, drawBrawler } from "./brawler";
import { circle, DISPLAY_FONT, type Ctx } from "./draw";
import { drawBall, drawBushes, drawFloor, drawWalls } from "./field";

export interface Renderer {
  render(w: World, input: Input): void;
  screenToWorld(x: number, y: number): { x: number; y: number };
}

const hyp = Math.hypot;

/** Zielhilfe beim Ziehen: zeigt Reichweite und Form von Angriff, Super oder Schuss */
function drawAimGuide(ctx: Ctx, w: World, input: Input): void {
  const player = w.player;
  if (!player || !player.alive) return;
  const isSup = input.supAim.active && hyp(input.supAim.dx, input.supAim.dy) >= TAP_DIST;
  const a = isSup ? input.supAim : input.aim;
  if (!a.active) return;
  const l = hyp(a.dx, a.dy);
  if (l < TAP_DIST) return;
  const ang = Math.atan2(a.dy, a.dx), s = isSup ? player.T.sup : player.T.shot;
  const range = (isSup && "range" in s && s.range) || player.T.range;
  const col = isSup && player.superC >= 1 ? "255,200,61" : "255,255,255";
  ctx.fillStyle = `rgba(${col},.3)`; ctx.strokeStyle = `rgba(${col},.8)`; ctx.lineWidth = 2;
  if (w.ball.carrier === player) {
    const d = isSup ? SUPER_KICK_DIST : KICK_DIST;
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(ang); ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d, 0); ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    circle(ctx, player.x + Math.cos(ang) * d, player.y + Math.sin(ang) * d, 14); ctx.fill(); ctx.stroke();
    return;
  }
  if (s.kind === "dash") {
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(ang);
    ctx.fillRect(0, -player.r, s.dist, player.r * 2); ctx.strokeRect(0, -player.r, s.dist, player.r * 2); ctx.restore();
    return;
  }
  if (s.kind === "heal" || s.kind === "shield" || s.kind === "turbo") {
    circle(ctx, player.x, player.y, s.kind === "heal" ? s.radius : player.r + 30); ctx.fill(); ctx.stroke();
    return;
  }
  ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.strokeStyle = "rgba(255,255,255,.7)";
  if (s.kind === "spread") {
    ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.arc(player.x, player.y, range, ang - s.spread / 2, ang + s.spread / 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (s.kind === "bullet") {
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(ang); ctx.fillRect(0, -8, range, 16); ctx.strokeRect(0, -8, range, 16); ctx.restore();
  } else {
    const d = Math.max(70, range * Math.min(1, l / STICK_R));
    const tx = player.x + Math.cos(ang) * d, ty = player.y + Math.sin(ang) * d;
    ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
    circle(ctx, tx, ty, s.radius); ctx.fill(); ctx.stroke();
  }
}

function drawStick(ctx: Ctx, bx: number, by: number, kx: number, ky: number, active: boolean, label?: string): void {
  ctx.globalAlpha = active ? 0.9 : 0.35;
  circle(ctx, bx, by, STICK_R); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.stroke();
  circle(ctx, kx, ky, 26); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fill();
  if (!active && label) { ctx.font = "800 12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText(label, bx, by + STICK_R + 16); }
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas: HTMLCanvasElement, stage: Stage): Renderer {
  const ctx = canvas.getContext("2d")!;
  let camX = 0, camY = 0;

  /** Kamera folgt dem Spieler und bleibt im Spielfeld */
  function updateCamera(w: World): void {
    const vw = stage.cw / stage.scale, vh = stage.ch / stage.scale;
    const fx = w.player ? w.player.x : W / 2, fy = w.player ? w.player.y : H / 2;
    camX = vw >= W ? (W - vw) / 2 : clamp(fx - vw / 2, 0, W - vw);
    camY = vh >= H ? (H - vh) / 2 : clamp(fy - vh / 2, 0, H - vh);
  }

  return {
    screenToWorld: (x, y) => ({ x: camX + x / stage.scale, y: camY + y / stage.scale }),
    render(w, input) {
      updateCamera(w);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#2a382f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const k = stage.dpr * stage.scale;
      ctx.setTransform(k, 0, 0, k, -camX * k, -camY * k);
      drawFloor(ctx);
      // Zielkreise für Bomben: gegnerische immer, eigene nur vom Spieler
      for (const l of w.lobs) if (l.team === 1 || l.owner === w.player) {
        circle(ctx, l.x1, l.y1, l.radius); ctx.fillStyle = l.team ? "rgba(63,184,240,.18)" : "rgba(255,122,47,.18)"; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = l.team ? ICE : FIRE; ctx.stroke();
      }
      drawWalls(ctx, w.map);
      const vis = w.ents.filter(b => b.alive && visibleTo(w, b, 0)).sort((a, b) => a.y - b.y);
      for (const b of vis) drawBrawler(ctx, b);
      for (const p of w.projs) {
        circle(ctx, p.x, p.y, p.rad); ctx.fillStyle = p.team ? ICE : FIRE; ctx.fill();
        circle(ctx, p.x, p.y, p.rad * 0.5); ctx.fillStyle = "#fff"; ctx.fill();
      }
      drawBushes(ctx, w);
      // Eigene Figuren im Busch bleiben halb durchsichtig sichtbar
      for (const b of vis) if (b.team === 0 && b.bush >= 0) drawBrawler(ctx, b);
      for (const l of w.lobs) {
        const f = l.t / l.dur, x = l.x0 + (l.x1 - l.x0) * f, y = l.y0 + (l.y1 - l.y0) * f, h = Math.sin(Math.PI * f) * 130;
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
        circle(ctx, x, y - h, l.sup ? 15 : 10); ctx.fillStyle = "#33333c"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = l.team ? ICE : FIRE; ctx.stroke();
      }
      drawBall(ctx, w);
      for (const f of w.fx) {
        const p = f.t / f.dur;
        circle(ctx, f.x, f.y, f.r0 + (f.r1 - f.r0) * p);
        ctx.globalAlpha = 1 - p; ctx.lineWidth = 6; ctx.strokeStyle = f.col; ctx.stroke(); ctx.globalAlpha = 1;
      }
      for (const b of vis) drawBars(ctx, b);
      ctx.font = `20px ${DISPLAY_FONT}`; ctx.textAlign = "center";
      for (const f of w.floaters) {
        ctx.globalAlpha = 1 - f.t / 0.8; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.6)";
        ctx.strokeText(f.txt, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      drawAimGuide(ctx, w, input);
      // Bildschirm-Ebene: Joysticks
      ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
      if (playing(w) || w.phase === "countdown") {
        const m = input.move, a = input.aim, ch = stage.ch, cw = stage.cw;
        if (m.id !== null) drawStick(ctx, m.ox, m.oy, m.ox + m.vx * STICK_R, m.oy + m.vy * STICK_R, true);
        else drawStick(ctx, 110, ch - 110, 110, ch - 110, false, "Laufen");
        if (a.id !== null) { const l = hyp(a.dx, a.dy), s = l > STICK_R ? STICK_R / l : 1; drawStick(ctx, a.ox, a.oy, a.ox + a.dx * s, a.oy + a.dy * s, true); }
        else drawStick(ctx, cw - 190, ch - 110, cw - 190, ch - 110, false, "Schießen");
      }
    }
  };
}
