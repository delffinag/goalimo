import { expect, test } from "@playwright/test";
import { expectLobby, PLAYER, scoreGoal, stagePos, start, waitForPhase } from "./helpers";

// Kein Test darf einen Skriptfehler auf der Seite hinterlassen
let pageErrors: string[] = [];
test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message));
});
test.afterEach(() => { expect(pageErrors).toEqual([]); });

test("Namenseingabe: einmalig beim ersten Start, danach fest", async ({ page }) => {
  await start(page);
  await expect(page.locator("#welcome")).toBeVisible();
  await expect(page.locator("#lobby")).toBeHidden();

  const name = page.locator("#welcomeName"), go = page.locator("#welcomeGo");
  await name.fill("A");
  await expect(go).toBeDisabled();
  await name.fill("Ein viel zu langer Name");
  await expect(name).toHaveValue("Ein viel zu "); // höchstens 12 Zeichen
  await name.fill("Frederik");
  await go.click();

  await expectLobby(page);
  await expect(page.locator("#pName")).toHaveText("Frederik");

  await page.reload();
  await expectLobby(page);
  await expect(page.locator("#welcome")).toBeHidden();
  await expect(page.locator("#pName")).toHaveText("Frederik");
});

test("Lobby: Name oben links, Währungen oben rechts, Figuren links, Spielen in der Mitte", async ({ page }) => {
  await start(page, { ...PLAYER, "fgf-coins": "12", "fgf-pp": "7", "fgf-gems": "3" });
  await expectLobby(page);
  const name = await stagePos(page, page.locator(".namePill")), money = await stagePos(page, page.locator(".curPill"));
  const figures = await stagePos(page, page.locator("#lobbySetup")), play = await stagePos(page, page.locator("#lobbyPlay"));
  expect(name.x).toBeLessThan(0.3); expect(name.y).toBeLessThan(0.3);
  expect(money.x).toBeGreaterThan(0.7); expect(money.y).toBeLessThan(0.3);
  expect(figures.x).toBeLessThan(0.25); expect(Math.abs(figures.y - 0.5)).toBeLessThan(0.1);
  expect(Math.abs(play.x - 0.5)).toBeLessThan(0.05);
  await expect(page.locator("#coinCount")).toHaveText("12");
  await expect(page.locator("#ppCount")).toHaveText("7");
  await expect(page.locator("#gemCount")).toHaveText("3");
  await expect(page.locator("#lobbyBox")).toBeHidden();
});

test("Figur wählen: Auswahl gilt in der Lobby und nach dem Neuladen", async ({ page }) => {
  await start(page, PLAYER);
  await expect(page.locator("#lobbyInfo")).toHaveText("Rumpel, Nahkämpfer");
  await page.locator("#lobbySetup").click();
  await expect(page.locator(".tile")).toHaveCount(3);
  await expect(page.locator('.tile[data-k="brecher"]')).toHaveAttribute("aria-pressed", "true");

  // Früherer Fehler: eine globale canvas-Regel hat alle Figurenbilder bildschirmfüllend gemacht
  const stage = (await page.locator("#stage").boundingBox())!;
  for (const cv of await page.locator(".tile .cv").all()) {
    await expect(cv).not.toHaveCSS("position", "fixed");
    const b = (await cv.boundingBox())!;
    expect(b.width * b.height).toBeLessThan(stage.width * stage.height / 6);
  }

  await page.locator('.tile[data-k="flitzer"]').click();
  await expect(page.locator("#detName")).toHaveText("Zisch");
  await expect(page.locator("#detRole")).toHaveText("Flitzer. Stärke: Am schnellsten");
  await page.locator("#detPick").click();
  await expect(page.locator('.tile[data-k="flitzer"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("#menuBack").click();
  await expect(page.locator("#lobbyInfo")).toHaveText("Zisch, Flitzer");

  await page.reload();
  await expect(page.locator("#lobbyInfo")).toHaveText("Zisch, Flitzer");
});

test("Match starten: erst Tutorial, dann Anstoß mit 2:30 auf der Uhr", async ({ page }) => {
  await start(page, { "fgf-player": "Testi" });
  await page.locator("#lobbyPlay").click();
  await expect(page.locator("#lobby")).toBeHidden();
  await expect(page.locator("#tut")).toContainText("Zieh links auf dem Bildschirm");
  await expect(page.locator("#hud")).toBeHidden();

  await page.locator("#skip").click();
  await expect(page.locator("#hud")).toBeVisible();
  await expect(page.locator("#timer")).toHaveText("2:30");
  await expect(page.locator("#sf")).toHaveText("⚽ 0");
  await expect(page.locator("#banner")).toHaveText(/^[123]$/);
  await expect(page.locator("#superBtn")).toBeVisible();

  await waitForPhase(page, "match");
  await expect(page.locator("#timer")).not.toHaveText("2:30");
  const world = await page.evaluate(() => { const w = window.__game.world; return { ents: w.ents.length, teams: w.ents.map(e => e.team), name: w.player!.name }; });
  expect(world).toEqual({ ents: 6, teams: [0, 0, 0, 1, 1, 1], name: "Testi" });

  // Das Tutorial kommt nur beim allerersten Mal
  expect(await page.evaluate(() => localStorage.getItem("fgf-tut"))).toBe("1");
});

test("Tor fällt, Sieg bei 2 Toren, Box öffnen", async ({ page }) => {
  await start(page, PLAYER);
  await page.locator("#lobbyPlay").click();

  await scoreGoal(page);
  await expect(page.locator("#banner")).toHaveText("Testi scored a goal");
  await expect(page.locator("#sf")).toHaveText("⚽ 1");
  await expect(page.locator("#si")).toHaveText("⚽ 0");

  await scoreGoal(page);
  await expect(page.locator("#end")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#endTitle")).toHaveText("Sieg!");
  await expect(page.locator("#endScore")).toContainText("2 : 0");
  await expect(page.locator("#endGems")).toHaveText("Du hast eine Box gewonnen! Rumpel: +8 Figuren-Juwelen (jetzt 8).");

  await page.locator("#endBox").click();
  await expect(page.locator("#boxHint")).toHaveText("Tippe auf die Box. Sie enthält 3 Objekte.");
  for (let i = 1; i <= 3; i++) {
    await page.locator("#boxBtn").click();
    await expect(page.locator("#loot .item .coin, #loot .item .pp, #loot .item .gem")).toHaveCount(i);
  }
  await expect(page.locator("#boxHint")).toHaveText("Die Box ist leer.");
  await expect(page.locator("#boxBtn")).toBeHidden();

  // Was in der Box war, steht danach in der Lobby
  const loot = await page.locator("#loot .item").allTextContents();
  const sum = (label: string) => loot.filter(t => t.endsWith(label)).reduce((n, t) => n + parseInt(t.slice(1), 10), 0);
  await page.locator("#boxDone").click();
  await expect(page.locator("#endBox")).toBeHidden();
  await page.locator("#toMenu").click();
  await expectLobby(page);
  await expect(page.locator("#coinCount")).toHaveText(String(sum("Münzen")));
  await expect(page.locator("#ppCount")).toHaveText(String(sum("Powerpunkte")));
  await expect(page.locator("#gemCount")).toHaveText(String(sum("Juwelen")));
  await expect(page.locator("#lobbyBox")).toBeHidden();
});

test("Aufwerten: kostet 50 Münzen + 20 Powerpunkte und gibt +8 % Leben", async ({ page }) => {
  await start(page, { ...PLAYER, "fgf-coins": "60", "fgf-pp": "25" });
  await page.locator("#lobbySetup").click();
  await page.locator('.tile[data-k="brecher"]').click();
  await expect(page.locator("#detLvl")).toContainText("Power-Level 1 von 5");
  await expect(page.locator("#detStats")).toContainText("Leben 8000");
  const up = page.locator("#detUp");
  await expect(up).toHaveText("Verbessern: 50 Münzen + 20 Powerpunkte");
  await up.click();

  await expect(page.locator("#detLvl")).toContainText("Power-Level 2 von 5");
  await expect(page.locator("#detStats")).toContainText("Leben 8640");
  await expect(up).toHaveText("Verbessern: 100 Münzen + 40 Powerpunkte");
  await expect(up).toBeDisabled();
  await expect(page.locator('.tile[data-k="brecher"] .tlvl')).toHaveText("2");

  await page.locator("#detClose").click();
  await page.locator("#menuBack").click();
  await expect(page.locator("#coinCount")).toHaveText("10");
  await expect(page.locator("#ppCount")).toHaveText("5");
});

test("PWA: Manifest stimmt und das Spiel startet offline", async ({ page, context }) => {
  await start(page, PLAYER);
  const manifest = await (await page.request.get("./manifest.webmanifest")).json();
  expect(manifest.display).toBe("fullscreen");
  expect(manifest.orientation).toBe("landscape");

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expectLobby(page);
  await expect(page.locator("#pName")).toHaveText("Testi");
  expect(await page.evaluate(() => document.fonts.check("20px 'Lilita One'"))).toBe(true);
});
