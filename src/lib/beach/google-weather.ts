// The beach's live weather from Google's Weather API, served by src/worker.ts so the key stays on the server.
// Google blends its models with live observations, so it tracks Jurerê far better than one raw model (Open-Meteo's
// best match painted forecast drizzle on dry days). The reading speaks the WMO codes the client already paints.

/** what the beach needs to know about the weather right now (metric: °C, km/h, mm in the last hour) */
export type Reading = { temp: number; feels: number; code: number; cover: number; kmh: number; gust: number; dir: number; precip: number };

/** the slice of `currentConditions:lookup` we read */
type Conditions = {
  weatherCondition?: { type?: string };
  temperature?: { degrees?: number };
  feelsLikeTemperature?: { degrees?: number };
  cloudCover?: number;
  wind?: { direction?: { degrees?: number }; speed?: { value?: number }; gust?: { value?: number } };
  precipitation?: { qpf?: { quantity?: number } };
};

// Google's condition types → WMO codes; a "chance of" is not rain yet, so it stays dry and grey
const WMO: Record<string, number> = {
  CLEAR: 0, MOSTLY_CLEAR: 1, WINDY: 1, PARTLY_CLOUDY: 2, MOSTLY_CLOUDY: 2, CLOUDY: 3, CHANCE_OF_SHOWERS: 3, CHANCE_OF_SNOW_SHOWERS: 3,
  LIGHT_RAIN: 61, LIGHT_TO_MODERATE_RAIN: 61, LIGHT_RAIN_SHOWERS: 80, SCATTERED_SHOWERS: 80,
  RAIN: 63, WIND_AND_RAIN: 63, RAIN_SHOWERS: 81,
  HEAVY_RAIN: 65, MODERATE_TO_HEAVY_RAIN: 65, RAIN_PERIODICALLY_HEAVY: 65, HEAVY_RAIN_SHOWERS: 82,
  THUNDERSTORM: 95, THUNDERSHOWER: 95, LIGHT_THUNDERSTORM_RAIN: 95, SCATTERED_THUNDERSTORMS: 95, HEAVY_THUNDERSTORM: 95, HAIL: 96, HAIL_SHOWERS: 96,
};

export function googleReading(c: Conditions): Reading | null {
  const temp = c.temperature?.degrees;
  if (typeof temp !== "number") return null;
  const cover = c.cloudCover ?? 0;
  const kmh = c.wind?.speed?.value ?? 0;
  return {
    temp, feels: c.feelsLikeTemperature?.degrees ?? temp,
    code: WMO[c.weatherCondition?.type ?? ""] ?? (cover >= 85 ? 3 : cover >= 35 ? 2 : 0), // snow and unknown types: just the clouds
    cover, kmh, gust: c.wind?.gust?.value ?? kmh, dir: c.wind?.direction?.degrees ?? 0, precip: c.precipitation?.qpf?.quantity ?? 0,
  };
}

const LOOKUP = "https://weather.googleapis.com/v1/currentConditions:lookup?location.latitude=-27.44&location.longitude=-48.49";

/** GET /api/weather: the current Reading, cached at the edge for ten minutes; 503 without a key or an answer (the client falls back to Open-Meteo) */
export function createWeatherEndpoint(key: string | undefined, doFetch: typeof fetch = fetch) {
  return async (): Promise<Response> => {
    let reading: Reading | null = null;
    if (key) {
      try {
        const res = await doFetch(LOOKUP, { headers: { "X-Goog-Api-Key": key }, signal: AbortSignal.timeout(4000) });
        if (res.ok) reading = googleReading(await res.json());
      } catch {
        /* Google is slow or down: the client asks Open-Meteo */
      }
    }
    return reading
      ? Response.json(reading, { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600" } })
      : new Response("No live weather", { status: 503, headers: { "Cache-Control": "public, s-maxage=60" } });
  };
}
