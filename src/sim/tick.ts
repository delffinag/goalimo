import { SUPER_CHARGE_TIME, H, W } from "../data/balance";
import { teamColor } from "../data/colors";
import { updateBall } from "./ball";
import { autoFire, damage, moveEnt, ring, tryAttack, trySuper } from "./combat";
import { bushAt, collide, inRect } from "./geometry";
import { hyp, rnd } from "./math";
import { matchResult, tutorialUpdate } from "./match";
import { playing, respawnBrawler, type Brawler, type World } from "./world";

/** Ein Befehl des Spielers. `auto` = tippen (Ziel automatisch), sonst selbst gezielt. */
export type Command =
  | { kind: "attack" | "super"; auto: true }
  | { kind: "attack" | "super"; auto: false; ang: number; d01: number }
  /** Mausklick auf einen Punkt der Welt */
  | { kind: "attackAt"; x: number; y: number };

/** Eingabe für einen Tick. Genau diese Daten würde ein Client später an den Server schicken. */
export interface PlayerInput { mx: number; my: number; aim: number | null; commands: Command[] }

export const NO_INPUT: PlayerInput = { mx: 0, my: 0, aim: null, commands: [] };

/** Steuert einen Bot für einen Tick. Kommt aus dem Modul `ai`. */
export type Brain = (w: World, b: Brawler, dt: number) => void;

function runCommands(w: World, p: Brawler, commands: Command[]): void {
  for (const c of commands) {
    if (!p.alive || !playing(w)) return;
    if (c.kind === "attackAt") {
      const d = hyp(c.x - p.x, c.y - p.y);
      if (d < p.r) autoFire(w, p, false);
      else tryAttack(w, p, Math.atan2(c.y - p.y, c.x - p.x), Math.min(1, d / p.T.range));
    } else {
      const isSup = c.kind === "super";
      const ok = c.auto ? autoFire(w, p, isSup) : isSup ? trySuper(w, p, c.ang, c.d01) : tryAttack(w, p, c.ang, c.d01);
      if (ok && isSup) w.tut.superUsed = true;
    }
  }
}

function playerUpdate(w: World, p: Brawler, input: PlayerInput, dt: number): void {
  let mx = input.mx, my = input.my;
  const l = hyp(mx, my);
  if (l > 1) { mx /= l; my /= l; }
  if (input.aim !== null) p.aim = input.aim;
  else if (l > 0.15) p.aim = Math.atan2(my, mx);
  moveEnt(w, p, mx, my, dt);
  if (p.cosmetics?.spur && hyp(p.vx, p.vy) > 40 && w.rng() < 0.5)
    w.fx.push(ring(p.x + rnd(w.rng, -10, 10), p.y + rnd(w.rng, 6, 18), 5, 1, 0.4, w.rng() < 0.5 ? "#ffb000" : "#ff7a2f"));
  if (w.phase === "tutorial") w.tut.moved += hyp(p.vx, p.vy) * dt;
}

export function tick(w: World, dt: number, input: PlayerInput, brain: Brain): void {
  for (const f of w.fx) f.t += dt;
  w.fx = w.fx.filter(f => f.t < f.dur);
  for (const f of w.floaters) { f.t += dt; f.y -= 34 * dt; }
  w.floaters = w.floaters.filter(f => f.t < 0.8);
  w.goalFlash -= dt; w.matchHint -= dt;
  if (w.phase === "menu" || w.phase === "end") return;
  if (w.phase === "countdown") { w.countdown -= dt; if (w.countdown <= 0) w.phase = "match"; }
  if (w.player) runCommands(w, w.player, input.commands);
  const frozen = w.phase === "countdown";
  for (const b of w.ents) {
    b.reveal -= dt; b.sinceHurt += dt; b.sinceShot += dt; b.cool -= dt; b.pickCool -= dt; b.shieldT -= dt; b.turboT -= dt;
    if (!b.alive) { b.respawn -= dt; if (b.respawn <= 0) respawnBrawler(w, b); continue; }
    if (b.ammo < b.T.ammo) b.ammo = Math.min(b.T.ammo, b.ammo + dt / b.T.reload);
    // Super lädt durch Treffer (siehe damage) und zusätzlich mit der Zeit
    if (w.phase === "match" && b.superC < 1) b.superC = Math.min(1, b.superC + dt / SUPER_CHARGE_TIME);
    if (b.sinceHurt > 1.5 && b.sinceShot > 1.5 && b.hp < b.T.hp) b.hp = Math.min(b.T.hp, b.hp + b.T.hp * 0.25 * dt);
    b.bush = bushAt(w.map, b.x, b.y);
    if (frozen || b.dummy) { b.vx = b.vy = 0; continue; }
    if (b.dash) {
      const d = b.dash, ox = b.x, oy = b.y;
      d.t -= dt;
      b.x += d.vx * dt; b.y += d.vy * dt; collide(w.map, b); b.vx = (b.x - ox) / dt; b.vy = (b.y - oy) / dt;
      for (const e of w.ents) if (e.alive && e.team !== b.team && !d.hit.has(e) && hyp(e.x - b.x, e.y - b.y) < e.r + b.r + 6) { d.hit.add(e); damage(w, e, d.dmg, b, true); }
      if (w.rng() < 0.7) w.fx.push(ring(b.x, b.y, 10, 2, 0.3, teamColor(b.team)));
      if (d.t <= 0) b.dash = null;
      continue;
    }
    if (b.isPlayer) playerUpdate(w, b, input, dt); else brain(w, b, dt);
  }
  // Figuren auseinanderschieben
  for (let i = 0; i < w.ents.length; i++) for (let j = i + 1; j < w.ents.length; j++) {
    const a = w.ents[i], b = w.ents[j];
    if (!a.alive || !b.alive) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy), m = a.r + b.r;
    if (d > 0.01 && d < m) {
      const p = (m - d) / 2, nx = dx / d, ny = dy / d;
      if (!a.dummy) { a.x -= nx * p; a.y -= ny * p; collide(w.map, a); }
      if (!b.dummy) { b.x += nx * p; b.y += ny * p; collide(w.map, b); }
    }
  }
  for (let i = w.projs.length - 1; i >= 0; i--) {
    const p = w.projs[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.trav += p.spd * dt;
    let dead = p.trav >= p.range || p.x < 0 || p.y < 0 || p.x > W || p.y > H;
    if (!dead) for (const wl of w.map.walls) if (inRect(p.x, p.y, wl)) { dead = true; w.fx.push(ring(p.x, p.y, 3, 16, 0.18, "#ffffff")); break; }
    if (!dead) for (const e of w.ents) {
      if (!e.alive || e.team === p.team || p.hit.has(e)) continue;
      if (hyp(e.x - p.x, e.y - p.y) < e.r + p.rad) { damage(w, e, p.dmg, p.owner, p.sup); p.hit.add(e); if (!p.pierce) { dead = true; break; } }
    }
    if (dead) w.projs.splice(i, 1);
  }
  for (let i = w.lobs.length - 1; i >= 0; i--) {
    const l = w.lobs[i];
    l.t += dt;
    if (l.t >= l.dur) {
      for (const e of w.ents) if (e.alive && e.team !== l.team && hyp(e.x - l.x1, e.y - l.y1) < l.radius + e.r * 0.5) damage(w, e, l.dmg, l.owner, l.sup);
      w.fx.push(ring(l.x1, l.y1, 10, l.radius, 0.35, teamColor(l.team)));
      w.lobs.splice(i, 1);
    }
  }
  if (w.phase === "match") updateBall(w, dt);
  if (w.phase === "match") {
    w.timeLeft -= dt;
    if (w.timeLeft <= 0) { w.timeLeft = 0; w.phase = "ending"; w.endWait = 1.2; }
  }
  if (w.phase === "ending") {
    w.endWait -= dt;
    if (w.endWait <= 0) { w.phase = "end"; w.events.push({ type: "matchEnd", result: matchResult(w) }); }
  }
  if (w.phase === "tutorial") tutorialUpdate(w, dt);
}
