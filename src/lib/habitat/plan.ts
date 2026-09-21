export const ACTIONS = ["rally", "lob", "drop", "break", "gull", "crab"] as const;
export type Action = (typeof ACTIONS)[number];
export const CONTEXTS = ["sunny", "windy", "wet", "night"] as const;
export type Context = (typeof CONTEXTS)[number];
export type Plan = { actions: Action[] };
export function allowed(action: Action, context: Context): boolean {
  if (context === "wet" || context === "night") return action === "crab" || action === "break";
  return context !== "windy" || action !== "gull";
}
export function parsePlan(value: unknown, context: Context): Plan | null {
  if (!value || typeof value !== "object" || !("actions" in value)) return null;
  const actions = value.actions;
  if (!Array.isArray(actions) || actions.length < 4 || actions.length > 8) return null;
  if (!actions.every((a): a is Action => ACTIONS.includes(a) && allowed(a, context))) return null;
  return { actions };
}
export function fallback(context: Context): Plan {
  if (context === "wet" || context === "night") return { actions: ["crab", "break", "break", "crab"] };
  return { actions: ["rally", "lob", "break", context === "sunny" ? "gull" : "crab", "drop", "rally", "crab", "break"] };
}
