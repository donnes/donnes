// The beach ball: rolls when poked, drifts when it's windy, blows right off the beach in a storm and rolls home afterwards.
import type { SceneView } from "./scene.ts";
import { clamp, between } from "./math.ts";

export type BallEls = { ball: HTMLElement; art: HTMLElement };
const R = 44;

export function createBall(scene: SceneView, els: BallEls) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const b = { x: 0, v: 0, rot: 0 };
  const base = () => Number(els.ball.style.getPropertyValue("--x"));
  /** a poke from the left or the right; `fromLeft` is a coin toss for a keyboard press */
  function poke(fromLeft: boolean) {
    const px = base() + b.x;
    let dir = fromLeft ? 1 : -1;
    if (px > scene.fit.left + scene.fit.width - 140) dir = -1;
    if (px < scene.fit.left + 140) dir = 1;
    if (scene.caps.calm) {
      b.x += dir * 70;
      b.rot += dir * 90;
      els.ball.style.translate = `${b.x}px 0`;
      els.art.style.transform = `rotate(${b.rot}deg)`;
      return;
    }
    b.v = dir * rand(260, 380);
  }
  function step(dt: number) {
    const { env, fit } = scene;
    const away = env.storm > 0.5;
    const lo = fit.left + 60 - base();
    const hi = fit.left + fit.width - 60 - base();
    const lost = b.x < lo - 1 || b.x > hi + 1;
    const gust = away ? Math.sign(env.windX) * 420 : env.wind > 0.5 ? env.windX * (env.wind - 0.45) * 260 : 0;
    if (!away && lost) b.v += (b.x < lo ? 1 : -1) * 300 * dt; // the storm is over: it comes rolling back
    if (Math.abs(b.v) < 2 && !gust && !lost) return false;
    b.v += gust * dt;
    b.v *= Math.pow(0.22, dt);
    const k = Number(scene.root.style.getPropertyValue("--k")) || 1;
    let nx = b.x + b.v * dt;
    if (away) nx = clamp(nx, lo - 320, hi + 320);
    else if (!lost && (nx < lo || nx > hi)) {
      nx = clamp(nx, lo, hi);
      b.v *= -0.45;
    }
    b.rot += (((nx - b.x) / (R * k)) * 180) / Math.PI;
    b.x = nx;
    return true;
  }
  function paint() {
    els.ball.style.translate = `${b.x.toFixed(1)}px 0`;
    els.art.style.transform = `rotate(${b.rot.toFixed(1)}deg)`;
  }
  return {
    poke,
    tick(dt: number) {
      if (step(dt)) paint();
    },
    get state() {
      return b as Readonly<typeof b>;
    },
  };
}
export type Ball = ReturnType<typeof createBall>;
