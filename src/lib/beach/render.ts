// Render: the channels → the palette, ~45 CSS variables and the data flags on <html> (called in steps, or once when
// snapping), and the court state. Never per-frame: every palette step re-rasters the filtered layers.
import type { Scene, Env } from "./scene.ts";
import type { Palette } from "./palette.ts";
import { COLS, VEILED, rgb, luma } from "./palette.ts";
import { PHASES } from "./weather.ts";
import { clamp } from "./math.ts";

export type RenderEls = { themeMeta: HTMLMetaElement | null; winEls: { el: HTMLElement; th: number }[] };

// animation speeds follow the wind and the sea state (looked up by keyframe name, never per-frame)
export const RATE_OF: Record<string, (e: Readonly<Env>) => number> = {
  "jb-sway": (e) => 0.7 + e.wind * 2, "jb-crown": (e) => 0.7 + e.wind * 2.2, "jb-flap": (e) => 0.4 + e.wind * 3.4, "jb-penn": (e) => 0.5 + e.wind * 2.5, "jb-umb": (e) => 0.8 + e.wind * 2,
  "jb-shimmer": (e) => e.sea, "jb-swell": (e) => e.sea, "jb-wash": (e) => e.sea, "jb-sheen": (e) => e.sea, "jb-sheen-soft": (e) => e.sea, "jb-ride": (e) => e.sea, "jb-pop": (e) => e.sea,
  "jb-rain-near": (e) => e.rSpd, "jb-rain-mid": (e) => e.rSpd, "jb-rain-far": (e) => e.rSpd, "jb-splash": (e) => 0.6 + e.rMid, "jb-ripple": (e) => 0.6 + e.rMid * 0.8,
  "jb-wisp": (e) => 0.6 + e.wind, "jb-mist": (e) => 0.6 + e.wind * 2, "jb-net": (e) => 0.5 + e.wind * 2.2 + e.storm,
};

export function createRender(scene: Scene, palette: Palette, els: RenderEls) {
  const { root, env, lum } = scene;
  const lastVar: Record<string, string> = {};
  function setVar(k: string, v: string) {
    if (lastVar[k] === v) return;
    lastVar[k] = v;
    root.style.setProperty(k, v);
  }
  const flag = (k: string, on: boolean) => root.toggleAttribute(`data-${k}`, on);
  function render() {
    const e = env;
    const lite = scene.caps.lite;
    const base = palette.palAt(e.cyc);
    const daylight = clamp(luma(base.c[1]) * 1.5, 0.12, 1);
    const tintC = [e.tr, e.tg, e.tb].map((v) => v * (0.22 + 0.78 * daylight));
    const dark = e.dark * (0.5 + 0.5 * daylight); // a night is dark enough already
    // weather look: pull saturation out, wash towards the sky's grey, darken
    const look = (c: number[], k = 1) => {
      const l = luma(c) * 255;
      return c.map((v, i) => {
        const d = v + (l - v) * e.desat * k;
        return (d + (tintC[i] - d) * e.tint * k) * (1 - dark * k);
      });
    };
    const cols = base.c.map((c, i) => look(c, i >= 4 && i <= 6 ? 1.12 : 1));
    COLS.forEach((k, i) => setVar(k, rgb(cols[i])));
    const theme = rgb(cols[0]).replace(/ /g, ", "); // the browser chrome continues the top of the sky
    if (els.themeMeta && els.themeMeta.content !== theme) els.themeMeta.content = theme;
    const veil = cols[18];
    setVar("--veil-b", ((0.2126 * veil[0] + 0.7152 * veil[1] + 0.0722 * veil[2]) / 255).toFixed(3));
    VEILED.forEach((k, i) => setVar(k, rgb(palette.veiledBase[i].map((v, ch) => (v * veil[ch]) / 255))));
    palette.paintLand(veil);
    const stars = base.n[0];
    const lights = clamp(Math.max(base.n[1], e.dark * 1.7 - 0.1), 0, 1);
    const night = lights > 0.75 && base.n[0] > 0.6;
    const sunny = e.sun * lum.sunUp;
    const low = 1 - clamp(lum.elev * 2.2, 0, 1);
    setVar("--stars", stars.toFixed(2));
    setVar("--lights", lights.toFixed(2));
    setVar("--clear", clamp(1 - e.cover * 0.75 - e.deck * 0.6, 0, 1).toFixed(2));
    setVar("--deck", e.deck.toFixed(3));
    setVar("--fog", clamp(e.fog + (e.cyc > 1.9 || e.cyc < 0.16 ? 0.4 * (1 - e.deck) * (1 - Math.abs((e.cyc > 1 ? e.cyc - 2 : e.cyc) - 0.03) / 0.13) : 0), 0, 1).toFixed(3));
    setVar("--mist-c", rgb(cols[3].map((v, i) => v + ((daylight > 0.5 ? 240 : cols[9][i] + 40) - v) * 0.6)));
    setVar("--r-first", e.rFirst.toFixed(3));
    setVar("--r-far", e.rFar.toFixed(3));
    setVar("--r-mid", e.rMid.toFixed(3));
    setVar("--r-near", e.rNear.toFixed(3));
    setVar("--rain-a", `${clamp(e.windX * (7 + 24 * e.wind), lite ? -10 : -90, lite ? 10 : 90).toFixed(1)}deg`); // lite: the one streak layer is cut close to the screen
    setVar("--spray", (e.spray * 0.8).toFixed(2));
    setVar("--wet-a", (clamp(e.wet * 2.6, 0, 1) * (0.26 - 0.14 * e.wet)).toFixed(3));
    setVar("--wet-b", (clamp((e.wet - 0.15) / 0.85, 0, 1) * (0.52 - 0.22 * e.dark - 0.16 * (1 - daylight))).toFixed(3));
    setVar("--tint", (e.fog * 0.2 + dark * 0.3).toFixed(3));
    setVar("--tint-c", rgb(tintC));
    setVar("--glit", (e.glit * (lum.sunUp ? 1 : 0.7) * clamp(lum.elev * 6, 0, 1)).toFixed(2));
    setVar("--rays", (sunny * clamp(lum.elev * 3, 0, 1) * (1 - e.cover * 0.5) * 0.9).toFixed(2));
    setVar("--glow", (low * clamp((lum.sunUp ? 1 : 0) + (e.cyc > 1 && e.cyc < 1.1 ? 1 - (e.cyc - 1) / 0.1 : e.cyc > 1.9 ? (e.cyc - 1.9) / 0.1 : 0), 0, 1) * (0.25 + 0.75 * e.sun) * 0.85).toFixed(2));
    setVar("--lum-dx", `${(lum.x - 870).toFixed(0)}px`);
    setVar("--glit-w", (1 + low * 0.9).toFixed(2)); // the light path widens as the sun (or moon) sinks
    setVar("--cshade", (clamp(1 - Math.abs(e.cover - 0.5) * 2.6, 0, 1) * (1 - e.deck) * sunny * clamp(lum.elev * 3 - 0.4, 0, 1) * 0.9).toFixed(2));
    // shadows fall away from the sun (or, faintly, the moon): long at the ends of the day, short at noon
    setVar("--sh-x", (-lum.side * (0.5 + low * 1.3)).toFixed(2));
    setVar("--sh-l", (1 + low * 0.55).toFixed(2));
    setVar("--sh-o", ((lum.sunUp ? 0.12 + 0.3 * e.shade : 0.1 + 0.12 * e.shade) * (1 - e.wet * 0.3)).toFixed(2));
    setVar("--sway", (0.5 + e.wind * 3).toFixed(2));
    setVar("--lean", `${(Math.sign(e.windX) * e.wind * 2.8).toFixed(2)}deg`);
    setVar("--wdir", e.windX < 0 ? "-1" : "1");
    setVar("--umb-lean", `${(Math.sign(e.windX) * (e.wind * 2.2 + e.storm * 3.5)).toFixed(2)}deg`);
    setVar("--umb-wob", `${(0.15 + e.wind * 1.5).toFixed(2)}deg`);
    setVar("--amp-k", e.amp.toFixed(2));
    // the name is set on the sky: pick the ink that reads on what is behind it right now
    const back = cols[1].map((v, i) => v + (cols[5][i] - v) * e.deck * 0.85);
    const darkSky = luma(back) < 0.46;
    setVar("--on-sky", darkSky ? "#fff6e4" : "#1d1a14");
    setVar("--id-back", darkSky ? "rgb(10 14 40 / 0.42)" : "rgb(255 250 235 / 0.5)");
    setVar("--id-plate", darkSky ? "rgb(8 12 34 / 0.52)" : "rgb(255 251 240 / 0.64)");
    // beach tennis: a rally whenever it is dry and light, overcast or foggy included; at night the rackets wait by the net, and rain or a storm leaves the court to the weather
    scene.court = e.rFirst > 0.04 || e.wet > 0.5 || e.storm > 0.1 ? "wet" : !scene.notFound && e.cyc > 0.085 && e.cyc < 0.965 ? "play" : "rest";
    const shut = e.cyc > 1.035 || e.cyc < 0.085;
    const state = scene.state;
    const hot = (state?.temp ?? 0) >= 28 && !!lum.sunUp && e.rFirst < 0.05 && e.deck < 0.5;
    const cold = state?.temp != null && state.temp <= 15;
    root.dataset.umb = shut ? "shut" : "open";
    flag("night", night);
    flag("rain", e.rFirst > 0.02);
    flag("wet", e.wet > 0.004);
    flag("mist", e.fog > 0.01 || e.cyc > 1.88 || e.cyc < 0.17);
    flag("deck", e.deck > 0.004);
    flag("fog", e.fog > 0.6);
    flag("tuck", e.rMid > 0.18);
    flag("lid", e.rMid > 0.28);
    flag("drip", e.rMid > 0.22 && !shut);
    flag("windy", e.wind > 0.55 && e.wet < 0.25);
    flag("caps", e.wind > 0.5 || e.storm > 0.4);
    flag("storm", e.storm > 0.5);
    flag("kite", e.wind > 0.5 && e.storm < 0.2 && e.rMid < 0.35 && e.fog < 0.5 && !!lum.sunUp && lum.elev > 0.15);
    flag("noboats", !!state && !PHASES[state.phase].boats);
    flag("ff", night && e.rFirst < 0.05 && e.wind < 0.6);
    flag("hot", hot);
    flag("cold", !!cold);
    flag("noshades", !!cold || e.rFirst > 0.1 || e.deck > 0.6 || lights > 0.5);
    for (const w of els.winEls) w.el.classList.toggle("on", lights > w.th);
  }
  /** animation playback rates follow the channels (looked up by keyframe name) */
  function rates() {
    if (scene.caps.calm || !document.getAnimations) return;
    for (const a of document.getAnimations()) {
      const fn = RATE_OF[(a as CSSAnimation).animationName];
      if (fn) a.playbackRate = fn(env);
    }
  }
  return { render, rates };
}
export type Render = ReturnType<typeof createRender>;
