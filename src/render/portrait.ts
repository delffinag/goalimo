import { FIGURE_KEYS, FIGURES } from "../data/figures";
import { clamp } from "../sim/math";

interface Portrait {
  shape: number; eyes: number; mouth: number; head: number; pattern: number; blush: boolean;
  body: string; acc: string; tilt: number;
}

// ---------- Porträts: jede Figur bekommt ein eigenes, festes Bild ----------
function seeded(str: string): () => number {
  let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const ACC_COLORS = ["#ffc83d", "#ff5a5a", "#3fb8f0", "#57d96e", "#b388ff", "#ff9f43", "#ffffff", "#2d2d33", "#f06292", "#00bfa5"];
const HEAD_BY_LOOK: Record<number, number[]> = { 0: [7, 0], 1: [1, 1], 2: [2, 8], 3: [3, 6, 9], 4: [4, 4], 5: [5, 5] };
const PORTRAITS: Record<string, Portrait> = {};
(function buildPortraits() {
  const used = new Set<string>();
  for (const k of FIGURE_KEYS) {
    const T = FIGURES[k];
    for (let attempt = 0; attempt < 50; attempt++) {
      const r = seeded(k + ":" + attempt), pick = (n: number) => Math.floor(r() * n);
      const heads = HEAD_BY_LOOK[T.look[0]] || [0];
      const p: Portrait = { shape: pick(5), eyes: pick(7), mouth: pick(6), head: heads[pick(heads.length)], pattern: pick(4), blush: r() < .45,
        body: T.look[1], acc: ACC_COLORS[pick(ACC_COLORS.length)], tilt: (r() - .5) * 0.12 };
      if (p.acc.toLowerCase() === p.body.toLowerCase()) p.acc = "#2d2d33";
      const sig = [p.shape, p.eyes, p.mouth, p.head, p.pattern].join("-");
      if (used.has(sig)) continue;
      used.add(sig); PORTRAITS[k] = p; break;
    }
  }
})();
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const f = (v: number) => Math.round(clamp(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt, 0, 255));
  return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
/** Zeichnet das feste Porträt der Figur `k` in die Größe, die der Canvas im Layout hat */
export function drawPortrait(c: HTMLCanvasElement, k: string): void {
    const p = PORTRAITS[k]; if (!p) return;
  const dp = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth || 160, h = c.clientHeight || 100;
  c.width = Math.round(w * dp); c.height = Math.round(h * dp);
  const g = c.getContext("2d")!, z = h / 138;
  g.setTransform(dp * z, 0, 0, dp * z, dp * w / 2, dp * (h / 2 + 12 * z)); g.clearRect(-w, -h, 2 * w / z, 2 * h / z);
  g.rotate(p.tilt);
  const R = 40, ink = "#1c1530";
  const O = (x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  const bodyPath = () => {
    g.beginPath();
    if (p.shape === 0) g.arc(0, 0, R, 0, Math.PI * 2);
    else if (p.shape === 1) { const r = 16; g.moveTo(-R + r, -R); g.arcTo(R, -R, R, R, r); g.arcTo(R, R, -R, R, r); g.arcTo(-R, R, -R, -R, r); g.arcTo(-R, -R, R, -R, r); g.closePath(); }
    else if (p.shape === 2) g.ellipse(0, 0, R * .84, R * 1.1, 0, 0, Math.PI * 2);
    else if (p.shape === 3) g.ellipse(0, 4, R * 1.18, R * .86, 0, 0, Math.PI * 2);
    else { g.moveTo(0, -R * 1.05); g.bezierCurveTo(R * .75, -R * 1.05, R * 1.2, R * .2, R * 1.05, R * .7); g.quadraticCurveTo(R * .9, R * 1.05, 0, R * 1.02);
      g.quadraticCurveTo(-R * .9, R * 1.05, -R * 1.05, R * .7); g.bezierCurveTo(-R * 1.2, R * .2, -R * .75, -R * 1.05, 0, -R * 1.05); g.closePath(); }
  };
  const top = p.shape === 2 ? -R * 1.1 : p.shape === 3 ? -R * .86 + 4 : p.shape === 4 ? -R * 1.05 : -R;
  // Schatten
  g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(0, R * 1.12, R * .95, 8, 0, 0, Math.PI * 2); g.fill();
  // Kopfschmuck hinten (Hörner, Ohren, Antenne)
  g.lineWidth = 3.5; g.strokeStyle = ink;
  if (p.head === 1) for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 4, top + 12); g.quadraticCurveTo(sx * 14, top - 10, sx * 32, top - 22); g.quadraticCurveTo(sx * 30, top + 2, sx * 26, top + 16); g.closePath(); g.fillStyle = "#f3e6cf"; g.fill(); g.stroke(); }
  if (p.head === 5) for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 10, top + 6); g.lineTo(sx * 30, top - 18); g.lineTo(sx * 32, top + 14); g.closePath(); g.fillStyle = p.body; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(sx * 16, top + 6); g.lineTo(sx * 28, top - 8); g.lineTo(sx * 28, top + 10); g.closePath(); g.fillStyle = "#f7a8c4"; g.fill(); }
  if (p.head === 2) { g.beginPath(); g.moveTo(0, top + 4); g.quadraticCurveTo(6, top - 14, 2, top - 24); g.stroke(); O(2, top - 27, 6); g.fillStyle = p.acc; g.fill(); g.stroke(); }
  if (p.head === 8) { g.beginPath(); g.moveTo(0, top + 4); g.lineTo(0, top - 12); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 9, top - 14, 10, 5, sx * -0.5, 0, Math.PI * 2); g.fillStyle = "#57d96e"; g.fill(); g.stroke(); } }
  // Körper
  bodyPath(); g.fillStyle = p.body; g.fill();
  g.save(); bodyPath(); g.clip();
  if (p.pattern === 1) { g.fillStyle = shade(p.body, -0.18); for (let y = -R; y < R * 1.2; y += 18) g.fillRect(-R * 1.3, y, R * 2.6, 8); }
  else if (p.pattern === 2) { g.fillStyle = shade(p.body, -0.2); for (const [x, y, r] of [[-24, 18, 7], [20, 24, 5], [26, -4, 4], [-30, -6, 4], [4, 34, 6]]) { O(x, y, r); g.fill(); } }
  else if (p.pattern === 3) { g.fillStyle = shade(p.body, 0.45); g.beginPath(); g.ellipse(0, R * .62, R * .62, R * .42, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(-R * .38, -R * .45, R * .34, R * .2, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
  bodyPath(); g.lineWidth = 4; g.strokeStyle = ink; g.stroke();
  // Kopfschmuck vorne
  g.lineWidth = 3;
  if (p.head === 3) { g.beginPath(); g.arc(0, top + 12, 30, Math.PI, 0); g.closePath(); g.fillStyle = p.acc; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(22, top + 12, 20, 5, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  if (p.head === 6) { g.beginPath(); g.arc(0, top + 16, 36, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fillStyle = "#cfd8dc"; g.fill(); g.stroke();
    g.fillStyle = p.acc; g.fillRect(-4, top - 20, 8, 22); }
  if (p.head === 9) { g.beginPath(); g.moveTo(-26, top + 10); g.lineTo(6, top - 40); g.lineTo(26, top + 10); g.closePath(); g.fillStyle = p.acc; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, top + 10, 32, 6, 0, 0, Math.PI * 2); g.fill(); g.stroke(); O(-2, top - 12, 4); g.fillStyle = "#ffc83d"; g.fill(); }
  if (p.head === 4) { g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(i * 9 - 6, top + 8); g.lineTo(i * 9 + 1, top - 16 + Math.abs(i) * 3); g.lineTo(i * 9 + 6, top + 8); } g.fillStyle = p.acc; g.fill(); g.stroke(); }
  if (p.head === 7) { g.save(); bodyPath(); g.clip(); g.fillStyle = p.acc; g.fillRect(-R * 1.3, top + 10, R * 2.6, 10); g.restore();
    g.beginPath(); g.moveTo(R * .9, top + 16); g.lineTo(R * 1.25, top + 6); g.lineTo(R * 1.2, top + 24); g.closePath(); g.fillStyle = p.acc; g.fill(); g.stroke(); }
  // Augen
  const ey = -6, ex = 15;
  const eye = (x: number, r: number) => { O(x, ey, r); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 2.5; g.strokeStyle = ink; g.stroke(); O(x + r * .25, ey + r * .1, r * .5); g.fillStyle = ink; g.fill(); O(x + r * .05, ey - r * .25, r * .18); g.fillStyle = "#fff"; g.fill(); };
  if (p.eyes === 0) { eye(-ex, 8); eye(ex, 8); }
  else if (p.eyes === 1) { eye(-ex, 8); eye(ex, 8); g.fillStyle = p.body; for (const x of [-ex, ex]) { g.beginPath(); g.arc(x, ey, 9, Math.PI, 0); g.fill(); } g.strokeStyle = ink; g.lineWidth = 2.5; for (const x of [-ex, ex]) { g.beginPath(); g.moveTo(x - 9, ey); g.lineTo(x + 9, ey); g.stroke(); } }
  else if (p.eyes === 2) { eye(-ex, 8); eye(ex, 8); g.lineWidth = 4; g.strokeStyle = ink; g.beginPath(); g.moveTo(-ex - 10, ey - 14); g.lineTo(-ex + 8, ey - 8); g.moveTo(ex + 10, ey - 14); g.lineTo(ex - 8, ey - 8); g.stroke(); }
  else if (p.eyes === 3) { eye(-ex - 1, 11); eye(ex + 1, 11); }
  else if (p.eyes === 4) eye(0, 14);
  else if (p.eyes === 5) { g.fillStyle = "#3a3a44"; g.fillRect(-R * .95, ey - 4, R * 1.9, 8); for (const x of [-ex, ex]) { O(x, ey, 11); g.fillStyle = "#cfd8dc"; g.fill(); g.lineWidth = 3; g.strokeStyle = ink; g.stroke(); O(x, ey, 7); g.fillStyle = "#80deea"; g.fill(); } }
  else { g.fillStyle = ink; for (const x of [-ex, ex]) { g.beginPath(); g.ellipse(x, ey, 12, 8, 0, 0, Math.PI * 2); g.fill(); } g.fillRect(-5, ey - 3, 10, 4);
    g.fillStyle = "rgba(255,255,255,.5)"; for (const x of [-ex, ex]) g.fillRect(x - 7, ey - 5, 5, 3); }
  // Wangen
  if (p.blush) { g.fillStyle = "rgba(255,120,150,.45)"; for (const x of [-24, 24]) { g.beginPath(); g.ellipse(x, 10, 7, 4, 0, 0, Math.PI * 2); g.fill(); } }
  // Mund
  const my = 16; g.lineWidth = 3; g.strokeStyle = ink; g.fillStyle = ink;
  if (p.mouth === 0) { g.beginPath(); g.arc(0, my - 6, 10, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  else if (p.mouth === 1) { g.beginPath(); g.moveTo(-13, my - 2); g.quadraticCurveTo(0, my + 14, 13, my - 2); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(-9, my - 1, 18, 4); }
  else if (p.mouth === 2) { g.beginPath(); g.moveTo(-10, my + 2); g.lineTo(10, my - 1); g.stroke(); }
  else if (p.mouth === 3) { g.beginPath(); g.ellipse(0, my + 2, 6, 7, 0, 0, Math.PI * 2); g.fill(); }
  else if (p.mouth === 4) { g.beginPath(); g.arc(0, my - 6, 11, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.fillStyle = "#fff";
    for (const x of [-6, 6]) { g.beginPath(); g.moveTo(x - 3, my + 2); g.lineTo(x + 3, my + 2); g.lineTo(x, my + 9); g.closePath(); g.fill(); g.lineWidth = 1.5; g.stroke(); } }
  else { g.fillStyle = "#5d4037"; g.beginPath(); g.moveTo(0, my - 2); g.quadraticCurveTo(-12, my - 6, -18, my + 4); g.quadraticCurveTo(-10, my + 2, 0, my + 3);
    g.quadraticCurveTo(10, my + 2, 18, my + 4); g.quadraticCurveTo(12, my - 6, 0, my - 2); g.fill(); g.lineWidth = 2; g.stroke(); }
}
