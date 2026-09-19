import type { Command, PlayerInput } from "../sim/tick";
import type { Stage } from "../ui/stage";

export const STICK_R = 60;
/** Unterhalb dieser Strecke zählt eine Berührung als Tippen (automatisch zielen), darüber als Ziehen (selbst zielen) */
export const TAP_DIST = 16;

export interface MoveStick { id: number | null; ox: number; oy: number; vx: number; vy: number }
export interface AimStick { id: number | null; ox: number; oy: number; dx: number; dy: number; active: boolean }

export interface Input {
  move: MoveStick;
  aim: AimStick;
  /** Super-Knopf: tippen = automatisch, ziehen = zielen */
  supAim: AimStick;
  /** Eingabe für den nächsten Tick abholen. Befehle werden dabei geleert. */
  poll(): PlayerInput;
  reset(): void;
}

const hyp = Math.hypot;
const newAim = (): AimStick => ({ id: null, ox: 0, oy: 0, dx: 0, dy: 0, active: false });

export function createInput(canvas: HTMLCanvasElement, superBtn: HTMLElement, stage: Stage,
  screenToWorld: (x: number, y: number) => { x: number; y: number }): Input {
  const move: MoveStick = { id: null, ox: 0, oy: 0, vx: 0, vy: 0 };
  const aim = newAim(), supAim = newAim();
  const keys: Record<string, boolean> = {};
  let commands: Command[] = [];

  const release = (a: AimStick, kind: "attack" | "super", cancel: boolean) => {
    const l = hyp(a.dx, a.dy);
    if (!cancel) commands.push(l < TAP_DIST ? { kind, auto: true } : { kind, auto: false, ang: Math.atan2(a.dy, a.dx), d01: Math.min(1, l / STICK_R) });
    Object.assign(a, newAim());
  };

  // Linke Bildschirmhälfte: laufen. Rechte Hälfte: schießen.
  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    const P = stage.toLocal(e);
    if (e.pointerType === "mouse") {
      if (e.button === 0) commands.push({ kind: "attackAt", ...screenToWorld(P.x, P.y) });
      return;
    }
    if (P.x < stage.cw * 0.5) { if (move.id === null) Object.assign(move, { id: e.pointerId, ox: P.x, oy: P.y, vx: 0, vy: 0 }); }
    else if (aim.id === null) Object.assign(aim, { id: e.pointerId, ox: P.x, oy: P.y, dx: 0, dy: 0, active: true });
  }, { passive: false });
  canvas.addEventListener("pointermove", e => {
    const P = stage.toLocal(e);
    if (e.pointerId === move.id) {
      let dx = P.x - move.ox, dy = P.y - move.oy;
      const l = hyp(dx, dy);
      // Der Stick wandert mit, wenn der Finger weiter zieht als sein Radius
      if (l > STICK_R) { move.ox = P.x - dx / l * STICK_R; move.oy = P.y - dy / l * STICK_R; dx = dx / l * STICK_R; dy = dy / l * STICK_R; }
      move.vx = dx / STICK_R; move.vy = dy / STICK_R;
    } else if (e.pointerId === aim.id) { aim.dx = P.x - aim.ox; aim.dy = P.y - aim.oy; }
  });
  const endPointer = (e: PointerEvent, cancel: boolean) => {
    if (e.pointerId === move.id) { move.id = null; move.vx = move.vy = 0; }
    else if (e.pointerId === aim.id) release(aim, "attack", cancel);
  };
  canvas.addEventListener("pointerup", e => endPointer(e, false));
  canvas.addEventListener("pointercancel", e => endPointer(e, true));

  superBtn.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (supAim.id !== null) return;
    const P = stage.toLocal(e);
    Object.assign(supAim, { id: e.pointerId, ox: P.x, oy: P.y, dx: 0, dy: 0, active: true });
    try { superBtn.setPointerCapture(e.pointerId); } catch { /* Zeiger schon weg */ }
  });
  superBtn.addEventListener("pointermove", e => {
    if (e.pointerId !== supAim.id) return;
    const P = stage.toLocal(e);
    supAim.dx = P.x - supAim.ox; supAim.dy = P.y - supAim.oy;
  });
  const endSup = (e: PointerEvent, cancel: boolean) => { if (e.pointerId === supAim.id) release(supAim, "super", cancel); };
  superBtn.addEventListener("pointerup", e => endSup(e, false));
  superBtn.addEventListener("pointercancel", e => endSup(e, true));

  // Tastatur: WASD oder Pfeile laufen, Leertaste löst das Super aus
  addEventListener("keydown", e => {
    if (e.target instanceof HTMLElement && e.target.tagName === "INPUT") return;
    keys[e.code] = true;
    if (e.code === "Space") { e.preventDefault(); if (!e.repeat) commands.push({ kind: "super", auto: true }); }
  });
  addEventListener("keyup", e => { keys[e.code] = false; });
  addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

  return {
    move, aim, supAim,
    poll() {
      let mx = 0, my = 0;
      if (move.id !== null) { mx = move.vx; my = move.vy; }
      if (keys.KeyW || keys.ArrowUp) my -= 1;
      if (keys.KeyS || keys.ArrowDown) my += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1;
      if (keys.KeyD || keys.ArrowRight) mx += 1;
      const out: PlayerInput = { mx, my, aim: aim.active && hyp(aim.dx, aim.dy) >= TAP_DIST ? Math.atan2(aim.dy, aim.dx) : null, commands };
      commands = [];
      return out;
    },
    reset() {
      commands = [];
      move.id = null; move.vx = move.vy = 0;
      Object.assign(aim, newAim()); Object.assign(supAim, newAim());
    }
  };
}
