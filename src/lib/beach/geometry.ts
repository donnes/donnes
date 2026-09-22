// Build-time geometry of the Jurerê beach: every path, blob and sprite position the markup paints.
// Pure functions and seeded randomness, so the same numbers come out on every build.
import { type Pt, f, rng, smooth, yAt, HORIZON, D, SHORE } from "./shore";
export { HORIZON, SHORE, yAt, f };
export type { Pt };


// camera: low and close. Sky is a slim band, the shore sweeps gently across the whole frame.
export const shoreShift = (d: number): Pt[] => SHORE.map(([x, y]) => [x, Math.max(HORIZON + 3, HORIZON + (y - HORIZON) * (1 - d / D))] as Pt);
export const below = (pts: Pt[]) => `${smooth(pts)}L1720 1120L-120 1120Z`;
export const seaBands = [
  { cls: "sea1", d: below(shoreShift(262)) },
  { cls: "sea2", d: below(shoreShift(176)) },
  { cls: "sea3", d: below(shoreShift(98)) },
  { cls: "sea4", d: below(shoreShift(40)) },
];
export const foamD = below(shoreShift(9));
export const wetD = below(shoreShift(-2));
export const sandD = below(shoreShift(-38));
// the wave: a foam front + water film drawn on the shoreline; CSS scales the layer about the horizon,
// which is exactly what shoreShift() does (perspective-correct roll-in)
export const band = (a: number, b: number) => `${smooth([...shoreShift(a), ...shoreShift(b).reverse()])}Z`;
export const washFoamD = band(-4, 13);
export const washFilmD = band(6, 64);
export const washLaceD = smooth(shoreShift(28));
export const washLace2D = smooth(shoreShift(46));
export const sheenD = band(3, -40);
export const swellLines = [smooth(shoreShift(280)), smooth(shoreShift(196)), smooth(shoreShift(118))];
export const foamLine1 = smooth(shoreShift(52));
export const foamLine2 = smooth(shoreShift(92));

export function ridge(seed: number, base: number, amp: number): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  // the far range sinks to a low line where the sun rises (right) and sets (left), so both happen over open water
  const open = (x: number) => 0.14 + 0.86 * Math.max(Math.min(1, Math.max(0, (x - 770) / 100)) * Math.min(1, Math.max(0, (1030 - x) / 80)), Math.min(1, Math.max(0, (560 - x) / 160)), Math.min(1, Math.max(0, (x - 1080) / 100)));
  for (let x = -120; x <= 1720; x += 92) pts.push([x, base - amp * (0.25 + r() * 0.75) * open(x)]);
  return `${smooth(pts)}L1720 ${HORIZON + 4}L-120 ${HORIZON + 4}Z`;
}
export const farRidge2 = ridge(11, HORIZON - 6, 40);
export const farRidge1 = ridge(23, HORIZON - 1, 22);
export const HILL_L: Pt[] = [[-120, 176], [-20, 186], [80, 203], [180, 219], [270, 231], [350, 239]];
export const HILL_R: Pt[] = [[1090, 240], [1170, 222], [1250, 197], [1340, 171], [1430, 149], [1520, 153], [1620, 129], [1720, 118]];
export const hillLD = `${smooth(HILL_L)}L350 ${HORIZON + 6}L-120 ${HORIZON + 6}Z`;
export const hillRD = `${smooth(HILL_R)}L1720 ${HORIZON + 8}L1090 ${HORIZON + 6}Z`;
export function hillBlobs(pts: Pt[], base: number, n: number, seed: number, x0: number, x1: number) {
  const r = rng(seed);
  const out: { x: number; y: number; r: number; c: string }[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const top = yAt(pts, x) + 7;
    const room = base - top;
    if (room < 14) continue;
    const t = r();
    const y = top + t * (room - 9);
    const rad = (6 + r() * 14) * Math.min(1, room / 60);
    out.push({ x: f(x), y: f(y), r: f(rad), c: t < 0.42 ? (r() < 0.6 ? "h-lt" : "h-md") : r() < 0.7 ? "h-dk" : "h-md" });
  }
  return out;
}
export const blobsL = hillBlobs(HILL_L, HORIZON + 2, 26, 5, -100, 330);
export const blobsR = hillBlobs(HILL_R, HORIZON + 2, 80, 9, 1110, 1700);
export const houses = [
  { x: 1188, y: 224, w: 16, c: "roof-a" }, { x: 1214, y: 221, w: 22, c: "roof-b" }, { x: 1250, y: 224, w: 14, c: "roof-a" }, { x: 1300, y: 218, w: 20, c: "roof-a" }, { x: 1338, y: 222, w: 15, c: "roof-b" },
];

export function cloud(cx: number, cy: number, w: number, h: number, seed: number) {
  const r = rng(seed);
  const n = Math.round(w / 58) + 3;
  const puffs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const env = Math.sin(Math.PI * (0.06 + 0.88 * t));
    const rad = h * (0.2 + 0.42 * env) * (0.8 + 0.4 * r());
    puffs.push({ x: f(-w / 2 + t * w + (r() - 0.5) * 22), y: f(-rad * 0.5 - env * h * 0.34 * r()), r: f(rad) });
  }
  const m = Math.max(2, Math.round(n / 2.4));
  for (let i = 0; i < m; i++) {
    const t = (i + 0.5) / m;
    const rad = h * (0.2 + 0.2 * r());
    puffs.push({ x: f((-w / 2 + t * w) * 0.55 + (r() - 0.5) * 30), y: f(-h * (0.55 + 0.3 * Math.sin(Math.PI * t))), r: f(rad) });
  }
  return { cx, cy, w, h, puffs };
}
export const cloudsFar = [cloud(200, HORIZON - 12, 260, 54, 1), cloud(640, HORIZON - 8, 280, 48, 2), cloud(1040, HORIZON - 10, 330, 58, 3)];
export const cloudsNear = [cloud(560, 132, 340, 96, 7), cloud(1300, 104, 400, 112, 8), cloud(980, 56, 250, 56, 12)];
export const cloudsExtra = [cloud(300, 80, 460, 96, 21), cloud(820, 160, 500, 104, 22), cloud(1480, 196, 400, 84, 23), cloud(60, 186, 380, 84, 24)];
export const allClouds = [
  ...cloudsFar.map((c, i) => ({ ...c, key: `cf${i}`, tier: "far" })),
  ...cloudsNear.map((c, i) => ({ ...c, key: `cn${i}`, tier: "near" })),
  ...cloudsExtra.map((c, i) => ({ ...c, key: `cx${i}`, tier: "extra" })),
];
export const box = (x: number, y: number, w: number, h: number) => ({
  style: `left:${f(x)}px;top:${f(y)}px;width:${f(w)}px;height:${f(h)}px`,
  viewBox: `${f(x)} ${f(y)} ${f(w)} ${f(h)}`,
});
export const cloudBox = (c: { cx: number; cy: number; w: number; h: number }) => box(c.cx - c.w / 2 - 80, c.cy - c.h * 1.5 - 30, c.w + 160, c.h * 1.5 + 56);

export const skyR = rng(31);
export const skyStrokes = Array.from({ length: 12 }, () => {
  const x = -80 + skyR() * 1600;
  const y = 14 + skyR() * 200;
  const len = 160 + skyR() * 420;
  return { d: `M${f(x)} ${f(y)}q${f(len / 2)} ${f(-6 + skyR() * 12)} ${f(len)} ${f(-4 + skyR() * 8)}`, w: f(8 + skyR() * 18), o: f(0.1 + skyR() * 0.18) };
});
export const moreStars = Array.from({ length: 90 }, () => ({ x: f(skyR() * 1600), y: f(skyR() * 225), r: f(0.5 + skyR() * 1.3), o: f(0.3 + skyR() * 0.7) }));
export const twinklers = Array.from({ length: 7 }, (_, i) => ({ x: f(120 + skyR() * 1360), y: f(14 + skyR() * 190), s: f(3 + skyR() * 3), delay: f(-i * 0.83) }));
export const stars = Array.from({ length: 56 }, () => ({ x: f(skyR() * 1600), y: f(skyR() * 215), r: f(0.8 + skyR() * 1.6), o: f(0.4 + skyR() * 0.6) }));

export const SUN_X = 870;
export const seaR = rng(77);
export type Stroke = { d: string; w: number; o: number };
export const waves: [Stroke[], Stroke[]] = [[], []];
export const toneStrokes: (Stroke & { c: string })[] = [];
for (let i = 0; i < 170; i++) {
  const x = -60 + seaR() * 1700;
  const lim = yAt(SHORE, x) - 30;
  const tt = seaR();
  const y = HORIZON + 7 + tt * tt * (lim - HORIZON - 7) + seaR() * 6;
  const t = (y - HORIZON) / D;
  const len = 14 + t * 150 * (0.4 + seaR());
  const s = { d: `M${f(x)} ${f(y)}q${f(len / 2)} ${f(-1.5 - 6 * t)} ${f(len)} 0`, w: f(1 + t * 4), o: f(0.45 + seaR() * 0.5) };
  if (i % 3 === 2) toneStrokes.push({ ...s, w: f(s.w * 2.4), o: f(0.25 + seaR() * 0.3), c: seaR() < 0.5 ? "t-dk" : "t-lt" });
  else waves[i % 2].push(s);
}
export const glitter = Array.from({ length: 26 }, (_, i) => {
  const t = i / 25;
  const y = HORIZON + 6 + t * t * 250;
  const w = 10 + t * 90 * (0.5 + seaR() * 0.6);
  const x = SUN_X + (seaR() - 0.5) * (20 + t * 130) - w / 2;
  return { d: `M${f(x)} ${f(y)}h${f(w)}`, w: f(1.2 + t * 3.4), o: f(0.5 + seaR() * 0.4) };
});

export const lifeR = rng(2014);
export const bioPts = Array.from({ length: 14 }, (_, i) => {
  const x = 120 + i * 102 + lifeR() * 50;
  const d = 8 + lifeR() * 50;
  return { x: f(x), y: f(yAt(shoreShift(d), x)), s: f(3 + lifeR() * 3.5), delay: f(-lifeR() * 4), dur: f(2.2 + lifeR() * 2.6) };
});
// foam bubbles left at the high-water line: they pop, in step with the big wave
export const bubbles = Array.from({ length: 12 }, (_, i) => {
  const x = 90 + i * 124 + lifeR() * 70;
  return { x: f(x), y: f(yAt(shoreShift(-22 - lifeR() * 12), x)), s: f(5 + lifeR() * 6), delay: f(lifeR() * 1.3) };
});
export const sandR = rng(101);
export const speckles = Array.from({ length: 260 }, () => {
  const x = -60 + sandR() * 1700;
  const top = yAt(SHORE, x) + 56;
  const y = top + sandR() * (1010 - top);
  return { x: f(x), y: f(y), r: f(0.9 + sandR() * 2.2), c: sandR() < 0.55 ? "s-dk" : "s-lt" };
});
export const sandStrokes = Array.from({ length: 30 }, () => {
  const x = -60 + sandR() * 1500;
  const top = yAt(SHORE, x) + 70;
  const y = top + sandR() * (980 - top);
  const len = 140 + sandR() * 320;
  return { d: `M${f(x)} ${f(y)}q${f(len / 2)} ${f(-6 - sandR() * 8)} ${f(len)} ${f(-14 - sandR() * 12)}`, w: f(6 + sandR() * 16), c: sandR() < 0.5 ? "s-lt" : "s-dk" };
});
export const shells = [[330, 742], [742, 668], [1090, 640], [905, 930], [1420, 610], [560, 960]].map(([x, y], i) => ({ x, y, s: f(0.9 + (i % 3) * 0.3) }));

// restinga in the two bottom corners
export const DUNE: Pt[] = [[-120, 868], [50, 876], [200, 922], [340, 990], [460, 1040], [1140, 1040], [1270, 990], [1410, 930], [1570, 886], [1720, 868]];
export const duneD = `${smooth(DUNE)}L1720 1120L-120 1120Z`;
export type Blade = { d: string; c: string; w: number; seed?: { x: number; y: number; rot: number } };
export function tuft(x: number, y: number, h: number, n: number, r: () => number): Blade[] {
  const out: Blade[] = [];
  for (let i = 0; i < n; i++) {
    const lean = (i / (n - 1) - 0.5) * 2 + (r() - 0.5) * 0.5;
    const bx = x + lean * h * 0.1;
    const hh = h * (0.55 + r() * 0.45) * (1 - Math.abs(lean) * 0.25);
    const tx = bx + lean * hh * 0.55 + (r() - 0.5) * 8;
    const ty = y - hh;
    const c = ["g1", "g2", "g3", "g2", "straw"][Math.floor(r() * 5)];
    const b: Blade = { d: `M${f(bx)} ${f(y)}Q${f(bx + lean * hh * 0.08)} ${f(y - hh * 0.62)} ${f(tx)} ${f(ty)}`, c, w: f(1.8 + r() * 2.4) };
    if (c === "straw" && r() < 0.7) b.seed = { x: f(tx), y: f(ty), rot: f(lean * 40) };
    out.push(b);
  }
  return out;
}
export const gR = rng(404);
export const grass: [Blade[], Blade[]] = [[], []];
for (let i = 0; i < 26; i++) {
  const x = i % 2 ? -50 + gR() * 380 : 1240 + gR() * 420;
  const y = yAt(DUNE, x) + 10 + gR() * 70;
  grass[i % 2 ? 0 : 1].push(...tuft(x, y, 50 + gR() * 70, 7 + Math.floor(gR() * 6), gR));
}
export const fgR = rng(909);
export const fg: [Blade[], Blade[]] = [[], []];
for (let i = 0; i < 26; i++) {
  const left = i % 2 === 0;
  const x = left ? -30 + fgR() * 250 : 1390 + fgR() * 240;
  const edge = left ? 1 - Math.max(0, x) / 250 : (x - 1390) / 240;
  fg[i % 2].push(...tuft(x, 272, 70 + edge * 130 * (0.6 + fgR() * 0.4), 8 + Math.floor(fgR() * 6), fgR));
}

export function palm(x: number, base: number, h: number, lean: number, seed: number) {
  const r = rng(seed);
  const tx = x + lean;
  const ty = base - h;
  const mx = x + lean * 0.15;
  const my = base - h * 0.5;
  const trunk = `M${f(x - 12)} ${base}Q${f(mx - 10)} ${f(my)} ${f(tx - 5)} ${f(ty)}L${f(tx + 5)} ${f(ty)}Q${f(mx + 10)} ${f(my)} ${f(x + 12)} ${base}Z`;
  const rings = Array.from({ length: 11 }, (_, i) => {
    const t = (i + 1) / 12;
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * tx;
    const py = (1 - t) * (1 - t) * base + 2 * (1 - t) * t * my + t * t * ty;
    const hw = 12 - t * 7;
    return `M${f(px - hw)} ${f(py)}q${f(hw)} ${f(3)} ${f(hw * 2)} 0`;
  });
  const fronds = Array.from({ length: 11 }, (_, k) => {
    const a = -Math.PI * 1.12 + (k / 10) * Math.PI * 1.24 + (r() - 0.5) * 0.18;
    const L = h * 0.46 * (0.8 + r() * 0.4);
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.5 + L * 0.42;
    const cx = tx + Math.cos(a) * L * 0.55;
    const cy = ty + Math.sin(a) * L * 0.8 - L * 0.22;
    return { d: `M${f(tx)} ${f(ty)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}Q${f(cx + Math.cos(a) * 6)} ${f(cy + L * 0.3)} ${f(tx)} ${f(ty)}Z`, c: k % 3 === 0 ? "h-lt" : k % 3 === 1 ? "h-dk" : "h-md" };
  });
  return { trunk, rings, fronds, tx: f(tx), ty: f(ty), h };
}
export const palms = [palm(1486, 1012, 560, 44, 3), palm(1610, 1020, 380, 30, 8)];
export const crownBox = (p: { tx: number; ty: number; h: number }) => box(p.tx - p.h * 0.62, p.ty - p.h * 0.62, p.h * 1.24, p.h * 1.2);

// the towel: a quad in perspective, striped across its length
export const TW: Pt[] = [[58, 52], [372, 38], [392, 176], [18, 196]];
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const pts = (...p: Pt[]) => p.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");
export const flapA = lerp(TW[1], TW[0], 0.17);
export const flapB = lerp(TW[1], TW[2], 0.32);
export const towelD = `M${pts(TW[0], flapA, flapB, TW[2], TW[3])}Z`;
export const flapD = `M${pts(flapA, flapB, [333.8, 91])}Z`;
export const flapOrigin = `${f((flapA[0] + flapB[0]) / 2)}px ${f((flapA[1] + flapB[1]) / 2)}px`;
export const flapAngle = `${f(Math.atan2(flapB[1] - flapA[1], flapB[0] - flapA[0]) * 180 / Math.PI)}deg`;
export const towelStripes = (
  [[0.03, 0.11, "o-teal"], [0.15, 0.19, "o-gold"], [0.23, 0.33, "o-coral"], [0.37, 0.41, "o-gold"], [0.45, 0.55, "o-teal"], [0.59, 0.63, "o-gold"], [0.67, 0.77, "o-coral"], [0.81, 0.85, "o-gold"], [0.89, 0.97, "o-teal"]] as [number, number, string][]
).map(([a, b, c]) => ({ c, d: `M${pts(lerp(TW[0], TW[1], a), lerp(TW[0], TW[1], b), lerp(TW[3], TW[2], b), lerp(TW[3], TW[2], a))}Z` }));
export const fringe = [0, 1].map((side) =>
  Array.from({ length: 13 }, (_, i) => {
    const p = lerp(side ? TW[1] : TW[0], side ? TW[2] : TW[3], (i + 0.5) / 13);
    return `M${f(p[0])} ${f(p[1])}l${side ? 9 : -9} ${side ? 1 : 2}`;
  }).join(""),
);
export const ballWedges = Array.from({ length: 6 }, (_, i) => {
  const a0 = ((i * 60 - 20) * Math.PI) / 180;
  const a1 = (((i + 1) * 60 - 20) * Math.PI) / 180;
  return { c: ["o-coral", "o-white", "o-gold", "o-white", "o-teal", "o-white"][i], d: `M-8 -12L${f(-8 + 120 * Math.cos(a0))} ${f(-12 + 120 * Math.sin(a0))}A120 120 0 0 1 ${f(-8 + 120 * Math.cos(a1))} ${f(-12 + 120 * Math.sin(a1))}Z` };
});

/* ───────────────────────── weather & daytime props (all small sprites or whole layers) ───────────────────────── */
export const wxR = rng(5150);
// overcast deck: a lumpy-bottomed band that tiles in x, used as a CSS mask so the palette can colour it
export function deckTile(seed: number, body: number, lump: number) {
  const r = rng(seed);
  let s = `<rect width='800' height='${body}'/>`;
  for (let x = 0; x < 800; x += 38 + r() * 30) {
    const rad = lump * (0.55 + r() * 0.6);
    const y = body - rad * 0.2 + r() * lump * 0.35;
    for (const xx of [x, x - 800, x + 800]) if (xx > -rad && xx < 800 + rad) s += `<circle cx='${f(xx)}' cy='${f(y)}' r='${f(rad)}'/>`;
  }
  const height = body + lump * 2;
  return {
    height,
    drawing: s,
    mask: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='${height}' viewBox='0 0 800 ${height}'>${s}</svg>")`,
  };
}
export const deckBack = deckTile(61, 150, 46);
export const deckFront = deckTile(62, 96, 40);
export const deckHi = deckTile(63, 60, 30);
// rain lands: rings on the water, ticks on the sand, dark blotches first and then the whole beach goes wet
export const ripplesSea = Array.from({ length: 16 }, (_, i) => {
  const t = 0.12 + wxR() * 0.85;
  return { x: f(120 + wxR() * 1360), y: f(HORIZON + 14 + t * t * 270), rx: f(8 + t * 26), delay: f(-i * 0.23 - wxR()) };
});
export const splashes = Array.from({ length: 16 }, (_, i) => {
  const x = 80 + wxR() * 1440;
  const top = yAt(SHORE, x) + 70;
  const t = wxR();
  return { x: f(x), y: f(top + t * (940 - top)), s: f(0.7 + t * 0.9), delay: f(-i * 0.11 - wxR() * 0.6), dur: f(0.7 + wxR() * 0.5) };
});
export const wetBlots = Array.from({ length: 46 }, () => {
  const x = -40 + wxR() * 1680;
  const top = yAt(SHORE, x) + 50;
  const t = wxR();
  return { x: f(x), y: f(top + t * (1000 - top)), rx: f(40 + t * 90 + wxR() * 50), ry: f(10 + t * 22 + wxR() * 10) };
});
export const puddles = [[300, 700, 58], [620, 770, 74], [930, 640, 46], [1180, 760, 80], [1330, 580, 40], [760, 905, 96], [1040, 885, 60]].map(([x, y, rx]) => ({ x, y, rx, ry: f(rx * 0.17) }));
export const wetFullD = below(shoreShift(-46));
// wind: whitecaps far out, sand wisps skimming the beach
export const whitecaps = Array.from({ length: 12 }, (_, i) => {
  const t = 0.08 + wxR() * 0.5;
  return { x: f(80 + wxR() * 1440), y: f(HORIZON + 10 + t * t * 270), w: f(10 + t * 34), delay: f(-i * 0.61 - wxR()), dur: f(2.6 + wxR() * 2) };
});
export const wisps = Array.from({ length: 6 }, (_, i) => ({ y: f(640 + i * 56 + wxR() * 30), w: f(220 + wxR() * 200), delay: f(-i * 1.27 - wxR() * 2), dur: f(3.2 + wxR() * 2.2) }));
// cloud shadows that slide over sea and sand on partly-cloudy days
export const cloudShadows = [{ x: 200, y: 330, w: 620, h: 120, v: 1 }, { x: 900, y: 640, w: 760, h: 190, v: 0.8 }, { x: 1500, y: 430, w: 540, h: 120, v: 1.15 }];
// mist: soft bands over the horizon and the morros
export const mists = [{ y: 150, h: 110, v: 0.5, o: 0.95 }, { y: 205, h: 90, v: -0.35, o: 1 }, { y: 250, h: 120, v: 0.8, o: 0.8 }];
// night: fireflies by the grass, windows on the morro, sparkles on the light path
export const fireflies = Array.from({ length: 8 }, (_, i) => {
  const left = i % 2 === 0;
  return { x: f(left ? 40 + wxR() * 300 : 1260 + wxR() * 300), y: f(800 + wxR() * 150), delay: f(-wxR() * 9), dur: f(7 + wxR() * 6), k: i % 3 };
});
export const moreHouses = [{ x: 1392, y: 196, w: 15, c: "roof-b" }, { x: 1452, y: 182, w: 18, c: "roof-a" }, { x: 1540, y: 172, w: 16, c: "roof-b" }, { x: 150, y: 226, w: 13, c: "roof-a" }];
export const allHouses = [...houses, ...moreHouses];
export const windows = allHouses.flatMap((h, i) => (h.w >= 18 ? [{ x: h.x + 3, y: h.y + 3, i }, { x: h.x + h.w - 7, y: h.y + 3, i }] : [{ x: h.x + 3, y: h.y + 3, i }]));
export const sparks = Array.from({ length: 9 }, (_, i) => {
  const t = 0.1 + (i / 9) * 0.85;
  return { x: f((wxR() - 0.5) * (30 + t * 120)), y: f(HORIZON + 8 + t * t * 240), s: f(5 + t * 9), delay: f(-wxR() * 3), dur: f(1.3 + wxR() * 1.6) };
});

/* ───────────────────────── beach tennis: a court further along the sand (oblique projection, parallel to the shore) ───────────────────────── */
export const BT = { m: -0.085, L: 140, dep: 25, sk: 22 };
export const btP = (u: number, d: number, h = 0): Pt => {
  const x = u - BT.sk * d;
  return [x, BT.dep * d + BT.m * x - h];
};
export const btPoly = (...p: Pt[]) => `M${pts(...p)}Z`;
export const btTapes = btPoly(btP(-BT.L, -1), btP(BT.L, -1), btP(BT.L, 1), btP(-BT.L, 1));
export const btNet = {
  mesh: btPoly(btP(0, 1, 45), btP(0, -1, 40), btP(0, -1, 15), btP(0, 1, 17)),
  band: btPoly(btP(0, 1, 46), btP(0, -1, 41), btP(0, -1, 35.5), btP(0, 1, 40)),
  lines: [0.25, 0.5, 0.75].map((t) => `M${pts(btP(0, 1 - 2 * t, 41 - t * 5), btP(0, 1 - 2 * t, 17 - t * 2))}`).join("") + [24, 31].map((h) => `M${pts(btP(0, 1, h), btP(0, -1, h * 0.9))}`).join(""),
  near: `M${pts(btP(0, 1), btP(0, 1, 48))}`,
  far: `M${pts(btP(0, -1), btP(0, -1, 42))}`,
};
export const btPoleL = btP(-BT.L - 8, -1);
export const btPoleR = btP(BT.L + 8, -1);
export const btWireMid: Pt = [(btPoleL[0] + btPoleR[0]) / 2, (btPoleL[1] + btPoleR[1]) / 2 - 40];
export const btWire = `M${f(btPoleL[0])} ${f(btPoleL[1] - 64)}Q${f(btWireMid[0])} ${f(btWireMid[1])} ${f(btPoleR[0])} ${f(btPoleR[1] - 64)}`;
export const btBulbs = Array.from({ length: 9 }, (_, i) => {
  const t = (i + 1) / 10;
  const u = 1 - t;
  return { x: f(u * u * btPoleL[0] + 2 * u * t * btWireMid[0] + t * t * btPoleR[0]), y: f(u * u * (btPoleL[1] - 64) + 2 * u * t * btWireMid[1] + t * t * (btPoleR[1] - 64) + 2.5), c: ["o-gold", "o-coral", "o-teal"][i % 3] };
});
export const btRestBall = btP(34, 0.55);
export const btPuddle = btP(-58, 0.15);
export const btPlayers = [
  { k: "a", person: "donald", shirt: "bt-port-royale", shorts: "o-char", skin: "bt-skin-a" },
  { k: "b", person: "wife", shirt: "bt-pink", shorts: "bt-pink", skin: "bt-skin-b" },
];

// 404: finger-drawn in the sand, laid on the ground with the court's oblique projection
export const NF_DIGITS = ["M118 24Q84 78 36 138Q100 146 172 136M130 62Q124 130 128 200", "M290 26C226 14 212 198 280 198C350 198 346 40 276 24", "M458 24Q424 78 376 138Q440 146 512 136M470 62Q464 130 468 200"].join("");
export const NF_GROUND = `matrix(1 ${BT.m} -0.3 0.58 70 50)`;

