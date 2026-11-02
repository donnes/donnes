// Serves the static site and the two endpoints that hold server-side keys. Only `/` and `/api/*` reach this code
// (`run_worker_first` in wrangler.jsonc); Cloudflare's asset server answers everything else.
import { createWeatherEndpoint } from "./lib/beach/google-weather.ts";
import { type HabitatEnv, createEndpoint } from "./lib/habitat/endpoint.ts";

type Env = HabitatEnv & {
  ASSETS: { fetch: typeof fetch };
  GOOGLE_WEATHER_API_KEY?: string;
};
type Context = { waitUntil(promise: Promise<unknown>): void };

// Built once per isolate: the director and coach keep their call budgets and in-flight requests in these closures
let endpoints:
  | {
      habitat: ReturnType<typeof createEndpoint>;
      weather: ReturnType<typeof createWeatherEndpoint>;
    }
  | undefined;

// Workers don't cache their own responses, so `s-maxage` only takes effect through the Cache API.
// This is what keeps paid Google and OpenRouter calls bounded per data center.
async function cached(
  request: Request,
  ctx: Context,
  respond: () => Promise<Response>,
) {
  if (request.method !== "GET") return respond();
  const cache = await caches.open("api");
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await respond();
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

async function home(request: Request, env: Env) {
  const wantsMarkdown = request.headers
    .get("accept")
    ?.includes("text/markdown");
  const asset = await env.ASSETS.fetch(
    wantsMarkdown ? new URL("/llms.txt", request.url) : request,
  );
  const response = new Response(asset.body, asset);
  response.headers.set(
    "Link",
    '</llms.txt>; rel="describedby"; type="text/plain"',
  );
  response.headers.append("Vary", "Accept");
  if (wantsMarkdown)
    response.headers.set("Content-Type", "text/markdown; charset=utf-8");
  return response;
}

export default {
  async fetch(request: Request, env: Env, ctx: Context) {
    const url = new URL(request.url);
    if (url.pathname === "/") return home(request, env);
    endpoints ??= {
      habitat: createEndpoint(env),
      weather: createWeatherEndpoint(env.GOOGLE_WEATHER_API_KEY),
    };
    const { habitat, weather } = endpoints;
    if (url.pathname === "/api/habitat")
      return cached(request, ctx, () => habitat(url, request.method));
    if (url.pathname === "/api/weather") return cached(request, ctx, weather);
    return env.ASSETS.fetch(request);
  },
};
