import { expect, type Locator, type Page } from "@playwright/test";
import type { Game } from "../../src/game";

declare global { interface Window { __game: Game } }

/** Spielstand vorbelegen (Schlüssel wie in src/meta/progress.ts) und die Seite damit laden. `?debug` macht die Spielwelt erreichbar. */
export async function start(page: Page, saved: Record<string, string> = {}): Promise<void> {
  await page.goto("./?debug");
  await page.evaluate(data => { localStorage.clear(); for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); }, saved);
  await page.reload();
}

export const PLAYER = { "fgf-player": "Testi", "fgf-tut": "1" };

const isRotated = (page: Page) => { const v = page.viewportSize()!; return v.height > v.width; };

/** Tippt auf einen Punkt der Bühne in logischen Querformat-Koordinaten (0–1), auch in der gedrehten Ansicht */
export async function tapStage(page: Page, fx: number, fy: number): Promise<void> {
  const v = page.viewportSize()!;
  if (isRotated(page)) await page.touchscreen.tap(v.width * (1 - fy), v.height * fx);
  else await page.touchscreen.tap(v.width * fx, v.height * fy);
}

/** Mittelpunkt eines Elements in logischen Querformat-Koordinaten (0–1) */
export async function stagePos(page: Page, el: Locator): Promise<{ x: number; y: number }> {
  const b = (await el.boundingBox())!, v = page.viewportSize()!;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  return isRotated(page) ? { x: cy / v.height, y: 1 - cx / v.width } : { x: cx / v.width, y: cy / v.height };
}

export async function waitForPhase(page: Page, phase: string): Promise<void> {
  await page.waitForFunction(p => window.__game.world.phase === p, phase, { timeout: 15_000 });
}

/** Stellt den Spieler mit Ball vor das gegnerische Tor und alle anderen weit weg. Der Schuss selbst kommt danach per Tippen. */
export async function ballInFrontOfGoal(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window.__game.world, p = w.player!;
    for (const e of w.ents) if (e !== p) { e.x = 300 + e.slot * 60; e.y = 1040; }
    p.x = 1580; p.y = 550; p.cool = 0;
    Object.assign(w.ball, { carrier: p, last: p, x: p.x, y: p.y, vx: 0, vy: 0 });
  });
}

export async function scoreGoal(page: Page): Promise<void> {
  await waitForPhase(page, "match");
  await ballInFrontOfGoal(page);
  await tapStage(page, 0.75, 0.5);
}

export async function expectLobby(page: Page): Promise<void> {
  await expect(page.locator("#lobby")).toBeVisible();
  await expect(page.locator("#lobbyPlay")).toBeVisible();
}
