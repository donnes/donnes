import assert from "node:assert/strict";
import { test } from "node:test";
import { createWeatherEndpoint, googleReading } from "../src/lib/beach/google-weather.ts";
import { codeSky } from "../src/lib/beach/weather.ts";

// trimmed from a real currentConditions:lookup answer
const partlyCloudy = {
  weatherCondition: { type: "PARTLY_CLOUDY", description: { text: "Partly cloudy", languageCode: "en" } },
  temperature: { degrees: 21.2, unit: "CELSIUS" }, feelsLikeTemperature: { degrees: 21.6, unit: "CELSIUS" }, cloudCover: 40,
  wind: { direction: { degrees: 130, cardinal: "SOUTHEAST" }, speed: { value: 15, unit: "KILOMETERS_PER_HOUR" }, gust: { value: 26, unit: "KILOMETERS_PER_HOUR" } },
  precipitation: { probability: { percent: 5, type: "RAIN" }, qpf: { quantity: 0, unit: "MILLIMETERS" } },
};

test("Google's conditions become the readings and skies the beach paints", () => {
  assert.deepEqual(googleReading(partlyCloudy), { temp: 21.2, feels: 21.6, code: 2, cover: 40, kmh: 15, gust: 26, dir: 130, precip: 0 });
  const sky = (type: string, cover = 50, quantity = 0) => {
    const r = googleReading({ ...partlyCloudy, weatherCondition: { type }, cloudCover: cover, precipitation: { qpf: { quantity } } });
    return r && codeSky(r.code, r.cover, r.precip);
  };
  assert.equal(sky("CLEAR", 5), "clear");
  assert.equal(sky("CLOUDY", 100), "cloudy");
  assert.equal(sky("CHANCE_OF_SHOWERS", 70), "cloudy", "a chance of rain is not rain");
  assert.equal(sky("LIGHT_RAIN_SHOWERS", 90, 0.5), "rain");
  assert.equal(sky("HEAVY_RAIN", 100, 6), "heavy");
  assert.equal(sky("THUNDERSTORM", 100, 3), "storm");
  assert.equal(sky("SOMETHING_NEW", 90), "cloudy", "an unknown type falls back to the cloud cover");
  assert.equal(googleReading({ weatherCondition: { type: "CLEAR" } }), null, "no temperature, no reading");
});

test("the endpoint: the key stays in a header, answers are cached at the edge, failures send the client to Open-Meteo", async () => {
  let sent: Headers | undefined;
  const fetch: typeof globalThis.fetch = async (_input, init) => { sent = new Headers(init?.headers); return Response.json(partlyCloudy); };
  const ok = await createWeatherEndpoint("k3y", fetch)();
  assert.equal(ok.status, 200);
  assert.equal(sent?.get("X-Goog-Api-Key"), "k3y");
  assert.match(ok.headers.get("Cache-Control") ?? "", /s-maxage=600/);
  assert.equal((await ok.json()).temp, 21.2);

  let called = false;
  const noKey = await createWeatherEndpoint(undefined, async () => { called = true; return Response.json(partlyCloudy); })();
  assert.equal(noKey.status, 503);
  assert.equal(called, false);
  const down = await createWeatherEndpoint("k3y", async () => new Response("quota", { status: 429 }))();
  assert.equal(down.status, 503);
});
