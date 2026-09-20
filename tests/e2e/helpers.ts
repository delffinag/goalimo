import { expect, type Locator, type Page } from "@playwright/test";
import type { Game } from "../../src/game";

declare global { interface Window { __game: Game } }

/**
 * Spielstand vorbelegen (Schlüssel wie in src/meta/progress.ts) und die Seite damit laden.
 * `?debug` macht die Spielwelt erreichbar, `params` hängt weitere Testparameter an (z. B. `&spielzeit=4`).
 */
export async function start(page: Page, saved: Record<string, string> = {}, params = ""): Promise<void> {
  await page.goto(`./?debug${params}`);
  await page.evaluate(data => { localStorage.clear(); for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); }, saved);
  await page.reload();
}

/** Spieler mit Namen, Übungsrunde bereits erledigt */
export const PLAYER = { "gl-name": "Testi", "gl-uebung": "1" };

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
  await page.waitForFunction(p => window.__game.world.phase === p, phase, { timeout: 20_000 });
}

/** Stellt den Spieler mit Ball vor das gegnerische Tor und alle anderen weit weg. Der Schuss selbst kommt danach per Tippen. */
export async function ballInFrontOfGoal(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window.__game.world, p = w.player!;
    for (const e of w.ents) if (e !== p) { e.x = 300 + e.slot * 60; e.y = 1040; }
    p.x = 1580; p.y = 550; p.cool = 0;
    Object.assign(w.ball, { carrier: p, last: p, passer: null, x: p.x, y: p.y, vx: 0, vy: 0 });
  });
}

/** Ein Tor für den Spieler: Ball vors Tor legen und tippen (tippen zielt automatisch aufs Tor) */
export async function scoreGoal(page: Page): Promise<void> {
  await waitForPhase(page, "match");
  await ballInFrontOfGoal(page);
  await tapStage(page, 0.75, 0.5);
}

/** Rugby: den Spieler mit Ball ins gegnerische Malfeld stellen. Der nächste Tick zählt den Versuch. */
export async function carryOverLine(page: Page): Promise<void> {
  await waitForPhase(page, "match");
  await page.evaluate(() => {
    const w = window.__game.world, p = w.player!;
    for (const e of w.ents) if (e !== p) { e.x = 300 + e.slot * 60; e.y = 1040; }
    p.x = 1700; p.y = 550;
    Object.assign(w.ball, { carrier: p, last: p, passer: null, x: p.x, y: p.y, vx: 0, vy: 0 });
  });
}

/** Bis zum Sieg spielen: Sieg gibt es bei 3 Toren */
export async function winMatch(page: Page, goals = 3, how: "kick" | "carry" = "kick"): Promise<void> {
  for (let i = 1; i <= goals; i++) {
    if (how === "carry") await carryOverLine(page); else await scoreGoal(page);
    await page.waitForFunction(n => window.__game.world.score[0] >= n, i, { timeout: 15_000 });
  }
}

export async function expectLobby(page: Page): Promise<void> {
  await expect(page.locator("#lobby")).toBeVisible();
  await expect(page.locator("#lobbyPlay")).toBeVisible();
}
