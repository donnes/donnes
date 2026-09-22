// The shoreline and the painting's fixed lines, shared by the build-time geometry and the scene script.
export type Pt = [number, number];
export const f = (n: number) => Math.round(n * 10) / 10;
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function smooth(pts: Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
/** y of a polyline at x: linear between its points, flat beyond its ends */
export function yAt(pts: readonly (readonly number[])[], x: number): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x <= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return pts[pts.length - 1][1];
}

// camera: low and close. Sky is a slim band, the shore sweeps gently across the whole frame.
export const HORIZON = 235;
export const D = 380;
export const SHORE: Pt[] = [[-120, 596], [150, 588], [420, 571], [700, 546], [980, 518], [1250, 493], [1500, 474], [1720, 463]];
