import { usage, type Usage } from "./usage.js";
import { ACTIONS, allowed, fallback, parsePlan, type Context, type Plan } from "./plan.js";

type Config = { key?: string; model?: string; dailyCalls: number };
type Result = { plan: Plan; source: "local" | "openrouter"; usage?: Usage };
// Shared within one warm server process. CDN caching also shares successful plans.
// These counters are NOT a distributed spending limit; set a credit limit on the OpenRouter key.
export function createDirector(config: Config, request: typeof fetch = fetch, now = Date.now) {
  const cache = new Map<Context, { until: number; result: Result }>();
  const pending = new Map<Context, Promise<Result>>();
  let day = "", calls = 0, nextCall = 0;
  async function generate(context: Context): Promise<Result> {
    const local: Result = { plan: fallback(context), source: "local" };
    const today = new Date(now()).toISOString().slice(0, 10);
    if (day !== today) { day = today; calls = 0; }
    if (!config.key || calls >= config.dailyCalls || now() < nextCall) return local;
    calls++;
    nextCall = now() + 60_000;
    let result = local;
    try {
      const response = await request("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(12_000),
        headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "HTTP-Referer": "https://donnes.dev", "X-Title": "Donnes beach habitat" },
        body: JSON.stringify({
          model: config.model || "z-ai/glm-5.3-flash",
          max_tokens: 1024,
          reasoning: { effort: "low" },
          provider: { require_parameters: true },
          messages: [
            { role: "system", content: "Direct a quiet illustrated beach. Donald and his wife play beach tennis. Return 4-8 action names, each lasting about 30 seconds. Give rallies variety and a rest, then resume. gull means a bird lands and explores; crab means a crab emerges. No dialogue, prose, coordinates or invented actions. Weather constraints are mandatory." },
            { role: "user", content: `Weather: ${context}. Allowed actions: ${ACTIONS.filter(a => allowed(a, context)).join(",")}. Sequence for this part of the day: ${new Date(now()).getUTCHours()}.` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "beach_plan", strict: true, schema: {
            type: "object", additionalProperties: false, required: ["actions"], properties: {
              actions: { type: "array", minItems: 4, maxItems: 8, items: { type: "string", enum: ACTIONS.filter(a => allowed(a, context)) } },
            },
          } } },
        }),
      });
      if (response.ok) {
        const body = await response.json();
        const plan = parsePlan(JSON.parse(body.choices?.[0]?.message?.content ?? "null"), context);
        if (plan) result = { plan, source: "openrouter", usage: usage(body.model ?? config.model ?? "z-ai/glm-5.3-flash", body.usage?.prompt_tokens, body.usage?.completion_tokens, now()) };
      }
    } catch { /* Timeouts, unsupported providers and malformed plans keep local life running. */ }
    cache.set(context, { until: now() + (result.source === "openrouter" ? 3_600_000 : 300_000), result });
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
