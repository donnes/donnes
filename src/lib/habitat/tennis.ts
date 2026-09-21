export const SHOTS = ["drive", "lob", "drop"] as const;
export type Shot = typeof SHOTS[number];
export const SITUATIONS = ["balanced", "stretched", "tired"] as const;
export type Situation = typeof SITUATIONS[number];
export type Distribution = Record<Shot, number>;
export type TennisPolicy = Record<Situation, Distribution>;
export const LOCAL_TENNIS: TennisPolicy = {
  balanced: { drive: 0.5, lob: 0.3, drop: 0.2 },
  stretched: { drive: 0.15, lob: 0.8, drop: 0.05 },
  tired: { drive: 0.25, lob: 0.65, drop: 0.1 },
};
export function parseTennis(value: unknown): TennisPolicy | null {
  if (!value || typeof value !== "object") return null;
  const result = {} as TennisPolicy;
  for (const situation of SITUATIONS) {
    const row = (value as Record<string, unknown>)[situation];
    if (!row || typeof row !== "object") return null;
    const weights = row as Distribution;
    if (!SHOTS.every(s => typeof weights[s] === "number" && Number.isFinite(weights[s]) && weights[s] >= 0 && weights[s] <= 1)) return null;
    const sum = SHOTS.reduce((n, s) => n + weights[s], 0);
    if (Math.abs(sum - 1) > 0.02) return null;
    result[situation] = Object.fromEntries(SHOTS.map(s => [s, weights[s] / sum])) as Distribution;
  }
  return result;
}
export function chooseShot(policy: TennisPolicy, situation: Situation, intention: string, random: number): Shot {
  const weights = { ...policy[situation] };
  // A requested rally style is a preference. Recovery still takes priority.
  if (situation === "balanced" && (intention === "lob" || intention === "drop")) weights[intention] += 0.45;
  let point = Math.max(0, Math.min(0.999999, random)) * SHOTS.reduce((n, s) => n + weights[s], 0);
  for (const shot of SHOTS) { point -= weights[shot]; if (point < 0) return shot; }
  return "lob";
}
