import {
  BALL_FRICTION, FOE_EXTRA_SHOOT_DELAY, H, KICK_DIST, LOB_TIME, PROJ_SPEED, SUPER_KICK_DIST, W
} from "../data/balance";
import { goalCenter, LANES } from "../data/maps";
import type { Point } from "../data/types";
import { kick, moveEnt, tryAttack, trySuper } from "../sim/combat";
import { los, losWide, visibleTo } from "../sim/geometry";
import { clamp, hyp, norm, rnd } from "../sim/math";
import type { Brain } from "../sim/tick";
import type { Kicker, World } from "../sim/world";
import { steerTo } from "./pathfinding";

type Vec = [number, number];

/** Zielen mit leichtem Vorhalt und absichtlichem Fehler (`ai.noise`), damit Ausweichen möglich bleibt */
function aimAt(w: World, b: Kicker, t: Kicker, spd: number, dur: number): { ang: number; d01: number } {
  const lead = spd ? hyp(t.x - b.x, t.y - b.y) / (spd * PROJ_SPEED) : dur * LOB_TIME;
  const tx = t.x + t.vx * lead * 0.3, ty = t.y + t.vy * lead * 0.3;
  return { ang: Math.atan2(ty - b.y, tx - b.x) + rnd(w.rng, -b.ai.noise, b.ai.noise), d01: Math.min(1, hyp(tx - b.x, ty - b.y) / b.T.range) };
}

/** Abstand halten und seitlich ausweichen */
function combatMove(b: Kicker, tgt: Kicker, bd: number): Vec {
  const T = b.T, want = T.gun === "shotgun" ? T.range * 0.45 : T.range * 0.7;
  const [ux, uy] = norm(tgt.x - b.x, tgt.y - b.y);
  const radial = bd > want + 40 ? 1 : bd < want - 40 ? -1 : 0;
  return norm(ux * radial - uy * b.ai.strafe * 0.8, uy * radial + ux * b.ai.strafe * 0.8);
}

function dirTo(w: World, b: Kicker, p: Point): Vec {
  const g = steerTo(w.map, b, p);
  return hyp(g.x - b.x, g.y - b.y) > 10 ? norm(g.x - b.x, g.y - b.y) : [0, 0];
}

function holdPoint(b: Kicker): Point {
  if (b.slot === 2) return { x: b.team ? W - 420 : 420, y: 550 };
  return { x: b.team ? W - 800 : 800, y: LANES[b.slot] };
}

/** Passen, wenn der Bot bedrängt wird und ein Mitspieler freier und näher am Tor steht */
function tryPass(w: World, b: Kicker, goalDist: number, foes: Kicker[]): boolean {
  const eg = goalCenter(1 - b.team);
  let best: Kicker | null = null, bs = 0;
  for (const m of w.ents) {
    if (m === b || !m.alive || m.team !== b.team) continue;
    const dm = hyp(m.x - b.x, m.y - b.y);
    if (dm < 90 || dm > KICK_DIST + 40 || !losWide(w.map, b, m, 10)) continue;
    const ahead = goalDist - hyp(eg.x - m.x, eg.y - m.y);
    const free = foes.length ? Math.min(...foes.map(e => hyp(e.x - m.x, e.y - m.y))) : 400;
    const sc = ahead + Math.min(free, 300) * 0.6 - 40;
    if (sc > bs) { bs = sc; best = m; }
  }
  if (!best) return false;
  const lead = 0.35, tx = best.x + best.vx * lead, ty = best.y + best.vy * lead;
  const pa = Math.atan2(ty - b.y, tx - b.x), pd = hyp(tx - b.x, ty - b.y);
  kick(w, b, pa + rnd(w.rng, -0.05, 0.05), Math.min(KICK_DIST, pd + 40) * BALL_FRICTION);
  b.cool = 0.3;
  return true;
}

type BallPlan = { carry: true } | { carry: false; m: Vec; tgt?: Kicker };

function ballBrain(w: World, b: Kicker, tgt: Kicker | null, bd: number, canHit: boolean, dt: number): BallPlan {
  const B = w.ball, eg = goalCenter(1 - b.team);
  if (B.carrier === b) {
    const [mx, my] = dirTo(w, b, eg);
    moveEnt(w, b, mx, my, dt);
    const ang = Math.atan2(eg.y - b.y, eg.x - b.x);
    b.aim = ang;
    const d = hyp(eg.x - b.x, eg.y - b.y);
    b.ai.passWait -= dt;
    const foes = w.ents.filter(e => e.alive && e.team !== b.team);
    const pressed = foes.some(e => hyp(e.x - b.x, e.y - b.y) < 260);
    if ((pressed || w.rng() < 0.012) && b.ai.passWait <= 0 && b.cool <= 0 && d > KICK_DIST - 20 && tryPass(w, b, d, foes))
      return { carry: true };
    if (d < SUPER_KICK_DIST - 20 && d > KICK_DIST - 20 && b.superC >= 1 && los(w.map, b, eg)) trySuper(w, b, ang + rnd(w.rng, -0.05, 0.05), 1);
    else if (d < KICK_DIST - 20 && los(w.map, b, eg)) tryAttack(w, b, ang + rnd(w.rng, -0.08, 0.08), 1);
    return { carry: true };
  }
  if (!B.carrier) {
    // Nur der Bot, der dem freien Ball am nächsten ist, läuft hin
    let chaser: Kicker | null = null, cd = 1e9;
    for (const e of w.ents) if (e.team === b.team && e.alive && !e.isPlayer) {
      const d = hyp(e.x - B.x, e.y - B.y);
      if (d < cd) { cd = d; chaser = e; }
    }
    if (chaser === b) return { carry: false, m: dirTo(w, b, B) };
    if (canHit && tgt) return { carry: false, m: combatMove(b, tgt, bd) };
    return { carry: false, m: dirTo(w, b, holdPoint(b)) };
  }
  const c = B.carrier;
  if (c.team === b.team) {
    if (canHit && tgt) return { carry: false, m: combatMove(b, tgt, bd) };
    return { carry: false, m: dirTo(w, b, { x: clamp(c.x + (b.team ? -160 : 160), 30, W - 30), y: clamp(c.y + (b.slot - 1) * 140, 30, H - 30) }) };
  }
  const d = hyp(c.x - b.x, c.y - b.y), ch = d < b.T.range * 0.95 && (b.T.shot.kind === "lob" || los(w.map, b, c));
  return { carry: false, m: ch ? combatMove(b, c, d) : dirTo(w, b, c), tgt: c };
}

export const botThink: Brain = (w, b, dt) => {
  const ai = b.ai, T = b.T;
  ai.pathT -= dt; ai.shootDelay -= dt; ai.strafeT -= dt;
  if (ai.strafeT <= 0) { ai.strafe *= -1; ai.strafeT = rnd(w.rng, 0.6, 1.6); }
  let tgt: Kicker | null = null, bd = 1e9;
  for (const e of w.ents) {
    if (!e.alive || e.team === b.team || e.dummy || !visibleTo(w, e, b.team)) continue;
    const d = hyp(e.x - b.x, e.y - b.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  if (tgt !== ai.target) { ai.target = tgt; ai.shootDelay = Math.max(ai.shootDelay, rnd(w.rng, 0.25, 0.5)); }
  const isLob = T.shot.kind === "lob";
  const inReach = (t: Kicker, d: number) => d < T.range * 0.95 && (isLob || los(w.map, b, t));
  let canHit = !!tgt && inReach(tgt, bd);

  const plan = ballBrain(w, b, tgt, bd, canHit, dt);
  if (plan.carry) return;
  const [mx, my] = plan.m;
  if (plan.tgt) { tgt = plan.tgt; bd = hyp(tgt.x - b.x, tgt.y - b.y); canHit = inReach(tgt, bd); }

  moveEnt(w, b, mx, my, dt);
  if (tgt) b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x);
  else if (hyp(mx, my) > 0.1) b.aim = Math.atan2(my, mx);
  if (canHit && tgt) {
    if (b.superC >= 1) {
      const s = T.sup;
      const a = aimAt(w, b, tgt, "speed" in s ? s.speed : 0, "dur" in s ? s.dur : 0);
      trySuper(w, b, a.ang, a.d01);
    } else if (ai.shootDelay <= 0 && b.ammo >= 1) {
      const s = T.shot;
      const a = aimAt(w, b, tgt, "speed" in s ? s.speed : 0, "dur" in s ? s.dur : 0);
      if (tryAttack(w, b, a.ang, a.d01))
        ai.shootDelay = (T.gun === "shotgun" ? rnd(w.rng, 0.35, 0.7) : rnd(w.rng, 0.45, 0.95)) + (b.team === 1 ? FOE_EXTRA_SHOOT_DELAY : 0);
    }
  }
};
