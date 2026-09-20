import {
  ATTACK_COOLDOWN, CARRY_SPEED, H, LOB_TIME, PICKUP_COOLDOWN, PROJ_SPEED, RESPAWN_TIME,
  SHIELD_FACTOR, TURBO_FACTOR, W
} from "../data/balance";
import { kickDist, superKickDist } from "../data/modes";
import { teamColor } from "../data/colors";
import { targetCenter } from "../data/maps";
import { collide, visibleTo } from "./geometry";
import { clamp, hyp, rnd } from "./math";
import type { Kicker, Ring, World } from "./world";

export const ring = (x: number, y: number, r0: number, r1: number, dur: number, col: string): Ring => ({ x, y, r0, r1, t: 0, dur, col });

function spawnProj(w: World, b: Kicker, a: number, speed: number, range: number, dmg: number, pierce: boolean, big: boolean, sup: boolean): void {
  const spd = speed * PROJ_SPEED;
  w.projs.push({
    x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
    spd, trav: 0, range, dmg, team: b.team, owner: b, pierce, rad: big ? 12 : 7, hit: new Set(), sup
  });
}

function fire(w: World, b: Kicker, ang: number, d01: number, isSup: boolean): void {
  const s = isSup ? b.T.sup : b.T.shot;
  const range = (isSup && "range" in s && s.range) || b.T.range;
  b.reveal = 1.0; b.sinceShot = 0; b.aim = ang;
  switch (s.kind) {
    case "spread":
      for (let i = 0; i < s.pellets; i++) {
        const a = ang - s.spread / 2 + s.spread * (i / (s.pellets - 1));
        spawnProj(w, b, a, s.speed, range, s.dmg, false, false, isSup);
      }
      break;
    case "bullet":
      spawnProj(w, b, ang, s.speed, range, s.dmg, !!s.pierce, !!s.big, isSup);
      break;
    case "shield":
      b.shieldT = s.time; w.fx.push(ring(b.x, b.y, 20, 50, 0.4, "#80d8ff"));
      break;
    case "turbo":
      b.turboT = s.time; w.fx.push(ring(b.x, b.y, 20, 50, 0.4, "#ffc83d"));
      break;
    case "dash": {
      const T0 = 0.25;
      b.dash = { vx: Math.cos(ang) * s.dist / T0, vy: Math.sin(ang) * s.dist / T0, t: T0, dmg: s.dmg, hit: new Set() };
      break;
    }
    case "heal":
      for (const e of w.ents) if (e.alive && e.team === b.team && !e.dummy && hyp(e.x - b.x, e.y - b.y) < s.radius) {
        const add = Math.min(s.amount, e.T.hp - e.hp); e.hp += add;
        if (add > 0 && (e === w.player || b === w.player)) w.floaters.push({ x: e.x, y: e.y - 44, t: 0, txt: "+" + Math.round(add), col: "#57d96e" });
      }
      w.fx.push(ring(b.x, b.y, 20, s.radius, 0.5, "#57d96e"));
      break;
    case "lob": {
      const d = Math.max(70, range * d01);
      w.lobs.push({
        x0: b.x, y0: b.y, x1: clamp(b.x + Math.cos(ang) * d, 10, W - 10), y1: clamp(b.y + Math.sin(ang) * d, 10, H - 10),
        t: 0, dur: s.dur * LOB_TIME, radius: s.radius, dmg: s.dmg, team: b.team, owner: b, sup: isSup
      });
    }
  }
}

/** Startgeschwindigkeit `pw`: Bei Reibung exp(-k·t) rollt der Ball insgesamt pw / k weit. */
export function kick(w: World, b: Kicker, ang: number, pw: number): void {
  const B = w.ball;
  B.carrier = null; B.last = b; B.passer = b; B.vx = Math.cos(ang) * pw; B.vy = Math.sin(ang) * pw;
  b.pickCool = PICKUP_COOLDOWN; b.aim = ang; b.reveal = 1;
}

/** Mit Ball: normaler Schuss. Ohne Ball: Angriff mit Munition. */
export function tryAttack(w: World, b: Kicker, ang: number, d01: number): boolean {
  if (w.ball.carrier === b) {
    if (!b.alive || b.cool > 0) return false;
    kick(w, b, ang, kickDist(w.mode) * w.mode.friction); b.cool = ATTACK_COOLDOWN; return true;
  }
  if (!b.alive || b.ammo < 1 || b.cool > 0) return false;
  b.ammo -= 1; b.cool = ATTACK_COOLDOWN; fire(w, b, ang, d01, false); return true;
}

/** Mit Ball: Super-Schuss. Ohne Ball: Super der Figur. */
export function trySuper(w: World, b: Kicker, ang: number, d01: number): boolean {
  if (!b.alive || b.superC < 1) return false;
  b.superC = 0;
  if (w.ball.carrier === b) { kick(w, b, ang, superKickDist(w.mode) * w.mode.friction); w.ball.superT = 0.6; }
  else fire(w, b, ang, d01, true);
  w.fx.push(ring(b.x, b.y, 20, 60, 0.3, "#ffc83d"));
  return true;
}

export function damage(w: World, t: Kicker, amount: number, src: Kicker | null, isSup: boolean): void {
  if (!t.alive) return;
  const amt = Math.round(amount * (t.shieldT > 0 ? SHIELD_FACTOR : 1));
  t.hp -= amt; t.sinceHurt = 0; t.reveal = Math.max(t.reveal, 0.8);
  if (src && !isSup) src.superC = Math.min(1, src.superC + amt / src.T.superCost);
  if (src === w.player || t === w.player)
    w.floaters.push({ x: t.x + rnd(w.rng, -10, 10), y: t.y - 44, t: 0, txt: String(amt), col: t === w.player ? "#ff5a5a" : "#ffffff" });
  if (t.dummy) { if (src === w.player) w.tut.hits++; if (t.hp <= 0) t.hp = t.T.hp; return; }
  if (t.hp <= 0) {
    t.hp = 0; t.alive = false; t.respawn = RESPAWN_TIME;
    // Wer ausgeschaltet wird, verliert den Ball
    if (w.ball.carrier === t) { w.ball.carrier = null; w.ball.vx = w.ball.vy = 0; }
    w.fx.push(ring(t.x, t.y, 10, 80, 0.45, teamColor(t.team)));
    if (t === w.player) w.events.push({ type: "playerKo" });
  }
}

/** Tippen statt Zielen: mit Ball aufs gegnerische Tor, sonst auf den nächsten sichtbaren Gegner */
export function autoFire(w: World, b: Kicker, isSup: boolean): boolean {
  if (!b.alive) return false;
  if (w.ball.carrier === b) {
    const g = targetCenter(w.mode.scoreBy, b.team), ang = Math.atan2(g.y - b.y, g.x - b.x);
    return isSup ? trySuper(w, b, ang, 1) : tryAttack(w, b, ang, 1);
  }
  const T = b.T, range = (isSup && "range" in T.sup && T.sup.range) || T.range;
  let tgt: Kicker | null = null, bd = 1e9;
  for (const e of w.ents) {
    if (!e.alive || e.team === b.team || !visibleTo(w, e, b.team)) continue;
    const d = hyp(e.x - b.x, e.y - b.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  let ang = b.aim, d01 = 1;
  if (tgt && bd < range * 1.4) { ang = Math.atan2(tgt.y - b.y, tgt.x - b.x); d01 = Math.min(1, bd / range); }
  return isSup ? trySuper(w, b, ang, d01) : tryAttack(w, b, ang, d01);
}

export function moveEnt(w: World, b: Kicker, mx: number, my: number, dt: number): void {
  const ox = b.x, oy = b.y;
  const sp = b.T.speed * (w.ball.carrier === b ? CARRY_SPEED : 1) * (b.turboT > 0 ? TURBO_FACTOR : 1);
  b.x += mx * sp * dt; b.y += my * sp * dt;
  collide(w.map, b);
  b.vx = (b.x - ox) / dt; b.vy = (b.y - oy) / dt;
}
