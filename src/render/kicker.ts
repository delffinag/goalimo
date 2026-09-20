import { FIRE, FIRE_D, ICE, ICE_D } from "../data/colors";
import { clamp } from "../sim/math";
import type { Brawler } from "../sim/world";
import { circle, DISPLAY_FONT, roundRect, type Ctx } from "./draw";

function drawWeapon(ctx: Ctx, b: Brawler): void {
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.aim);
  ctx.fillStyle = "#3a3a44";
  const gun = b.T.gun, r = b.r;
  if (gun === "shotgun") { roundRect(ctx, r - 8, -8, 22, 16, 4); ctx.fill(); }
  else if (gun === "pistol") { roundRect(ctx, r - 6, -5, 20, 10, 3); ctx.fill(); }
  else if (gun === "rifle") { roundRect(ctx, r - 8, -4, 34, 8, 3); ctx.fill(); circle(ctx, r + 4, -7, 4); ctx.fill(); }
  else if (gun === "twin") { roundRect(ctx, r - 6, -9, 18, 6, 2); ctx.fill(); roundRect(ctx, r - 6, 3, 18, 6, 2); ctx.fill(); }
  else if (gun === "orb") { circle(ctx, r + 6, 0, 9); ctx.fillStyle = "#57d96e"; ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(r + 4, -6, 4, 12); ctx.fillRect(r, -2, 12, 4); }
  else { circle(ctx, r + 4, 0, 10); ctx.fill(); ctx.fillStyle = "#ffc83d"; ctx.fillRect(r + 2, -14, 4, 6); }
  ctx.restore();
}

/** Zubehör 0–5: Gürtel, Hörner, Antenne, Kappe, Stacheln, Ohren */
function drawAccessory(ctx: Ctx, b: Brawler, crowned: boolean): void {
  const [a, c] = b.T.look, x = b.x, y = b.y, r = b.r;
  ctx.fillStyle = c; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
  if (a === 0) { ctx.fillRect(x - r + 4, y + 6, (r - 4) * 2, 6); return; }
  if (crowned) return;
  if (a === 1) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 7, y - r + 5); ctx.lineTo(x + s * 17, y - r - 12); ctx.lineTo(x + s * 16, y - r + 9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (a === 2) { ctx.beginPath(); ctx.moveTo(x, y - r + 2); ctx.lineTo(x + 4, y - r - 13); ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 3; ctx.stroke(); circle(ctx, x + 4, y - r - 15, 5); ctx.fill(); }
  else if (a === 3) { ctx.beginPath(); ctx.arc(x, y - r + 11, r - 7, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 2, y - r + 9, r - 2, 4); }
  else if (a === 4) { ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * 6 - 4, y - r + 5); ctx.lineTo(x + i * 6, y - r - 9); ctx.lineTo(x + i * 6 + 4, y - r + 5); } ctx.fill(); }
  else if (a === 5) for (const s of [-1, 1]) { circle(ctx, x + s * 15, y - r + 5, 7); ctx.fill(); ctx.stroke(); }
}

export function drawBrawler(ctx: Ctx, b: Brawler): void {
  const col = b.team ? ICE : FIRE, dark = b.team ? ICE_D : FIRE_D;
  const hiddenOwn = b.team === 0 && b.bush >= 0;
  ctx.globalAlpha = hiddenOwn ? 0.6 : 1;
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r * 0.8, b.r, b.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  if (b.dummy) {
    // Zielscheibe im Tutorial
    for (const [r, c] of [[26, "#d93b3b"], [18, "#ffffff"], [10, "#d93b3b"]] as const) { circle(ctx, b.x, b.y, r); ctx.fillStyle = c; ctx.fill(); }
    ctx.globalAlpha = 1; return;
  }
  if (b.isPlayer) { ctx.strokeStyle = "#ffc83d"; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r * 0.8, b.r + 8, b.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); }
  drawWeapon(ctx, b);
  const goldRim = !!b.cosmetics?.gold, crowned = !!b.cosmetics?.krone;
  circle(ctx, b.x, b.y, b.r); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = goldRim ? 5 : 4; ctx.strokeStyle = goldRim ? "#ffd23f" : dark; ctx.stroke();
  if (goldRim) { circle(ctx, b.x, b.y, b.r + 5); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,210,63,.55)"; ctx.stroke(); }
  drawAccessory(ctx, b, crowned);
  if (b.shieldT > 0) { circle(ctx, b.x, b.y, b.r + 9); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(128,216,255,.85)"; ctx.stroke(); }
  if (b.turboT > 0) { circle(ctx, b.x, b.y, b.r + 7); ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.strokeStyle = "#ffc83d"; ctx.stroke(); ctx.setLineDash([]); }
  const ca = Math.cos(b.aim), sa = Math.sin(b.aim);
  for (const s of [-1, 1]) {
    const ex = b.x + ca * 8 - sa * 8 * s, ey = b.y + sa * 8 + ca * 8 * s - 4;
    circle(ctx, ex, ey, 6); ctx.fillStyle = "#fff"; ctx.fill();
    circle(ctx, ex + ca * 2.5, ey + sa * 2.5, 3); ctx.fillStyle = "#1c1c22"; ctx.fill();
  }
  if (crowned) {
    const cx = b.x, cy = b.y - b.r + 3;
    ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 14, cy - 12); ctx.lineTo(cx - 7, cy - 6); ctx.lineTo(cx, cy - 16);
    ctx.lineTo(cx + 7, cy - 6); ctx.lineTo(cx + 14, cy - 12); ctx.lineTo(cx + 14, cy); ctx.closePath();
    ctx.fillStyle = "#ffc83d"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#a86b00"; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Lebensbalken, Munition (nur Spieler), Name und Lebenspunkte über der Figur */
export function drawBars(ctx: Ctx, b: Brawler): void {
  const w = 58, x = b.x - w / 2, y = b.y - b.r - 22;
  ctx.fillStyle = "rgba(0,0,0,.55)"; roundRect(ctx, x - 2, y - 2, w + 4, 11, 4); ctx.fill();
  ctx.fillStyle = b.dummy ? "#eeeeee" : b.team === 0 ? "#57d96e" : "#ff4d4d";
  roundRect(ctx, x, y, Math.max(0, w * b.hp / b.T.hp), 7, 3); ctx.fill();
  if (b.isPlayer) {
    const sw = (w - 4) / 3;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x + i * (sw + 2), y + 12, sw, 5);
      ctx.fillStyle = "#ffb000"; ctx.fillRect(x + i * (sw + 2), y + 12, sw * clamp(b.ammo - i, 0, 1), 5);
    }
  }
  if (b.dummy) return;
  ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.font = `16px ${DISPLAY_FONT}`;
  ctx.strokeText(b.name, b.x, y - 24);
  ctx.fillStyle = b.isPlayer ? "#ffc83d" : b.team === 0 ? "#ffffff" : "#cdeeff"; ctx.fillText(b.name, b.x, y - 24);
  const hp = String(Math.ceil(b.hp));
  ctx.font = `15px ${DISPLAY_FONT}`;
  ctx.strokeText(hp, b.x, y - 5);
  ctx.fillStyle = "#fff"; ctx.fillText(hp, b.x, y - 5);
}
