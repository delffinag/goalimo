import { COUNTDOWN_AFTER_GOAL, H, PASS_SUPER_BONUS, STEP, W } from "../data/balance";
import { GOALS, TRY_ZONES } from "../data/maps";
import type { GameMode } from "../data/modes";
import type { Point } from "../data/types";
import { ring } from "./combat";
import { inRect, keepInCorners } from "./geometry";
import { clamp, hyp, rnd } from "./math";
import { resetBall, respawnKicker, type Ball, type Kicker, type LoadedMap, type World } from "./world";

export function updateBall(w: World, dt: number): void {
  const B = w.ball;
  if (B.carrier) {
    const c = B.carrier;
    if (!c.alive) B.carrier = null;
    else {
      B.x = c.x + Math.cos(c.aim) * (c.r + B.r - 4); B.y = c.y + Math.sin(c.aim) * (c.r + B.r - 4);
      B.vx = B.vy = 0; c.reveal = Math.max(c.reveal, 0.2);
    }
  }
  if (!B.carrier) {
    if (B.superT > 0) { B.superT -= dt; w.fx.push(ring(B.x, B.y, 14, 4, 0.35, "#ffc83d")); }
    // In Teilschritten, damit ein schneller Puck weder durch Mauern noch an Figuren vorbei fliegt
    const n = substeps(B, dt), h = dt / n;
    for (let i = 0; i < n; i++) {
      glide(w.map, w.mode, B, h);
      if (pickUp(w) || inGoal(w.mode, B)) break;
    }
  }
  scoreCheck(w);
}

/** Ein Teilschritt höchstens eine halbe Ballbreite weit */
const substeps = (B: Puck, dt: number) => Math.max(1, Math.ceil(hyp(B.vx, B.vy) * dt / (B.r * 0.5)));

type Puck = Pick<Ball, "x" | "y" | "vx" | "vy" | "r">;

/** Freier Ball: gleiten, bremsen, von Mauern, Spielfeldrand und runder Bande abprallen */
function glide(map: LoadedMap, mode: GameMode, B: Puck, dt: number): void {
  B.x += B.vx * dt; B.y += B.vy * dt;
  const f = Math.exp(-mode.friction * dt); B.vx *= f; B.vy *= f;
  const reflect = (nx: number, ny: number) => {
    const vn = B.vx * nx + B.vy * ny;
    if (vn < 0) { B.vx -= (1 + mode.bounce) * vn * nx; B.vy -= (1 + mode.bounce) * vn * ny; }
  };
  for (const wl of map.walls) {
    const cx = clamp(B.x, wl.x, wl.x + wl.w), cy = clamp(B.y, wl.y, wl.y + wl.h), dx = B.x - cx, dy = B.y - cy, d = hyp(dx, dy);
    if (d < B.r) {
      const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1;
      B.x = cx + nx * B.r; B.y = cy + ny * B.r;
      reflect(nx, ny);
    }
  }
  if (B.x < B.r) { B.x = B.r; B.vx = Math.abs(B.vx) * mode.bounce; }
  if (B.x > W - B.r) { B.x = W - B.r; B.vx = -Math.abs(B.vx) * mode.bounce; }
  if (B.y < B.r) { B.y = B.r; B.vy = Math.abs(B.vy) * mode.bounce; }
  if (B.y > H - B.r) { B.y = H - B.r; B.vy = -Math.abs(B.vy) * mode.bounce; }
  const n = keepInCorners(map, B);
  if (n) reflect(n[0], n[1]);
}

/** Läuft eine Figur in den freien Ball, nimmt sie ihn an. Kommt er von einem Mitspieler, war es ein Pass. */
function pickUp(w: World): boolean {
  const B = w.ball;
  for (const b of w.ents) if (b.alive && !b.dummy && b.pickCool <= 0 && hyp(b.x - B.x, b.y - B.y) < b.r + B.r) {
    const passer = B.passer;
    B.carrier = b; B.last = b; B.passer = null;
    if (passer && passer !== b && passer.team === b.team) passBonus(w, passer);
    if (!b.isPlayer) b.ai.passWait = rnd(w.rng, 0.8, 1.4);
    return true;
  }
  return false;
}

const inGoal = (mode: GameMode, B: Puck) => mode.scoreBy === "kick" && GOALS.some(g => inRect(B.x, B.y, g));

/**
 * Weg eines Schusses mit Startweite `dist` vom Ball aus, inklusive Abprallern. Figuren werden nicht berücksichtigt.
 * Für die Zielhilfe; verändert die Welt nicht.
 */
export function traceKick(w: World, ang: number, dist: number): Point[] {
  const pw = dist * w.mode.friction;
  const B: Puck = { x: w.ball.x, y: w.ball.y, vx: Math.cos(ang) * pw, vy: Math.sin(ang) * pw, r: w.ball.r };
  const pts: Point[] = [{ x: B.x, y: B.y }];
  for (let t = 0; t < 8 && hyp(B.vx, B.vy) > 10; t += STEP) {
    const n = substeps(B, STEP);
    for (let i = 0; i < n; i++) glide(w.map, w.mode, B, STEP / n);
    pts.push({ x: B.x, y: B.y });
    if (inGoal(w.mode, B)) break;
  }
  return pts;
}

/**
 * Fußball: der Ball muss ins Tor, egal wer ihn dorthin gebracht hat.
 * Rugby: eine Figur muss den Ball selbst über die gegnerische Linie tragen – ein Schuss ins Malfeld zählt nicht.
 */
function scoreCheck(w: World): void {
  const B = w.ball;
  if (w.mode.scoreBy === "carry") {
    const c = B.carrier;
    if (c && c.alive && !c.dummy && inRect(c.x, c.y, TRY_ZONES[1 - c.team])) scoreGoal(w, c.team);
    return;
  }
  for (let tm = 0; tm < 2; tm++) if (inRect(B.x, B.y, GOALS[tm])) { scoreGoal(w, 1 - tm); break; }
}

/** Ein Pass, der ankommt, lädt den Super des Passgebers um 25 % */
function passBonus(w: World, passer: Kicker): void {
  passer.superC = Math.min(1, passer.superC + PASS_SUPER_BONUS);
  if (passer.team === 0) w.floaters.push({ x: passer.x, y: passer.y - 50, t: 0, txt: "Pass! Super +25 %", col: "#ffc83d" });
}

/** Torfeuerwerk aus dem Shop: bunte Ringe um die Stelle, an der der Punkt fiel. Rein optisch. */
function fireworks(w: World, x: number, y: number): void {
  const cols = ["#ffc83d", "#ff5a5a", "#3fb8f0", "#57d96e", "#b388ff"];
  for (let i = 0; i < 10; i++) {
    const a = i * 0.628, d = 40 + (i % 3) * 35;
    w.fx.push(ring(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, 34 + (i % 2) * 16, 0.6 + (i % 4) * 0.12, cols[i % cols.length]));
  }
}

/** Punkt für Team `tm`. Wer den Ball zuletzt berührt hat, steht in der Meldung. */
export function scoreGoal(w: World, tm: number): void {
  w.score[tm]++;
  const sc = w.ball.last, word = w.mode.word;
  const head = w.mode.head[tm === 0 ? 0 : 1];
  w.goalMsg = !sc ? head : sc.team === tm ? `${sc.name} scored a ${word}` : `${sc.name} scored an own ${word}`;
  w.goalFlash = 2.6;
  w.events.push({ type: "goal", team: tm, msg: w.goalMsg });
  if (sc && sc.team === tm && sc.cosmetics?.feuerwerk) fireworks(w, w.ball.x, w.ball.y);
  resetBall(w); w.projs = []; w.lobs = [];
  for (const b of w.ents) { respawnKicker(w, b); b.cool = 0; b.pickCool = 0; }
  // Im Golden Goal beendet das erste Tor das Spiel
  if (w.golden || w.score[tm] >= w.mode.winScore) { w.phase = "ending"; w.endWait = 1.8; }
  else { w.phase = "countdown"; w.countdown = COUNTDOWN_AFTER_GOAL; }
}
