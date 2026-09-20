import { BALL_FRICTION, COUNTDOWN_AFTER_GOAL, H, PASS_SUPER_BONUS, W } from "../data/balance";
import { GOALS, TRY_ZONES } from "../data/maps";
import { ring } from "./combat";
import { inRect } from "./geometry";
import { clamp, hyp, rnd } from "./math";
import { resetBall, respawnKicker, type Kicker, type World } from "./world";

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
    B.x += B.vx * dt; B.y += B.vy * dt;
    if (B.superT > 0) { B.superT -= dt; w.fx.push(ring(B.x, B.y, 14, 4, 0.35, "#ffc83d")); }
    const f = Math.exp(-BALL_FRICTION * dt); B.vx *= f; B.vy *= f;
    for (const wl of w.map.walls) {
      const cx = clamp(B.x, wl.x, wl.x + wl.w), cy = clamp(B.y, wl.y, wl.y + wl.h), dx = B.x - cx, dy = B.y - cy, d = hyp(dx, dy);
      if (d < B.r) {
        const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1;
        B.x = cx + nx * B.r; B.y = cy + ny * B.r;
        const vn = B.vx * nx + B.vy * ny;
        if (vn < 0) { B.vx -= 1.7 * vn * nx; B.vy -= 1.7 * vn * ny; }
      }
    }
    if (B.x < B.r) { B.x = B.r; B.vx = Math.abs(B.vx) * 0.7; }
    if (B.x > W - B.r) { B.x = W - B.r; B.vx = -Math.abs(B.vx) * 0.7; }
    if (B.y < B.r) { B.y = B.r; B.vy = Math.abs(B.vy) * 0.7; }
    if (B.y > H - B.r) { B.y = H - B.r; B.vy = -Math.abs(B.vy) * 0.7; }
    for (const b of w.ents) if (b.alive && !b.dummy && b.pickCool <= 0 && hyp(b.x - B.x, b.y - B.y) < b.r + B.r) {
      const passer = B.passer;
      B.carrier = b; B.last = b; B.passer = null;
      if (passer && passer !== b && passer.team === b.team) passBonus(w, passer);
      if (!b.isPlayer) b.ai.passWait = rnd(w.rng, 0.8, 1.4);
      break;
    }
  }
  scoreCheck(w);
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

/** Punkt für Team `tm`. Wer den Ball zuletzt berührt hat, steht in der Meldung. */
export function scoreGoal(w: World, tm: number): void {
  w.score[tm]++;
  const sc = w.ball.last, word = w.mode.word;
  const head = w.mode.head[tm === 0 ? 0 : 1];
  w.goalMsg = !sc ? head : sc.team === tm ? `${sc.name} scored a ${word}` : `${sc.name} scored an own ${word}`;
  w.goalFlash = 2.6;
  w.events.push({ type: "goal", team: tm, msg: w.goalMsg });
  resetBall(w); w.projs = []; w.lobs = [];
  for (const b of w.ents) { respawnKicker(w, b); b.cool = 0; b.pickCool = 0; }
  // Im Golden Goal beendet das erste Tor das Spiel
  if (w.golden || w.score[tm] >= w.mode.winScore) { w.phase = "ending"; w.endWait = 1.8; }
  else { w.phase = "countdown"; w.countdown = COUNTDOWN_AFTER_GOAL; }
}
