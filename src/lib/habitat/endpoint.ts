import { createTennisCoach } from "./typesafe.js";
import { createDirector } from "./director.js";
import { CONTEXTS, type Context } from "./plan.js";
export function createEndpoint(env: Record<string, string | undefined>) {
  const configuredLimit = Number(env.HABITAT_MAX_CALLS_PER_DAY ?? 8);
  const direct = createDirector({
    key: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    dailyCalls: Number.isFinite(configuredLimit) ? Math.max(0, Math.min(24, Math.floor(configuredLimit))) : 8,
  });
  const coachLimit = Number(env.TYPESAFE_MAX_CALLS_PER_DAY ?? 4);
  const coach = createTennisCoach(env.TYPESAFE_API_KEY, Number.isFinite(coachLimit) ? Math.max(0, Math.min(12, Math.floor(coachLimit))) : 4);
  return async (url: URL, method = "GET") => {
    if (method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
    const context = url.searchParams.get("context") as Context;
    if (!CONTEXTS.includes(context) || [...url.searchParams.keys()].some(k => k !== "context") || url.searchParams.getAll("context").length !== 1) {
      return new Response("Invalid habitat context", { status: 400 });
    }
    const [result, tennis] = await Promise.all([direct(context), coach(context)]);
    return Response.json({ ...result, tennis }, { headers: {
      "Cache-Control": result.source === "openrouter" ? "public, max-age=1800, s-maxage=3600" : "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  };
}
