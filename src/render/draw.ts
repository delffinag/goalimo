export type Ctx = CanvasRenderingContext2D;

export function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Überschriftenschrift auf der Spielfläche: Fredoka 600, lokal aus public/fonts/ */
export const displayFont = (size: number) => `600 ${size}px Fredoka, "Trebuchet MS", sans-serif`;
