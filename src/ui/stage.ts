/** Bühne: füllt den Bildschirm im Querformat. Hochkant wird sie per CSS um 90° gedreht (iOS sperrt die Ausrichtung nicht). */
export interface Stage {
  el: HTMLElement;
  /** Logische Breite und Höhe im Querformat */
  cw: number; ch: number;
  dpr: number;
  /** Welt-Pixel → Bildschirm-Pixel */
  scale: number;
  rotated: boolean;
  /** Zeigerposition in logischen Koordinaten der (evtl. gedrehten) Bühne */
  toLocal(e: { clientX: number; clientY: number }): { x: number; y: number };
  resize(): void;
}

export function createStage(el: HTMLElement, canvas: HTMLCanvasElement): Stage {
  const stage: Stage = {
    el, cw: 0, ch: 0, dpr: 1, scale: 1, rotated: false,
    toLocal: e => (stage.rotated ? { x: e.clientY, y: innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }),
    resize() {
      // Bildschirmtastatur verkleinert das Fenster: währenddessen nicht umbauen
      const active = document.activeElement;
      if (active && active.tagName === "INPUT" && stage.cw) return;
      stage.dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = innerWidth, ph = innerHeight;
      stage.rotated = ph > pw;
      stage.cw = stage.rotated ? ph : pw; stage.ch = stage.rotated ? pw : ph;
      el.style.width = stage.cw + "px"; el.style.height = stage.ch + "px";
      el.style.transform = stage.rotated ? `translate(${pw}px,0) rotate(90deg)` : "none";
      el.classList.toggle("short", stage.ch <= 440); el.classList.toggle("narrow", stage.cw < 480);
      canvas.width = Math.round(stage.cw * stage.dpr); canvas.height = Math.round(stage.ch * stage.dpr);
      stage.scale = Math.min(stage.cw / 1000, stage.ch / 580);
    }
  };
  addEventListener("resize", stage.resize);
  stage.resize();
  return stage;
}
