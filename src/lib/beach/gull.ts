// The gull: lands on the sand, hops about, and leaves (dry daylight only).
import type { SceneView } from "./scene.ts";
import { SHORE, yAt } from "./shore.ts";
import { clamp, between } from "./math.ts";

export type GullEls = { gull: HTMLElement };
type Mode = "gone" | "land" | "stand" | "hop" | "leave";

export function createGull(scene: SceneView, els: GullEls, deps: { life: () => number }) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const g = { mode: "gone" as Mode, x: 0, y: 0, x0: 0, y0: 0, t: 0, duration: 1.5, dir: 1, hops: 0, wait: 0, px: 0, py: 0, out: false, air: false };
  let moved = false, flagged = false;
  const put = (x: number, y: number) => {
    g.px = x;
    g.py = y;
    moved = true;
  };
  const flags = (out: boolean, air: boolean) => {
    g.out = out;
    g.air = air;
    flagged = true;
  };
  function invite() {
    if (g.mode !== "gone" || scene.caps.lite || deps.life() < 0.8 || scene.env.wind > 0.7) return;
    g.dir = scene.random() < 0.5 ? 1 : -1;
    g.x = scene.fit.left + scene.fit.width * rand(0.3, 0.68);
    g.y = yAt(SHORE, g.x) + rand(96, 130);
    g.x0 = g.x - g.dir * 260;
    g.y0 = g.y - 200;
    g.t = 0;
    g.duration = 1.5;
    g.hops = Math.floor(rand(3, 7));
    g.mode = "land";
    flags(true, true);
    paint();
  }
  function step(dt: number) {
    if (g.mode === "gone") return;
    g.t += dt;
    if (g.mode === "land" || g.mode === "leave") {
      const k = clamp(g.t / g.duration, 0, 1);
      const u = g.mode === "land" ? 1 - (1 - k) * (1 - k) : 1 - k * k;
      put(g.x0 + (g.x - g.x0) * u, g.y0 + (g.y - g.y0) * u);
      if (k >= 1) {
        if (g.mode === "leave") {
          g.mode = "gone";
          flags(false, false);
        } else {
          g.mode = "stand";
          g.wait = rand(0.8, 2);
          flags(true, false);
        }
      }
    } else if (g.mode === "stand") {
      g.wait -= dt;
      if (g.wait > 0) return;
      if (g.hops-- <= 0 || scene.env.rMid > 0.1) {
        g.mode = "leave";
        g.t = 0;
        // Keep the flying sprite visible until it has cleared the viewport.
        g.x0 = g.dir > 0 ? scene.fit.left + scene.fit.width + 96 : scene.fit.left - 96;
        g.y0 = g.y - 300;
        g.duration = clamp(Math.hypot(g.x0 - g.x, g.y0 - g.y) / 280, 1.5, 4.5);
        flags(true, true);
      } else {
        if (scene.random() < 0.3) g.dir *= -1;
        g.mode = "hop";
        g.t = 0;
      }
    } else {
      const k = clamp(g.t / 0.32, 0, 1);
      put(g.x + g.dir * 16 * k, g.y - Math.sin(Math.PI * k) * 9);
      if (k >= 1) {
        g.x += g.dir * 16;
        g.mode = "stand";
        g.wait = rand(0.25, 1.6);
      }
    }
  }
  /** only what changed this frame reaches the DOM */
  function paint() {
    if (moved) els.gull.style.transform = `translate3d(${g.px.toFixed(1)}px,${g.py.toFixed(1)}px,0) scaleX(${g.dir})`;
    if (flagged) {
      els.gull.classList.toggle("is-out", g.out);
      els.gull.classList.toggle("is-air", g.air);
    }
    moved = flagged = false;
  }
  return {
    invite,
    tick(dt: number) {
      step(dt);
      paint();
    },
    /** for tests */
    get state() {
      return g as Readonly<typeof g>;
    },
  };
}
export type Gull = ReturnType<typeof createGull>;
