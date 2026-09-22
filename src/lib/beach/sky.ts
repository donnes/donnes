// The sky: sun and moon on a real arc over the open sea (east is right; the beach looks north), clouds that roll in from
// the windward side, the overcast deck and cloud shadows riding the same wind, lightning far out, and a shooting star.
// The sky owns `scene.lum`, where the sun (or moon) is; render() reads it for light, glitter and shadows.
import type { Scene, Env } from "./scene.ts";
import { HORIZON } from "./shore.ts";
import { clamp, between } from "./math.ts";

export type SkyEls = {
  sun: HTMLElement | null; moon: HTMLElement | null; glow: HTMLElement | null; sparks: HTMLElement | null; dimmer: HTMLElement | null;
  clouds: SVGSVGElement[]; decks: HTMLElement[]; shades: HTMLElement[];
  flash: HTMLElement | null; bolt: SVGSVGElement | null; shoot: HTMLElement | null;
};
type Cloud = { el: SVGSVGElement; x: number; v: number; left: number; w: number; cy: number; near: boolean; th: number; on: boolean; enter: number; lv: number; gone: number };
const CLOUD_TH = [0, 0.4, 0.22, 0.3, 0.45, 0, 0.6, 0.7, 0.8, 0.9]; // cover needed before each cloud shows up (far ×3, near ×3, extra ×4)

export function createSky(scene: Scene, els: SkyEls) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const { env, fit, lum } = scene;
  // a thing that never moves per-frame in lite is placed with a 2D transform, so it does not become a texture of its own
  const at = (x: number, y = 0, still = scene.caps.lite) => (still ? `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)` : `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`);

  /* ── sun & moon ── */
  function arc(t: number): [number, number, number] {
    const cx = fit.portrait ? fit.left + fit.width * 0.5 : 880; // kept clear of the name block (left) and the morro (right)
    const rx = fit.portrait ? fit.width * 0.38 : 180;
    const a = Math.PI * clamp(t, -0.08, 1.08);
    // a phone only has a sliver of sky under the name block: the arc is flattened so the disc stays in it
    // …and a very wide window crops the top of the sky, so noon is never higher than what is on screen
    const h = fit.portrait ? 46 : clamp(HORIZON + 8 - (-fit.oy / fit.s + 62), 60, 150);
    return [cx + rx * Math.cos(a), HORIZON + 8 - h * Math.sin(a), Math.sin(a)];
  }
  function placeLum() {
    const day = env.cyc < 1.04 || env.cyc > 1.96;
    const ts = env.cyc > 1.5 ? env.cyc - 2 : env.cyc;
    const [sx, sy, se] = arc(ts);
    const [mx, my, me] = arc(env.cyc - 1);
    const k = fit.portrait ? " scale(0.72)" : "";
    if (els.sun) els.sun.style.transform = at(sx, sy) + k;
    if (els.moon) els.moon.style.transform = at(mx, my) + k;
    if (els.glow) els.glow.style.transform = at(sx, HORIZON);
    lum.sunUp = day ? 1 : 0;
    lum.x = day ? sx : mx;
    lum.y = day ? sy : my;
    lum.elev = Math.max(0, day ? se : me);
    lum.side = Math.cos(Math.PI * clamp(day ? ts : env.cyc - 1, 0, 1)); // +1 = low in the east (right), −1 = low in the west (left)
    if (els.sparks) els.sparks.style.transform = at(lum.x);
  }
  // without motion the scene still tells the truth: sun/moon visibility is set once per state
  function stillLum() {
    if (els.sun) els.sun.style.opacity = (lum.sunUp ? clamp(0.12 + env.sun, 0, 1) : 0).toFixed(2);
    if (els.moon) els.moon.style.opacity = (lum.sunUp ? 0 : clamp(0.1 + env.sun, 0, 1)).toFixed(2);
  }

  /* ── clouds: each one rolls in from the windward side and leaves downwind; the deck and the shadows ride the same wind ── */
  const clouds: Cloud[] = els.clouds.map((el, i) => ({ el, x: 0, v: Number(el.dataset.v) || 1, left: parseFloat(el.style.left), w: parseFloat(el.style.width), cy: Number(el.dataset.cy) || 0, near: el.dataset.tier !== "far", th: CLOUD_TH[i] ?? 0.5, on: false, enter: 0, lv: 0, gone: 0 }));
  clouds.forEach((c) => c.el.classList.add("is-gone")); // until the sky asks for it (only lite acts on this: see the styles)
  const cloudStill = (c: Cloud) => scene.caps.lite && c.v < 0.5; // lite: the far clouds stay put
  /** which clouds the sky wants, given the channels' goal; `snap` places them at once instead of rolling them in */
  function syncClouds(goal: Readonly<Env>, snap: boolean) {
    const dir = goal.windX < 0 ? -1 : 1;
    clouds.forEach((c, i) => {
      const want = goal.cover >= c.th && !(goal.deck > 0.8 && c.near && i % 2 === 1); // under a full deck half the cumulus would be hidden anyway
      if (want === c.on) return;
      c.on = want;
      c.lv = 0;
      if (want && !snap) {
        // start beyond the windward edge, aim for a slot across the screen, ease in
        const slot = fit.left + fit.width * (0.12 + ((i * 0.37) % 0.8));
        const start = dir > 0 ? fit.left - c.w - rand(20, 260) : fit.left + fit.width + rand(20, 260);
        c.x = start - c.left;
        c.enter = Math.abs(slot - c.w / 2 - start);
        c.el.style.transitionDuration = "0.9s";
      } else c.el.style.transitionDuration = "";
      c.el.style.opacity = want ? (c.near ? "1" : "0.92") : "0";
      if (snap) c.el.style.transform = at(c.x, 0, cloudStill(c));
      // a cloud that has left costs nothing (it would otherwise keep its texture at opacity 0)
      window.clearTimeout(c.gone);
      if (want || snap) c.el.classList.toggle("is-gone", !want);
      else c.gone = window.setTimeout(() => c.el.classList.add("is-gone"), 3000);
    });
  }
  /** after the lite switch flips: the clouds on show are placed again with the right kind of transform */
  function relite() {
    clouds.forEach((c) => c.on && (c.el.style.transform = at(c.x, 0, cloudStill(c))));
  }
  const decks = els.decks.map((el, i) => ({ el, x: 0, v: [0.35, 0.6, 0.85][i] ?? 0.5 }));
  const shades = els.shades.map((el) => ({ el, x: 0, v: Number(el.dataset.v) || 1, left: parseFloat(el.style.left), w: parseFloat(el.style.width) }));
  function tick(dt: number) {
    const lite = scene.caps.lite;
    const dir = env.windX < 0 ? -1 : 1;
    const speed = env.windX * (4 + env.wind * 52) + dir * env.storm * 14;
    let cross = 0;
    for (const c of clouds) {
      if (!c.on && c.lv === 0 && c.el.style.opacity === "0") c.lv = 1; // leaving: hurry downwind while it fades
      if (cloudStill(c)) continue;
      let move = speed * c.v * dt;
      if (c.enter > 1) {
        const m = c.enter * (1 - Math.exp(-dt / 1.5));
        c.enter -= m;
        move += dir * m;
      } else if (!c.on && c.lv) {
        c.lv = Math.min(320, c.lv + 200 * dt);
        move += dir * c.lv * dt;
      }
      c.x += move;
      const pos = c.left + c.x;
      if (c.on && c.enter <= 1) {
        if (pos > 1760) c.x -= 1920 + c.w;
        else if (pos + c.w < -160) c.x += 1920 + c.w;
      }
      if (!c.on && (pos > 1900 || pos + c.w < -300)) continue;
      c.el.style.transform = at(c.x, 0, false);
      if (c.on && c.near && !lite) {
        const half = (c.w - 160) / 2;
        const dx = Math.abs(pos + c.w / 2 - lum.x);
        if (dx < half + 40 && Math.abs(lum.y - (c.cy - 36)) < 78) cross = Math.max(cross, clamp(1.5 - dx / (half + 40) * 1.5, 0, 1));
      }
    }
    // lite: the overcast deck is three very wide bands; rolling them means three very wide textures, so they stay put
    if (!lite)
      for (const d of decks) {
        d.x = (((d.x + speed * d.v * dt) % 800) + 800) % 800;
        d.el.style.transform = `translate3d(${d.x.toFixed(1)}px,0,0)`;
      }
    if (!lite && env.deck < 0.9)
      for (const s of shades) {
        s.x += speed * 1.5 * s.v * dt;
        const pos = s.left + s.x;
        if (pos > fit.left + fit.width + 60) s.x -= fit.width + s.w + 120;
        else if (pos + s.w < fit.left - 60) s.x += fit.width + s.w + 120;
        s.el.style.transform = `translate3d(${s.x.toFixed(1)}px,0,0)`;
      }
    // the sun dims exactly while a cumulus crosses it (and the whole beach with it, a touch)
    lum.cross += (cross - lum.cross) * Math.min(1, dt * 1.6);
    const vis = lum.sunUp ? clamp(0.12 + env.sun, 0, 1) * (1 - 0.55 * lum.cross) : 0;
    if (els.sun) els.sun.style.opacity = vis.toFixed(2);
    if (els.moon) els.moon.style.opacity = (lum.sunUp ? 0 : clamp(0.1 + env.sun, 0, 1) * (1 - 0.5 * lum.cross)).toFixed(2);
    if (els.dimmer) els.dimmer.style.opacity = (lum.cross * env.sun * 0.13).toFixed(3);
  }

  /* ── lightning: far over the sea, rare and soft (one slow pulse; never under reduced motion, which never runs this clock) ── */
  function zap() {
    if (!els.flash || !els.bolt || scene.caps.calm) return;
    els.bolt.style.left = `${(fit.left + fit.width * rand(0.25, 0.8)).toFixed(0)}px`;
    els.bolt.style.scale = `${scene.random() < 0.5 ? -1 : 1} ${rand(0.7, 1).toFixed(2)}`;
    for (const el of [els.flash, els.bolt]) {
      el.classList.remove("is-zap");
      void el.getBoundingClientRect();
      el.classList.add("is-zap");
    }
  }
  /* ── a shooting star, on a clear night ── */
  function shoot() {
    if (!els.shoot || !scene.root.hasAttribute("data-night") || env.cover > 0.35 || env.deck > 0.2) return;
    els.shoot.style.left = `${(fit.left + fit.width * rand(0.35, 0.95)).toFixed(0)}px`;
    els.shoot.style.top = `${rand(10, 110).toFixed(0)}px`;
    els.shoot.classList.remove("is-go");
    void els.shoot.getBoundingClientRect();
    els.shoot.classList.add("is-go");
  }
  return { tick, placeLum, stillLum, syncClouds, relite, zap, shoot, get clouds() { return clouds as readonly Readonly<Cloud>[]; } };
}
export type Sky = ReturnType<typeof createSky>;
