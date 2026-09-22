// The sail boat crosses the horizon with the wind; a kitesurfer comes out when it blows.
import type { SceneView } from "./scene.ts";

export type SailEls = { sailGo: HTMLElement | null; kiteGo: HTMLElement | null; kiteArt: SVGSVGElement | null };

export function createSail(scene: SceneView, els: SailEls) {
  const sail = { x: 0 };
  const kite = { x: 900, dir: 1 };
  function tick(dt: number) {
    const { env, fit } = scene;
    const dir = env.windX < 0 ? -1 : 1;
    if (els.sailGo) {
      sail.x += dir * (3 + env.wind * 12) * dt;
      const pos = 966 + sail.x;
      if (pos > fit.left + fit.width + 80) sail.x = fit.left - 120 - 966;
      else if (pos < fit.left - 120) sail.x = fit.left + fit.width + 80 - 966;
      els.sailGo.style.transform = `translate3d(${sail.x.toFixed(1)}px,0,0)`;
    }
    if (els.kiteGo && els.kiteArt && !scene.caps.lite && scene.root.hasAttribute("data-kite")) {
      kite.x += kite.dir * (26 + env.wind * 40) * dt;
      if (kite.x > fit.left + fit.width * 0.92) kite.dir = -1;
      else if (kite.x < fit.left + fit.width * 0.3) kite.dir = 1;
      els.kiteGo.style.transform = `translate3d(${kite.x.toFixed(1)}px,0,0) scaleX(${kite.dir})`;
    }
  }
  return { tick, get state() { return { sail: { ...sail }, kite: { ...kite } }; } };
}
export type Sail = ReturnType<typeof createSail>;
