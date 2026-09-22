// The channels: every continuous quantity of the scene eases from where it is to where the state wants it.
// applyState() is the one transition function: on first paint (and in lite, or without motion) it snaps; otherwise the
// scene eases to the new state over a few seconds and the task below advances it each frame.
import type { Scene, Env, SceneState } from "./scene.ts";
import { SKY } from "./weather.ts";

const SECS: Record<keyof Env, number> = { cover: 7, deck: 7, fog: 7, rFirst: 1.6, rFar: 4, rMid: 6.5, rNear: 8, rSpd: 5, storm: 5, spray: 7, wet: 20, desat: 6, tint: 6, dark: 6, tr: 6, tg: 6, tb: 6, sun: 5, glit: 4, shade: 4, birds: 1, sea: 5, amp: 5, wind: 4, windX: 4, cyc: 6 };
const KEYS = Object.keys(SECS) as (keyof Env)[];

export type ChannelHooks = {
  /** a new state was taken: the flags on <html>, the chip */
  state(next: SceneState): void;
  /** the channels snapped: place the sun, render, hold the sky still, place the clouds, set the rates, hold the court */
  snapped(): void;
  /** the channels started easing */
  eased(): void;
  /** every frame while easing */
  frame(): void;
  /** a palette step (~8 a second while easing, and once when done) */
  render(): void;
  /** the animation rates (once a second while easing, and once when done) */
  rates(): void;
};
export type ChannelDeps = {
  read(): SceneState;
  /** snap instead of easing: no motion, the clock is not running, or lite (each palette step restyles the whole painting) */
  snapNow(): boolean;
  /** hold new states back (the intro's fade to colour) */
  blocked(): boolean;
  hooks: ChannelHooks;
};

export function goalFor(s: SceneState): Env {
  const { tc, ...l } = SKY[s.sky];
  return { ...l, cover: s.cover, tr: tc[0], tg: tc[1], tb: tc[2], wind: s.wind, windX: s.windX, cyc: s.cyc };
}

export function createChannels(scene: Scene, deps: ChannelDeps) {
  const { env } = scene;
  const goal = {} as Env;
  const rate = {} as Env;
  let moving = false;
  /** `prev` is null on first paint (snap), otherwise the scene eases to `next` over a few seconds */
  function applyState(prev: SceneState | null, next: SceneState) {
    scene.state = next;
    Object.assign(goal, goalFor(next));
    const snap = !prev || deps.snapNow();
    const hurry = prev && prev.temp === null && !prev.preview ? 0.3 : 1; // the first real reading after a clock-only first paint arrives briskly
    for (const k of KEYS) {
      if (snap) {
        env[k] = goal[k];
        continue;
      }
      let d = goal[k] - env[k];
      if (k === "cyc") {
        d = ((((d + 0.999) % 2) + 2) % 2) - 0.999; // the short way round the day (forwards when it is a tie)
        if (Math.abs(d) < 0.004) env.cyc = goal.cyc; // a real minute passing: no animation needed
      }
      const secs = k === "wet" && d < 0 ? 75 : SECS[k];
      rate[k] = Math.abs(d) / (secs * hurry);
    }
    moving = !snap;
    deps.hooks.state(next);
    if (snap) deps.hooks.snapped();
    else deps.hooks.eased();
  }
  /** reads the state and applies it if anything the scene shows has changed */
  function update() {
    // Weather that arrives while the paper still covers the beach snaps in unseen (nothing runs yet, so applyState snaps);
    // only the short fade to colour holds it back, rather than easing a whole new sky in right after the reveal.
    if (deps.blocked() && scene.state) return;
    const next = deps.read();
    const p = scene.state;
    if (p && p.sky === next.sky && p.phase === next.phase && Math.abs(p.cyc - next.cyc) < 0.0015 && p.cover === next.cover && p.wind === next.wind && p.windX === next.windX && p.temp === next.temp && p.kmh === next.kmh && p.label === next.label && p.preview === next.preview) return;
    applyState(p, next);
  }
  let stepAcc = 0;
  let rateAcc = 0;
  function tick(dt: number) {
    if (!moving) return;
    let busy = false;
    for (const k of KEYS) {
      if (env[k] === goal[k]) continue;
      let d = goal[k] - env[k];
      if (k === "cyc") d = ((((d + 0.999) % 2) + 2) % 2) - 0.999;
      const step = (rate[k] || 1) * dt;
      if (Math.abs(d) <= step) env[k] = goal[k];
      else {
        env[k] += Math.sign(d) * step;
        if (k === "cyc") env.cyc = (env.cyc + 2) % 2;
        busy = true;
      }
    }
    deps.hooks.frame();
    stepAcc += dt;
    rateAcc += dt;
    // every palette step re-rasters the filtered layers, so the look is stepped (~8 washes a second)
    if (stepAcc >= 0.125 || !busy) {
      stepAcc = 0;
      deps.hooks.render();
    }
    if (rateAcc > 1 || !busy) {
      rateAcc = 0;
      deps.hooks.rates();
    }
    moving = busy;
  }
  return { tick, update, applyState, goal: goal as Readonly<Env>, get moving() { return moving; } };
}
export type Channels = ReturnType<typeof createChannels>;
