export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const hyp = Math.hypot;
export const norm = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y);
  return l > 1e-6 ? [x / l, y / l] : [0, 0];
};

/** Zufallsquelle der Simulation: liefert Werte in [0, 1). Mit festem Startwert ist ein Match reproduzierbar. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let h = seed >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rnd = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

export function shuffled<T>(rng: Rng, list: readonly T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
