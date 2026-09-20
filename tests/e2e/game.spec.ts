import { expect, test } from "@playwright/test";
import { ballInFrontOfGoal, carryOverLine, expectLobby, PLAYER, scoreGoal, stagePos, start, tapStage, waitForPhase, winMatch } from "./helpers";

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

test("Lobby: Name oben links, Währungen oben rechts, Figuren links, Spielmodus unten links, Spielen unten rechts", async ({ page }) => {
  await start(page, { ...PLAYER, "gl-taler": "12", "gl-training": "7", "gl-kristalle": "3" });
  await expectLobby(page);
  const name = await stagePos(page, page.locator(".namePill")), money = await stagePos(page, page.locator(".curPill"));
  const figures = await stagePos(page, page.locator("#lobbySetup")), play = await stagePos(page, page.locator("#lobbyPlay"));
  const mode = await stagePos(page, page.locator("#modePick"));
  expect(name.x).toBeLessThan(0.3); expect(name.y).toBeLessThan(0.3);
  expect(money.x).toBeGreaterThan(0.7); expect(money.y).toBeLessThan(0.3);
  expect(figures.x).toBeLessThan(0.25); expect(Math.abs(figures.y - 0.5)).toBeLessThan(0.1);
  // „Spielen“ unten rechts, Spielmodus unten links
  expect(play.x).toBeGreaterThan(0.7); expect(play.y).toBeGreaterThan(0.7);
  expect(mode.x).toBeLessThan(0.3); expect(mode.y).toBeGreaterThan(0.7);
  await expect(page.locator("#talerCount")).toHaveText("12");
  await expect(page.locator("#trainingCount")).toHaveText("7");
  await expect(page.locator("#kristallCount")).toHaveText("3");
  await expect(page.locator("#lobbyPraemie")).toBeHidden();
});

test("Alter Spielstand wird übernommen", async ({ page }) => {
  // compliance-ok: alte Speicher-Schlüssel, nur zum Prüfen der Migration
  await start(page, { "fgf-player": "Alti", "fgf-coins": "77", "fgf-pp": "8", "fgf-gems": "4", "fgf-chosen": "flitzer" });
  await expectLobby(page);
  await expect(page.locator("#pName")).toHaveText("Alti");
  await expect(page.locator("#talerCount")).toHaveText("77");
  await expect(page.locator("#trainingCount")).toHaveText("8");
  await expect(page.locator("#kristallCount")).toHaveText("4");
  await expect(page.locator("#lobbyInfo")).toHaveText("Zisch, Flitzer");
});

test("Figurenkarte: Farbband, Medaillon, Name, Stärke, Sterne und EP, Häkchen bei der Auswahl", async ({ page }) => {
  await start(page, { ...PLAYER, "gl-erfahrung": '{"brecher":25}' });
  await expect(page.locator("#lobbyInfo")).toHaveText("Rumpel, Nahkämpfer");
  await page.locator("#lobbySetup").click();
  await expect(page.locator(".tile")).toHaveCount(3);

  const card = page.locator('.tile[data-k="brecher"]');
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(".tband")).toBeVisible();
  await expect(card.locator(".tmedal .cv")).toBeVisible();
  await expect(card.locator(".tname")).toHaveText("Rumpel");
  await expect(card.locator(".tstr")).toHaveText("Hält am meisten aus");
  await expect(card.locator(".tstars i")).toHaveCount(5);
  await expect(card.locator(".tstars i.on")).toHaveCount(1);
  await expect(card.locator(".tep")).toHaveText("25 EP");
  // Häkchen nur bei der gewählten Figur
  await expect(card.locator(".tcheck")).toBeVisible();
  await expect(page.locator('.tile[data-k="flitzer"] .tcheck')).toBeHidden();

  // Früherer Fehler: eine globale canvas-Regel hat alle Figurenbilder bildschirmfüllend gemacht
  const stage = (await page.locator("#stage").boundingBox())!;
  for (const cv of await page.locator(".tile .cv").all()) {
    await expect(cv).not.toHaveCSS("position", "fixed");
    const b = (await cv.boundingBox())!;
    expect(b.width * b.height).toBeLessThan(stage.width * stage.height / 6);
  }

  await page.locator('.tile[data-k="flitzer"]').click();
  await expect(page.locator("#detName")).toHaveText("Zisch");
  await page.locator("#detPick").click();
  await expect(page.locator('.tile[data-k="flitzer"] .tcheck')).toBeVisible();
  await page.locator("#menuBack").click();
  await expect(page.locator("#lobbyInfo")).toHaveText("Zisch, Flitzer");
  await page.reload();
  await expect(page.locator("#lobbyInfo")).toHaveText("Zisch, Flitzer");
});

test("Match starten: erst Übungsrunde, dann Anstoß mit 3:00 auf der Uhr", async ({ page }) => {
  await start(page, { "gl-name": "Testi" });
  await page.locator("#lobbyPlay").click();
  await expect(page.locator("#lobby")).toBeHidden();
  await expect(page.locator("#tut")).toContainText("Zieh links auf dem Bildschirm");
  await expect(page.locator("#hud")).toBeHidden();

  await page.locator("#skip").click();
  await expect(page.locator("#hud")).toBeVisible();
  await expect(page.locator("#timer")).toHaveText("3:00");
  await expect(page.locator("#sf")).toHaveText("⚽ 0");
  await expect(page.locator("#banner")).toHaveText(/^[123]$/);
  await expect(page.locator("#superBtn")).toBeVisible();

  await waitForPhase(page, "match");
  await expect(page.locator("#timer")).not.toHaveText("3:00");
  const world = await page.evaluate(() => { const w = window.__game.world; return { ents: w.ents.length, teams: w.ents.map(e => e.team), name: w.player!.name }; });
  expect(world).toEqual({ ents: 6, teams: [0, 0, 0, 1, 1, 1], name: "Testi" });

  // Die Übungsrunde kommt nur beim allerersten Mal
  expect(await page.evaluate(() => localStorage.getItem("gl-uebung"))).toBe("1");
});

test("Tor fällt und wird gemeldet, Sieg bei 3 Toren", async ({ page }) => {
  await start(page, PLAYER);
  await page.locator("#lobbyPlay").click();

  await scoreGoal(page);
  await expect(page.locator("#banner")).toHaveText("Testi scored a goal");
  await expect(page.locator("#sf")).toHaveText("⚽ 1");
  await expect(page.locator("#si")).toHaveText("⚽ 0");

  // Nach zwei Toren läuft das Match weiter, erst das dritte gewinnt
  await scoreGoal(page);
  await expect(page.locator("#sf")).toHaveText("⚽ 2");
  await expect(page.locator("#end")).toBeHidden();

  await scoreGoal(page);
  await expect(page.locator("#end")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#endTitle")).toHaveText("Sieg!");
  await expect(page.locator("#endScore")).toContainText("3 : 0");
  await expect(page.locator("#endInfo")).toHaveText("Du hast eine Siegprämie gewonnen! Rumpel: +10 EP (jetzt 10).");
});

test("Siegprämie: drei offene Angebote, genau eines wird gebucht, danach ist der Knopf weg", async ({ page }) => {
  await start(page, PLAYER);
  await page.locator("#lobbyPlay").click();
  await winMatch(page);
  await expect(page.locator("#end")).toBeVisible({ timeout: 10_000 });

  const praemie = page.locator("#endPraemie");
  await expect(praemie).toBeVisible();
  await praemie.click();

  const offers = page.locator(".offer");
  await expect(offers).toHaveCount(3);
  await expect(page.locator('.offer[data-k="taler"]')).toBeVisible();
  await expect(page.locator('.offer[data-k="training"]')).toBeVisible();
  await expect(page.locator('.offer[data-k="kristalle"]')).toBeVisible();

  // Die Mengen stehen offen da, nichts ist verdeckt
  const taler = Number(await page.locator('.offer[data-k="taler"] .n').textContent());
  expect(taler).toBeGreaterThanOrEqual(40);
  expect(taler).toBeLessThanOrEqual(60);

  await page.locator('.offer[data-k="taler"]').click();
  await expect(page.locator("#praemieResult")).toContainText(`+${taler} Taler`);
  // Nach der Wahl lässt sich kein zweites Angebot mehr buchen
  for (const kind of ["taler", "training", "kristalle"]) await expect(page.locator(`.offer[data-k="${kind}"]`)).toBeDisabled();

  await page.locator("#praemieDone").click();
  await expect(praemie).toBeHidden();
  await page.locator("#toMenu").click();
  await expectLobby(page);
  await expect(page.locator("#talerCount")).toHaveText(String(taler));
  await expect(page.locator("#trainingCount")).toHaveText("0");
  await expect(page.locator("#kristallCount")).toHaveText("0");
  await expect(page.locator("#lobbyPraemie")).toBeHidden();
});

test("Rugby: unten links wählbar, Punkt nur durch Tragen über die Linie", async ({ page }) => {
  await start(page, PLAYER);
  await expectLobby(page);
  const fussball = page.locator('.mbtn[data-m="fussball"]'), rugby = page.locator('.mbtn[data-m="rugby"]');
  await expect(fussball).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#lobbyDesc")).toContainText("ins gegnerische Tor");

  await rugby.click();
  await expect(rugby).toHaveAttribute("aria-pressed", "true");
  await expect(fussball).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#lobbyDesc")).toContainText("über die gegnerische Linie");

  // Die Wahl bleibt nach dem Neuladen bestehen
  await page.reload();
  await expect(page.locator('.mbtn[data-m="rugby"]')).toHaveAttribute("aria-pressed", "true");

  await page.locator("#lobbyPlay").click();
  await waitForPhase(page, "match");
  await expect(page.locator("#sf")).toHaveText("🏉 0");

  // Ein Ball, der nur im Malfeld liegt, zählt nicht
  await page.evaluate(() => {
    const w = window.__game.world, p = w.player!;
    for (const e of w.ents) { e.x = 300 + e.slot * 60; e.y = 1040; }
    p.x = 900; p.y = 1040;
    Object.assign(w.ball, { carrier: null, last: null, passer: null, x: 1700, y: 300, vx: 0, vy: 0 });
  });
  await page.waitForTimeout(700);
  await expect(page.locator("#sf")).toHaveText("🏉 0");

  // Getragen zählt er
  await carryOverLine(page);
  await expect(page.locator("#banner")).toHaveText("Testi scored a try");
  await expect(page.locator("#sf")).toHaveText("🏉 1");
});

test("Rugby: Sieg nach drei Versuchen, Spielstand nennt Versuche", async ({ page }) => {
  await start(page, { ...PLAYER, "gl-modus": "rugby" });
  await page.locator("#lobbyPlay").click();
  await winMatch(page, 3, "carry");
  await expect(page.locator("#end")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#endTitle")).toHaveText("Sieg!");
  await expect(page.locator("#endScore")).toContainText("3 : 0");
  await expect(page.locator("#endScore")).toContainText("Versuche");
});

test("Golden Goal: bei 0:0 nach Ablauf, das nächste Tor beendet das Spiel", async ({ page }) => {
  // Verkürzte Spielzeit als Testparameter, damit die Verlängerung schnell erreicht ist
  await start(page, PLAYER, "&spielzeit=4&goldengoal=30");
  await page.locator("#lobbyPlay").click();
  await waitForPhase(page, "match");

  // Ball und alle Figuren parken, damit in der kurzen Spielzeit kein Tor fällt
  await page.evaluate(() => {
    const w = window.__game.world;
    for (const e of w.ents) { e.x = 900; e.y = 1000; }
    Object.assign(w.ball, { carrier: null, last: null, passer: null, x: 900, y: 60, vx: 0, vy: 0 });
  });

  await page.waitForFunction(() => window.__game.world.golden, undefined, { timeout: 15_000 });
  await expect(page.locator("#banner")).toHaveText("Golden Goal!");
  await expect(page.locator("#timer")).toHaveClass(/golden/);
  expect(await page.evaluate(() => window.__game.world.score)).toEqual([0, 0]);

  await waitForPhase(page, "match");
  await ballInFrontOfGoal(page);
  await tapStage(page, 0.75, 0.5);

  await expect(page.locator("#end")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#endTitle")).toHaveText("Sieg!");
  await expect(page.locator("#endScore")).toContainText("1 : 0");
  await expect(page.locator("#endScore")).toContainText("Tore nach Verlängerung");
});

test("Pass-Bonus: ein Pass lädt den Super des Passgebers um 25 %", async ({ page }) => {
  await start(page, PLAYER);
  await page.locator("#lobbyPlay").click();
  await waitForPhase(page, "match");

  // Spieler mit Ball, ein Mitspieler genau auf der Linie zum Tor, alle anderen weit weg
  await page.evaluate(() => {
    const w = window.__game.world, p = w.player!, mate = w.ents[1];
    for (const e of w.ents) { e.x = 200; e.y = 1040; }
    p.x = 1000; p.y = 250; p.cool = 0; p.superC = 0;
    mate.x = 1168; mate.y = 315; mate.pickCool = 0;
    Object.assign(w.ball, { carrier: p, last: p, passer: null, x: p.x, y: p.y, vx: 0, vy: 0 });
  });

  // Tippen zielt automatisch aufs gegnerische Tor – der Mitspieler steht auf dieser Linie
  await tapStage(page, 0.75, 0.5);
  await page.waitForFunction(() => window.__game.world.ball.carrier === window.__game.world.ents[1], undefined, { timeout: 10_000 });

  const superC = await page.evaluate(() => window.__game.world.player!.superC);
  expect(superC).toBeGreaterThan(0.25);
  expect(superC).toBeLessThan(0.35);
});

test("Trainieren: Kosten werden abgezogen und die Sterne steigen", async ({ page }) => {
  await start(page, { ...PLAYER, "gl-taler": "60", "gl-training": "25" });
  await page.locator("#lobbySetup").click();
  const card = page.locator('.tile[data-k="brecher"]');
  await expect(card.locator(".tstars i.on")).toHaveCount(1);
  await card.click();

  await expect(page.locator("#detStufe")).toContainText("Trainingsstufe 1 von 5");
  await expect(page.locator("#detStats")).toContainText("Leben 8000");
  const train = page.locator("#detTrain");
  await expect(train).toHaveText("Trainieren: 50 Taler + 20 Trainingspunkte");
  await train.click();

  await expect(page.locator("#detStufe")).toContainText("Trainingsstufe 2 von 5");
  await expect(page.locator("#detStats")).toContainText("Leben 8640");
  await expect(train).toHaveText("Trainieren: 100 Taler + 40 Trainingspunkte");
  await expect(train).toBeDisabled();
  await expect(page.locator("#detStufe .stars i.on")).toHaveCount(2);

  await page.locator("#detClose").click();
  await expect(card.locator(".tstars i.on")).toHaveCount(2);
  await page.locator("#menuBack").click();
  await expect(page.locator("#talerCount")).toHaveText("10");
  await expect(page.locator("#trainingCount")).toHaveText("5");
});

test("Datenschutz: keine Anfrage an einen fremden Server, Schriften kommen aus dem Spiel", async ({ page, baseURL }) => {
  const fremd: string[] = [];
  page.on("request", r => { if (!r.url().startsWith(new URL(baseURL!).origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) fremd.push(r.url()); });

  await start(page, PLAYER);
  await expectLobby(page);
  await page.locator("#lobbySetup").click();
  await expect(page.locator(".tile")).toHaveCount(3);
  await page.locator("#menuBack").click();
  await page.locator("#lobbyPlay").click();
  await waitForPhase(page, "match");

  expect(fremd).toEqual([]);
  // Die Schriften liegen im Spiel selbst und sind geladen
  expect(await page.evaluate(() => document.fonts.check("600 20px Fredoka"))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check("800 16px Nunito"))).toBe(true);
  const font = await page.request.get("./fonts/fredoka-600.woff2");
  expect(font.ok()).toBe(true);
});

test("PWA: Manifest stimmt, Lizenzen liegen im Build und das Spiel startet offline", async ({ page, context }) => {
  await start(page, PLAYER);
  const manifest = await (await page.request.get("./manifest.webmanifest")).json();
  expect(manifest.display).toBe("fullscreen");
  expect(manifest.orientation).toBe("landscape");

  // Die Schriftlizenzen werden mit ausgeliefert
  for (const file of ["OFL-Fredoka.txt", "OFL-Nunito.txt"]) {
    const res = await page.request.get(`./licenses/${file}`);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain("SIL OPEN FONT LICENSE");
  }

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expectLobby(page);
  await expect(page.locator("#pName")).toHaveText("Testi");
  expect(await page.evaluate(() => document.fonts.check("600 20px Fredoka"))).toBe(true);
});
