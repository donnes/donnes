// The habitat player: picks the beach's context, asks the Director for a Plan and the Coach for a Policy (once per context,
// at most twice a visit), and plays the Plan's actions, thirty seconds each. It changes intentions, never positions or the clock.
import type { SceneView } from "./scene.ts";
import { fallback, parsePlan, allowed, type Action, type Context, type Plan } from "../habitat/plan.ts";
import { LOCAL_TENNIS, parseTennis, type TennisPolicy } from "../habitat/tennis.ts";

export type HabitatEvent = { action: Action; invite?: "gull" | "crab" };
export type HabitatDeps = {
  fetch?: typeof fetch;
  /** the habitat board: what the providers answered */
  report(data: any): void;
  /** the habitat board: an action has started (only while the court is in play) */
  record(action: Action): void;
};

export function createHabitatPlayer(scene: SceneView, deps: HabitatDeps) {
  const doFetch = deps.fetch ?? ((input, init) => fetch(input, init));
  const root = scene.root;
  let policy: TennisPolicy = LOCAL_TENNIS;
  const h = { action: "rally" as Action, remaining: 0, index: 0, context: "sunny" as Context, plan: fallback("sunny") as Plan, requests: 0, requested: new Set<Context>(), fatigue: 0, resting: false };
  root.dataset.habitatSource = "local";
  const contextNow = (): Context => root.hasAttribute("data-night") ? "night"
    : scene.env.rMid > 0.1 || scene.env.storm > 0.1 || scene.court === "wet" ? "wet" : scene.env.wind > 0.55 ? "windy" : "sunny";
  async function request(context: Context) {
    if (scene.notFound || h.requests >= 2 || h.requested.has(context)) return;
    h.requested.add(context);
    h.requests++;
    try {
      const response = await doFetch(`/api/habitat?context=${context}`, { cache: "no-cache", signal: AbortSignal.timeout(14_000) });
      if (!response.ok) return;
      const data = await response.json();
      if (h.context === context) {
        deps.report(data);
        policy = parseTennis(data.tennis?.policy) ?? LOCAL_TENNIS;
        root.dataset.tennisSource = data.tennis?.source === "typesafe" ? "typesafe" : "local";
      }
      const plan = parsePlan(data.plan, context);
      if (plan && h.context === context) {
        h.plan = plan;
        h.index = 0;
        root.dataset.habitatSource = data.source === "openrouter" ? "openrouter" : "local";
      }
    } catch { /* The local plan is already playing. No retries or catch-up calls. */ }
  }
  /** advances the plan; returns the action that just started, if one did */
  function tick(dt: number): HabitatEvent | undefined {
    // The task loop pauses for intro, hidden tabs, mobile sheets and reduced motion.
    const context = contextNow();
    if (context !== h.context) {
      h.context = context;
      policy = LOCAL_TENNIS;
      deps.report({ source: "local", tennis: { source: "local" } });
      root.dataset.tennisSource = "local";
      h.plan = fallback(context);
      h.index = 0;
      h.remaining = 0;
      root.dataset.habitatSource = "local";
    }
    if (h.requests < 2 && !h.requested.has(context)) void request(context);
    // A rest lasts its full duration after the players have retrieved the ball.
    if (h.action === "break" && scene.court === "play" && !h.resting && h.remaining > 0) return;
    h.remaining -= dt;
    if (h.remaining > 0) return;
    const next = h.plan.actions[h.index++ % h.plan.actions.length];
    h.action = allowed(next, context) ? next : "break";
    if (h.fatigue >= 6 && context !== "wet" && context !== "night") h.action = "break";
    h.resting = false;
    h.remaining = h.action === "break" ? 18 : 30;
    if (h.action === "break") h.fatigue = 0;
    root.dataset.habitat = h.action;
    if (scene.court === "play") deps.record(h.action);
    return { action: h.action, invite: h.action === "gull" ? "gull" : h.action === "crab" ? "crab" : undefined };
  }
  return {
    tick,
    /** what the beach intends right now: the rally reads it as a shot preference */
    get action() { return h.action; },
    get context() { return h.context; },
    get policy() { return policy; },
    get fatigue() { return h.fatigue; },
    get resting() { return h.resting; },
    /** the rally: a point was played */
    tire() { h.fatigue++; },
    /** the rally: a new match starts fresh */
    refresh() { h.fatigue = 0; },
    /** the rally: the players have retrieved the ball and are resting */
    rested() { h.resting = true; },
    get plan() { return h.plan; },
  };
}
export type HabitatPlayer = ReturnType<typeof createHabitatPlayer>;
