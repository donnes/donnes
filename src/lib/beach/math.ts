export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** smoothstep */
export const ease = (t: number) => t * t * (3 - 2 * t);
/** a uniform number in [a, b) from a unit random */
export const between = (random: () => number, a: number, b: number) => a + random() * (b - a);
