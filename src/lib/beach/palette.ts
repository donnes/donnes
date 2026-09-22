// The palette: six gouache boxes keyed along the day, blended in JS (stepped, never per-frame).
import type { SceneView } from "./scene.ts";
import { clamp, ease } from "./math.ts";

export const BOXES = ["dawn", "morning", "day", "golden", "dusk", "night"] as const;
export type BoxName = (typeof BOXES)[number] | "aft";
export type Pal = { c: number[][]; n: number[] };
export const COLS = ["--sky-0", "--sky-1", "--sky-2", "--sky-3", "--cloud", "--cloud-shade", "--cloud-hi", "--sun", "--halo", "--far-1", "--far-2", "--sea-0", "--sea-1", "--sea-2", "--sea-3", "--sea-4", "--foam", "--glitter", "--veil"];
export const NUMS = ["--stars", "--lights"];
// lite has no veil filter: the veiled layers' own paint is multiplied by the veil instead (same maths as the filter's feBlend)
export const LAND = ["--hill", "--hill-dk", "--hill-lt", "--sand", "--sand-lt", "--sand-dk", "--wet", "--dune", "--g1", "--g2", "--g3", "--straw", "--p-wall", "--p-roof-a", "--p-roof-b", "--p-speck-dk", "--p-speck-lt", "--p-starfish", "--p-shell", "--p-trunk", "--p-ring", "--p-seed"];
export const VEILED = ["--v-cream", "--v-white", "--v-coral", "--v-teal", "--v-gold", "--v-green", "--v-navy", "--v-amber", "--v-glass", "--v-cork", "--v-pages", "--v-fold", "--v-pole", "--v-under", "--v-dark", "--v-char", "--v-brown", "--v-shade", "--v-crab", "--v-hill", "--v-hill-dk", "--v-hill-lt", "--v-skin-a", "--v-skin-b", "--v-hair-dark", "--v-hair-light", "--v-hair-highlight", "--v-orange", "--v-port-royale", "--v-pink", "--v-pink-dark", "--v-racket-gray"];
export const hex = (h: string) => {
  const v = h.trim().replace("#", "");
  const n = parseInt(v.length === 3 ? v.replace(/(.)/g, "$1$1") : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: Pal, b: Pal, t: number): Pal => ({
  c: a.c.map((ca, i) => ca.map((v, k) => v + (b.c[i][k] - v) * t)),
  n: a.n.map((v, i) => v + (b.n[i] - v) * t),
});
export const rgb = (c: number[]) => `rgb(${c.map((v) => Math.round(clamp(v, 0, 255))).join(" ")})`;
export const luma = (c: number[]) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
// `cyc` is the continuous time of day: 0 = sunrise, 1 = sunset, 2 = the next sunrise
export const PAL_KEYS: [number, BoxName][] = [[0, "dawn"], [0.1, "morning"], [0.26, "day"], [0.58, "day"], [0.74, "aft"], [0.89, "golden"], [1, "dusk"], [1.1, "night"], [1.88, "night"], [2, "dawn"]];

export type PaletteEls = { veiledEls: (HTMLElement | SVGElement)[] };
/** `probe(box)` reads the computed style of an element carrying `data-tod=box` */
export function createPalette(scene: SceneView, els: PaletteEls, probe: (box: (typeof BOXES)[number]) => { getPropertyValue(k: string): string }) {
  const PALS = {} as Record<BoxName, Pal>;
  let veiledBase: number[][] = [];
  let landBase: number[][] = [];
  for (const t of BOXES) {
    const cs = probe(t);
    PALS[t] = { c: COLS.map((k) => hex(cs.getPropertyValue(k))), n: NUMS.map((k) => parseFloat(cs.getPropertyValue(k)) || 0) };
    if (t === "day") {
      veiledBase = VEILED.map((k) => hex(cs.getPropertyValue(k)));
      landBase = LAND.map((k) => hex(cs.getPropertyValue(k)));
    }
  }
  PALS.aft = mix(PALS.day, PALS.golden, 0.26);
  function palAt(cyc: number): Pal {
    for (let i = 0; i < PAL_KEYS.length - 1; i++) {
      const [a, pa] = PAL_KEYS[i];
      const [b, pb] = PAL_KEYS[i + 1];
      if (cyc <= b) return pa === pb ? PALS[pa] : mix(PALS[pa], PALS[pb], ease((cyc - a) / (b - a)));
    }
    return PALS.dawn;
  }
  let landKey = "";
  function paintLand(veil: number[]) {
    const lite = scene.caps.lite;
    const key = lite ? veil.map((v) => Math.round(v)).join() : "";
    if (key === landKey) return;
    landKey = key;
    LAND.forEach((k, i) => {
      const v = lite ? rgb(landBase[i].map((c, ch) => (c * veil[ch]) / 255)) : "";
      for (const el of els.veiledEls) v ? el.style.setProperty(k, v) : el.style.removeProperty(k);
    });
  }
  return { palAt, paintLand, get veiledBase() { return veiledBase; }, get landBase() { return landBase; }, pals: PALS as Readonly<Record<BoxName, Pal>> };
}
export type Palette = ReturnType<typeof createPalette>;
