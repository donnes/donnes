import { usage, type Usage } from "./usage.js";
import type { Context } from "./plan.js";
import { LOCAL_TENNIS, SITUATIONS, parseTennis, type TennisPolicy } from "./tennis.js";
type Result = { policy: TennisPolicy; source: "local" | "typesafe"; usage?: Usage };
export function createTennisCoach(key?: string, limit = 4, request: typeof fetch = fetch, now = Date.now) {
  const local: Result = { policy: LOCAL_TENNIS, source: "local" };
  const cache = new Map<Context, { until: number; result: Result }>();
  const pending = new Map<Context, Promise<Result>>();
  let day = "", calls = 0, next = 0;
  async function generate(context: Context): Promise<Result> {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (day !== today) { day = today; calls = 0; }
    if (!key || calls >= limit || now() < next || context === "wet" || context === "night") return local;
    calls++; next = now() + 60_000;
    let result = local;
    try {
      const response = await request("https://api.typesafe.ai/v1/systemone", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "jev-latest", state: {
          setting: "A married couple enjoying a friendly beach tennis rally. Keep it playful and varied, not relentlessly competitive. Volleys only, no bounce before hitting.",
          weather: context === "windy" ? "Strong wind makes high balls harder to control." : "Calm, dry daylight.",
          situations: {
            balanced: "Player is balanced, rested, and near their home position; opponent is ready.",
            stretched: "Player has just run wide to reach the ball and needs time to recover; opponent is ready.",
            tired: "Player has completed several points or this rally has lasted at least six returns; both need a gentler pace.",
          },
        }, questions: Object.fromEntries(SITUATIONS.map(s => [s, {
          type: "choice", instructions: `Assume the player is in the situation described by \`situations.${s}\`. Which next volley best fits the friendly goal and weather? Judge this situation independently.`,
          criteria: { drive: "A low, direct volley that keeps the rally brisk.", lob: "A high, deep arc that gives the hitter time to recover.", drop: "A soft short volley that invites the opponent toward the net." },
        }])) }),
      });
      if (response.ok) {
        const body = await response.json();
        const policy = parseTennis(Object.fromEntries(SITUATIONS.map(s => [s, body.answers?.[s]?.type === "choice" ? body.answers[s].probabilities : null])));
        if (policy) result = { policy, source: "typesafe", usage: usage(body.model ?? "jev-latest", body.usage?.input_tokens, body.usage?.output_tokens, now()) };
      }
    } catch { /* A missing/slow service never stalls a rally. */ }
    cache.set(context, { until: now() + (result.source === "typesafe" ? 3_600_000 : 300_000), result });
    return result;
  }
  return async (context: Context): Promise<Result> => {
    const hit = cache.get(context);
    if (hit && hit.until > now()) return hit.result;
    const flight = pending.get(context);
    if (flight) return flight;
    const promise = generate(context).finally(() => pending.delete(context));
    pending.set(context, promise);
    return promise;
  };
}
