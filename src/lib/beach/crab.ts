// The crab: scuttles sideways along the damp sand, ducks into it when the pointer comes close. It loves rain and the dark.
import type { SceneView } from "./scene.ts";
import { SHORE, yAt } from "./shore.ts";
import { between } from "./math.ts";

export type CrabEls = { crab: HTMLElement };
type Mode = "gone" | "walk" | "pause" | "hide";

export function createCrab(scene: SceneView, els: CrabEls) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const c = { x: 0, y: 0, dir: 1, lo: 0, hi: 0, mode: "gone" as Mode, wait: 0, shy: 0, phase: 0, idle: 5, out: false, walking: false, hid: false };
  let moved = false, flagged = false;
  const flags = (out: boolean, walking: boolean, hid: boolean) => {
    c.out = out;
    c.walking = walking;
    c.hid = hid;
    flagged = true;
  };
  const bold = () => scene.env.rMid > 0.2 || scene.root.hasAttribute("data-night");
  function invite() {
    if (c.mode === "gone") c.idle = 0;
  }
  function step(dt: number) {
    if (c.mode === "gone") {
      c.idle -= dt * (bold() ? 4 : 1); // comes out about four times as often in the rain or at night
      if (c.idle > 0 || scene.caps.lite || scene.env.storm > 0.5) return;
      c.idle = rand(20, 42);
      c.dir = scene.random() < 0.5 ? 1 : -1;
      c.lo = scene.fit.left - 40;
      c.hi = scene.fit.left + scene.fit.width * (bold() ? 0.95 : 0.5);
      c.x = c.dir > 0 ? c.lo : c.hi;
      c.mode = "walk";
      c.wait = rand(1.2, 2.6);
      flags(true, true, false);
      return;
    }
    const { fit, pointer } = scene;
    const close = Math.hypot(pointer.x - (fit.ox + c.x * fit.s), pointer.y - (fit.oy + c.y * fit.s)) < 120;
    if (close && c.mode !== "hide") {
      c.mode = "hide";
      flags(c.out, false, true);
    }
    if (c.mode === "hide") {
      c.shy = close ? 1.6 : c.shy - dt;
      if (c.shy <= 0) {
        c.mode = "pause";
        c.wait = 0.5;
        flags(c.out, c.walking, false);
      }
      return;
    }
    c.wait -= dt;
    if (c.mode === "pause") {
      if (c.wait <= 0) {
        c.mode = "walk";
        c.wait = rand(1, 2.8);
        flags(c.out, true, c.hid);
      }
      return;
    }
    c.phase += dt * 3;
    c.x += c.dir * 50 * dt;
    c.y = yAt(SHORE, c.x) + 72 + Math.sin(c.phase) * 7;
    moved = true;
    if (c.wait <= 0) {
      c.mode = "pause";
      c.wait = rand(0.5, 1.4);
      flags(c.out, false, c.hid);
    }
    if (c.x < c.lo - 10 || c.x > c.hi + 10) {
      c.mode = "gone";
      flags(false, false, c.hid);
    }
  }
  /** only what changed this frame reaches the DOM */
  function paint() {
    if (moved) els.crab.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
    if (flagged) {
      els.crab.classList.toggle("is-out", c.out);
      els.crab.classList.toggle("is-walking", c.walking);
      els.crab.classList.toggle("is-hid", c.hid);
    }
    moved = flagged = false;
  }
  return {
    invite,
    tick(dt: number) {
      step(dt);
      paint();
    },
    get state() {
      return c as Readonly<typeof c>;
    },
  };
}
export type Crab = ReturnType<typeof createCrab>;
