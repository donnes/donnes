// Gentle pointer parallax, written straight onto each layer. Also the one writer of scene.pointer (the crab reads it).
import type { Scene } from "./scene.ts";

export type ParallaxEls = { layers: { el: HTMLElement | SVGElement; d: number }[] };

export function createParallax(scene: Scene, els: ParallaxEls, deps: { allowed: () => boolean }) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const step = () => {
    x += (tx - x) * 0.07;
    y += (ty - y) * 0.07;
    for (const l of els.layers) l.el.style.translate = `${(-x * l.d).toFixed(2)}px ${(-y * l.d).toFixed(2)}px`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(step) : 0;
  };
  function move(e: PointerEvent) {
    scene.pointer.x = e.clientX;
    scene.pointer.y = e.clientY;
    if (e.pointerType === "touch" || scene.caps.calm || scene.caps.lite || !deps.allowed()) return;
    tx = (e.clientX / window.innerWidth - 0.5) * 20;
    ty = (e.clientY / window.innerHeight - 0.5) * 9;
    if (!raf && !document.hidden) raf = requestAnimationFrame(step);
  }
  /** the lite switch flipped: the layers go back to where they were painted */
  function reset() {
    for (const l of els.layers) l.el.style.translate = "";
  }
  return { move, reset };
}
export type Parallax = ReturnType<typeof createParallax>;
