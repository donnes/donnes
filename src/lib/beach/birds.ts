// Birds cross the sky along a cubic curve, alone or in a small flock. In lite the whole flight is handed to the compositor.
import type { SceneView } from "./scene.ts";
import { clamp, between } from "./math.ts";

export type Bird = { el: SVGSVGElement; on: boolean; auto: boolean; t: number; dur: number; p: number[][]; size: number };
export type BirdsEls = { birds: SVGSVGElement[] };

export function createBirds(scene: SceneView, els: BirdsEls, deps: { life: () => number }) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const birds: Bird[] = els.birds.map((el) => ({ el, on: false, auto: false, t: 0, dur: 1, p: [], size: 1 }));
  // where a bird is, and how it banks, `t` of the way along its curve
  function birdAt(b: Bird, t: number): string {
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const x = w[0] * b.p[0][0] + w[1] * b.p[1][0] + w[2] * b.p[2][0] + w[3] * b.p[3][0];
    const y = w[0] * b.p[0][1] + w[1] * b.p[1][1] + w[2] * b.p[2][1] + w[3] * b.p[3][1];
    const dx = 3 * (u * u * (b.p[1][0] - b.p[0][0]) + 2 * u * t * (b.p[2][0] - b.p[1][0]) + t * t * (b.p[3][0] - b.p[2][0]));
    const dy = 3 * (u * u * (b.p[1][1] - b.p[0][1]) + 2 * u * t * (b.p[2][1] - b.p[1][1]) + t * t * (b.p[3][1] - b.p[2][1]));
    const bank = clamp((Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI, -22, 22) * (dx < 0 ? -1 : 1);
    return `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${bank.toFixed(1)}deg) scale(${b.size.toFixed(2)})`;
  }
  function launch(delay = 0, near?: Bird) {
    const lite = scene.caps.lite;
    const b = birds.find((k) => !k.on);
    if (!b || (lite && birds.some((k) => k.on))) return;
    const ltr = near ? near.p[0][0] < near.p[3][0] : scene.random() < 0.5;
    const y0 = near ? near.p[0][1] + rand(-30, 30) : rand(60, 330);
    const y1 = near ? near.p[3][1] + rand(-30, 30) : rand(50, 300);
    const xs = ltr ? [-60, rand(300, 600), rand(900, 1300), 1680] : [1680, rand(1000, 1300), rand(300, 700), -60];
    b.p = [[xs[0], y0], [xs[1], y0 + rand(-100, 80)], [xs[2], y1 + rand(-80, 100)], [xs[3], y1]];
    b.size = near ? near.size * rand(0.8, 1) : rand(0.6, 1.2);
    b.dur = (near ? near.dur : rand(13, 21)) * (scene.fit.portrait ? 0.6 : 1);
    b.t = -delay / b.dur;
    b.on = true;
    b.auto = lite;
    b.el.style.animationDelay = `${-rand(0, 2)}s`;
    b.el.classList.add("is-flying");
    if (b.auto) {
      // lite: the whole flight is handed to the compositor as one animation, so a bird in the air costs the main thread nothing
      const N = 16;
      const flight = b.el.animate(Array.from({ length: N + 1 }, (_, k) => ({ transform: birdAt(b, k / N), opacity: 1 })), { duration: b.dur * 1000, delay: delay * 1000 });
      flight.onfinish = flight.oncancel = () => {
        b.on = false;
        b.el.classList.remove("is-flying");
      };
    }
    return b;
  }
  /** now and then a bird, sometimes with a few behind it: how often depends on how alive the beach is */
  function flock() {
    const life = deps.life();
    if (scene.random() > life) return;
    const lead = launch();
    if (lead && scene.random() < 0.3 * life) for (let i = 1; i < 4; i++) launch(i * rand(0.5, 1.1), lead);
  }
  function tick(dt: number) {
    for (const b of birds) {
      if (!b.on || b.auto) continue;
      b.t += dt / b.dur;
      if (b.t >= 1) {
        b.on = false;
        b.el.style.opacity = "0";
        b.el.classList.remove("is-flying");
        continue;
      }
      if (b.t < 0) continue;
      b.el.style.opacity = "1";
      b.el.style.transform = birdAt(b, b.t);
    }
  }
  return { tick, launch, flock, birdAt, get birds() { return birds as readonly Readonly<Bird>[]; } };
}
export type Birds = ReturnType<typeof createBirds>;
