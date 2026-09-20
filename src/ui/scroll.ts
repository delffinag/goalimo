import type { Stage } from "./stage";

/**
 * Eigenes Wischen zum Scrollen. Nötig, weil die Bühne im Hochformat um 90° gedreht ist:
 * das native Scrollen würde dann in die falsche Richtung laufen.
 * `dragged()` sagt, ob gerade gewischt statt getippt wurde – damit lässt sich ein Klick unterdrücken.
 */
export function dragScroll(el: HTMLElement, stage: Stage): { dragged(): boolean } {
  let drag: { id: number; y: number; top: number } | null = null;
  let moved = false;

  el.addEventListener("pointerdown", e => {
    moved = false;
    if (e.pointerType !== "mouse") drag = { id: e.pointerId, y: stage.toLocal(e).y, top: el.scrollTop };
  });
  el.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = stage.toLocal(e).y - drag.y;
    if (Math.abs(dy) > 8) moved = true;
    if (moved) el.scrollTop = drag.top - dy;
  });
  const end = (e: PointerEvent) => { if (drag && e.pointerId === drag.id) drag = null; };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);

  return { dragged: () => moved };
}
