import assert from "node:assert/strict";
import { test } from "node:test";
import { createWeather, codeSky, cycAt, sunTimes, moonPath, hhmm } from "../src/lib/beach/weather.ts";

const words = { windy: "Windy", sky: { clear: "Clear", rain: "Rain" }, code: { rain: "Rain", overcast: "Overcast" }, compass: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] };
const noon = Date.UTC(2026, 8, 22, 15, 0); // 12:00 in São Paulo

test("Open-Meteo codes map to the eight skies we paint", () => {
  assert.equal(codeSky(0, 10, 0), "clear");
  assert.equal(codeSky(1, 50, 0), "partly");
  assert.equal(codeSky(3, 0, 0), "cloudy");
  assert.equal(codeSky(45, 0, 0), "fog");
  assert.equal(codeSky(53, 0, 0), "drizzle");
  assert.equal(codeSky(61, 0, 0), "rain");
  assert.equal(codeSky(61, 0, 5), "heavy");
  assert.equal(codeSky(95, 0, 0), "storm");
});

test("the day's cycle: 0 at sunrise, 1 at sunset, 2 at the next sunrise; sunrise and sunset from the sun's declination and the equation of time", () => {
  const [sr, ss] = sunTimes(new Date(noon));
  assert.ok(sr > 5 * 60 && sr < 7 * 60 && ss > 17 * 60 && ss < 19 * 60, "a September day in Florianópolis");
  const [oct18rise, oct18set] = sunTimes(new Date(Date.UTC(2026, 9, 18, 15)));
  assert.ok(Math.abs(oct18rise - (5 * 60 + 34)) < 4 && Math.abs(oct18set - (18 * 60 + 23)) < 4, "within minutes of the published 05:34 and 18:23");
  assert.equal(cycAt(sr, sr, ss), 0);
  assert.ok(Math.abs(cycAt((sr + ss) / 2, sr, ss) - 0.5) < 1e-9);
  assert.equal(cycAt(ss, sr, ss), 1);
  assert.ok(cycAt(ss + 60, sr, ss) > 1 && cycAt(sr - 60, sr, ss) < 2);
  assert.equal(hhmm("7:05"), 425);
  assert.equal(hhmm("nope"), null);
  assert.match(moonPath(0.5), /^M0 -30A30 30 0 0 1 0 30A30.0 30/);
});

test("previews win over live data; the chip labels come from the words", () => {
  const w = createWeather({ words, params: new URLSearchParams("wx=rain&tod=night&temp=12"), storage: null, now: () => noon });
  const s = w.readState();
  assert.equal(s.sky, "rain"); assert.equal(s.phase, "night"); assert.equal(s.cyc, 1.5);
  assert.equal(s.temp, 12); assert.equal(s.label, "Rain"); assert.equal(s.preview, "rain · night");
  const wind = createWeather({ words, params: new URLSearchParams("wx=wind"), storage: null, now: () => noon }).readState();
  assert.equal(wind.sky, "clear"); assert.equal(wind.label, "Windy"); assert.ok(wind.wind > 0.7);
});

const openMeteo = { current: { temperature_2m: 18, apparent_temperature: 17, weather_code: 51, cloud_cover: 60, wind_speed_10m: 10, wind_gusts_10m: 20, wind_direction_10m: 180, precipitation: 0.1 } };
/** a fetch that answers /api/weather with `google` (a 503 when null) and anything else with Open-Meteo, counting the calls */
function fakeFetch(google: object | null) {
  const calls: string[] = [];
  const fetch: typeof globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url.startsWith("/api/") ? "google" : "open-meteo");
    return url.startsWith("/api/") ? (google ? Response.json(google) : new Response("No live weather", { status: 503 })) : Response.json(openMeteo);
  };
  return { fetch, calls };
}

test("a live reading comes from Google first, is cached in storage, and read back while fresh", async () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  const { fetch, calls } = fakeFetch({ temp: 21, feels: 22, code: 63, cover: 90, kmh: 20, gust: 30, dir: 90, precip: 1 });
  const w = createWeather({ words, params: new URLSearchParams(""), storage, fetch, now: () => noon });
  assert.equal(w.stale(), true);
  assert.equal(await w.poll(), true);
  assert.deepEqual(calls, ["google"]);
  assert.equal(w.stale(), false);
  const s = w.readState();
  assert.equal(s.sky, "rain"); assert.equal(s.temp, 21); assert.equal(s.kmh, 20); assert.equal(s.compass, "E"); assert.equal(s.label, "Rain");
  assert.ok(s.windX < 0, "an east wind blows things west (left)");
  const again = createWeather({ words, params: new URLSearchParams(""), storage, now: () => noon + 60_000 });
  assert.equal(again.live?.code, 63, "the cached reading is still good");
  assert.equal(w.timeText(), "12:00");
});

test("without Google the beach falls back to Open-Meteo", async () => {
  const { fetch, calls } = fakeFetch(null);
  const w = createWeather({ words, params: new URLSearchParams(""), storage: null, fetch, now: () => noon });
  assert.equal(await w.poll(), true);
  assert.deepEqual(calls, ["google", "open-meteo"]);
  assert.equal(w.readState().sky, "drizzle");
  assert.equal(w.readState().temp, 18);
});
