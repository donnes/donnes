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

test("the day's cycle: 0 at sunrise, 1 at sunset, 2 at the next sunrise; sunrise and sunset from the sun's declination", () => {
  const [sr, ss] = sunTimes(new Date(noon));
  assert.ok(sr > 5 * 60 && sr < 7 * 60 && ss > 17 * 60 && ss < 19 * 60, "a September day in Florianópolis");
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

test("a live reading is polled once, cached in storage, and read back while fresh", async () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  let calls = 0;
  const fetch = async () => { calls++; return { ok: true, json: async () => ({ current: { temperature_2m: 21, apparent_temperature: 22, weather_code: 63, cloud_cover: 90, wind_speed_10m: 20, wind_gusts_10m: 30, wind_direction_10m: 90, precipitation: 1 }, daily: { sunrise: ["2026-09-22T06:10"], sunset: ["2026-09-22T18:20"] } }) } as Response; };
  const w = createWeather({ words, params: new URLSearchParams(""), storage, fetch: fetch as any, now: () => noon });
  assert.equal(w.stale(), true);
  assert.equal(await w.poll(), true);
  assert.equal(calls, 1);
  assert.equal(w.stale(), false);
  const s = w.readState();
  assert.equal(s.sky, "rain"); assert.equal(s.temp, 21); assert.equal(s.kmh, 20); assert.equal(s.compass, "E"); assert.equal(s.label, "Rain");
  assert.ok(s.windX < 0, "an east wind blows things west (left)");
  const again = createWeather({ words, params: new URLSearchParams(""), storage, now: () => noon + 60_000 });
  assert.equal(again.live?.code, 63, "the cached reading is still good");
  assert.equal(w.timeText(), "12:00");
});
