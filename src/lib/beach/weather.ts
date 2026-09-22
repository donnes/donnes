// What the beach is like right now: the São Paulo clock with real sunrise and sunset (astronomical until Open-Meteo
// answers), the live weather re-polled every ten minutes while the tab is visible, and the SceneState derived from
// them, or from a labelled `?wx=` / `?tod=` / `?t=` preview.
import type { Sky, Phase, SceneState, Env } from "./scene.ts";
import { clamp } from "./math.ts";

// per-sky look: every number is a channel the scene eases towards (see the channels)
export type Look = Omit<Env, "tr" | "tg" | "tb" | "wind" | "windX" | "cyc"> & { tc: number[] };
const dry = { rFirst: 0, rFar: 0, rMid: 0, rNear: 0, rSpd: 1, storm: 0, spray: 0, wet: 0 };
export const SKY: Record<Sky, Look> = {
  clear: { ...dry, cover: 0.08, deck: 0, fog: 0, desat: 0, tint: 0, dark: 0, tc: [150, 162, 178], sun: 1, glit: 1, shade: 1, birds: 1.3, sea: 1, amp: 1 },
  partly: { ...dry, cover: 0.5, deck: 0, fog: 0, desat: 0.06, tint: 0.03, dark: 0, tc: [150, 162, 178], sun: 0.96, glit: 0.75, shade: 0.8, birds: 1, sea: 1, amp: 1 },
  cloudy: { ...dry, cover: 1, deck: 1, fog: 0.12, desat: 0.5, tint: 0.3, dark: 0.05, tc: [158, 170, 184], sun: 0.1, glit: 0, shade: 0.12, birds: 0.4, sea: 0.68, amp: 1.08 },
  fog: { ...dry, cover: 0.3, deck: 0.45, fog: 1, desat: 0.55, tint: 0.52, dark: 0, tc: [216, 222, 226], sun: 0.3, glit: 0, shade: 0.08, birds: 0.2, sea: 0.62, amp: 0.8 },
  drizzle: { cover: 0.85, deck: 0.9, fog: 0.3, rFirst: 0.5, rFar: 0.6, rMid: 0.3, rNear: 0, rSpd: 0.6, storm: 0, spray: 0, wet: 0.55, desat: 0.5, tint: 0.34, dark: 0.1, tc: [140, 154, 170], sun: 0.05, glit: 0, shade: 0.08, birds: 0.1, sea: 0.85, amp: 1 },
  rain: { cover: 1, deck: 1, fog: 0.22, rFirst: 0.6, rFar: 0.65, rMid: 0.75, rNear: 0.45, rSpd: 1, storm: 0, spray: 0.15, wet: 1, desat: 0.55, tint: 0.38, dark: 0.2, tc: [120, 134, 150], sun: 0, glit: 0, shade: 0.05, birds: 0, sea: 1.1, amp: 1.15 },
  heavy: { cover: 1, deck: 1, fog: 0.4, rFirst: 0.75, rFar: 0.85, rMid: 0.95, rNear: 0.9, rSpd: 1.3, storm: 0, spray: 1, wet: 1, desat: 0.6, tint: 0.42, dark: 0.3, tc: [110, 124, 142], sun: 0, glit: 0, shade: 0.04, birds: 0, sea: 1.3, amp: 1.32 },
  storm: { cover: 1, deck: 1, fog: 0.3, rFirst: 0.75, rFar: 0.85, rMid: 0.95, rNear: 0.95, rSpd: 1.5, storm: 1, spray: 0.9, wet: 1, desat: 0.62, tint: 0.46, dark: 0.42, tc: [74, 84, 108], sun: 0, glit: 0, shade: 0.03, birds: 0, sea: 1.75, amp: 1.7 },
};
// per-phase life: how busy the beach is, and where on `cyc` a `?tod=` preview lands
export const PHASES: Record<Phase, { at: number; life: number; boats: boolean }> = {
  night: { at: 1.5, life: 0, boats: true }, dawn: { at: 0.06, life: 0.5, boats: true }, morning: { at: 0.19, life: 0.9, boats: true }, midday: { at: 0.5, life: 1, boats: true },
  afternoon: { at: 0.7, life: 1.5, boats: true }, golden: { at: 0.925, life: 1, boats: true }, dusk: { at: 1.02, life: 0.4, boats: true },
};
export const SKIES = Object.keys(SKY) as Sky[];
export const PHASE_NAMES = Object.keys(PHASES) as Phase[];
export const phaseOf = (c: number): Phase => (c < 0.09 ? "dawn" : c < 0.3 ? "morning" : c < 0.6 ? "midday" : c < 0.8 ? "afternoon" : c < 0.965 ? "golden" : c < 1.1 ? "dusk" : c < 1.93 ? "night" : "dawn");
export const WX_PRESETS: Record<string, { sky: Sky; kmh: number; gust: number; dir: number; temp: number }> = {
  clear: { sky: "clear", kmh: 7, gust: 12, dir: 60, temp: 26 }, partly: { sky: "partly", kmh: 12, gust: 20, dir: 80, temp: 24 }, cloudy: { sky: "cloudy", kmh: 10, gust: 16, dir: 120, temp: 20 },
  fog: { sky: "fog", kmh: 3, gust: 5, dir: 200, temp: 17 }, drizzle: { sky: "drizzle", kmh: 9, gust: 15, dir: 140, temp: 19 }, rain: { sky: "rain", kmh: 16, gust: 28, dir: 140, temp: 19 },
  heavy: { sky: "heavy", kmh: 24, gust: 40, dir: 150, temp: 18 }, storm: { sky: "storm", kmh: 42, gust: 70, dir: 240, temp: 18 }, wind: { sky: "clear", kmh: 38, gust: 56, dir: 50, temp: 23 },
};
/** Open-Meteo WMO code + cloud cover + precipitation → the sky we paint */
export const codeSky = (code: number, cover: number, precip: number): Sky =>
  code >= 95 ? "storm" : code === 65 || code === 67 || code === 82 || code === 75 || code === 86 || precip >= 4 ? "heavy" : (code >= 61 && code <= 66) || (code >= 71 && code <= 81) || code === 85 ? "rain" : code >= 51 && code <= 57 ? "drizzle" : code === 45 || code === 48 ? "fog" : code === 3 || cover >= 85 ? "cloudy" : code === 2 || cover >= 35 ? "partly" : "clear";
export const codeKey = (c: number) =>
  c === 0 ? "clear" : c === 1 ? "mostlyClear" : c === 2 ? "partly" : c === 3 ? "overcast" : c <= 48 ? "fog" : c <= 57 ? "drizzle" : c === 61 || c === 80 ? "lightRain" : c === 63 || c === 81 ? "rain" : c === 65 || c === 82 ? "heavyRain" : c <= 67 ? "freezingRain" : c <= 77 ? "snow" : c <= 86 ? "snowShowers" : "storm";

/* ── the clock ── */
export const hhmm = (v: string | null): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v || "");
  return m ? (Number(m[1]) % 24) * 60 + Number(m[2]) : null;
};
/** [sunrise, sunset] in minutes for Jurerê today, from the sun's declination */
export function sunTimes(date = new Date()): [number, number] {
  const n = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5);
  const decl = -23.44 * Math.cos((2 * Math.PI * (n + 10)) / 365) * (Math.PI / 180);
  const half = (Math.acos(clamp(-Math.tan(-27.44 * (Math.PI / 180)) * Math.tan(decl), -1, 1)) * 720) / Math.PI;
  return [734 - half, 734 + half]; // solar noon ≈ 12:14 at 48.49°W in UTC−3
}
/** minutes of the day → `cyc`: 0 at sunrise, 1 at sunset, 2 at the next sunrise */
export function cycAt(min: number, sr: number, ss: number): number {
  if (min >= sr && min < ss) return (min - sr) / (ss - sr);
  return 1 + (min >= ss ? min - ss : min + 1440 - ss) / (1440 - (ss - sr));
}
/** the lit part of the moon, as a path: `phase` 0 new · 0.25 first quarter · 0.5 full (southern hemisphere: a waxing moon is lit on its left) */
export function moonPath(phase: number): string {
  const p = clamp(phase, 0, 0.999);
  const R = 30;
  const c = Math.cos(2 * Math.PI * p);
  const wax = p < 0.5;
  return `M0 ${-R}A${R} ${R} 0 0 ${wax ? 0 : 1} 0 ${R}A${(Math.abs(c) * R).toFixed(1)} ${R} 0 0 ${c > 0 === wax ? 1 : 0} 0 ${-R}Z`;
}
export const moonPhaseNow = (nowMs: number) => ((((nowMs / 864e5 - 10962.76) % 29.530588) + 29.530588) % 29.530588) / 29.530588; // since the new moon of 2000-01-06

/* ── live weather ── */
export type Live = { at: number; temp: number; feels: number; code: number; cover: number; kmh: number; gust: number; dir: number; precip: number; sunrise: number; sunset: number };
export const WX_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-27.44&longitude=-48.49&current=temperature_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day,precipitation,rain,showers&daily=sunrise,sunset&forecast_days=1&timezone=America%2FSao_Paulo";
export const WX_KEY = "jb-wx-v2";
export const POLL_MS = 10 * 60 * 1000;

export type WeatherWords = { windy?: string; sky?: Record<string, string>; code?: Record<string, string>; compass?: string[] };
export type Overrides = { wx: string; tod: Phase | ""; temp: number };
export type WeatherDeps = {
  words: WeatherWords;
  params: URLSearchParams;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  fetch?: typeof fetch;
  now?: () => number;
};

export function createWeather(deps: WeatherDeps) {
  const T = deps.words;
  const params = deps.params;
  const now = deps.now ?? (() => Date.now());
  const doFetch = deps.fetch ?? ((input, init) => fetch(input, init));
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false });
  const fakeClock = hhmm(params.get("t"));
  const clockMin = () => fakeClock ?? hhmm(fmt.format(new Date(now()))) ?? 720;
  const codeName = (c: number) => T.code?.[codeKey(c)] ?? "";
  let live: Live | null = null;
  try {
    const c = JSON.parse(deps.storage?.getItem(WX_KEY) || "null") as Live | null;
    if (c && typeof c.code === "number" && now() - c.at < 45 * 60 * 1000) live = c;
  } catch {
    /* no cache */
  }
  /** asks Open-Meteo; resolves true when a fresh reading arrived */
  async function poll(): Promise<boolean> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    try {
      const res = await doFetch(WX_URL, { signal: ctl.signal });
      if (!res.ok) return false;
      const j = await res.json();
      const cur = j?.current;
      if (!cur || typeof cur.weather_code !== "number") return false;
      const [sr0, ss0] = sunTimes(new Date(now()));
      live = {
        at: now(), temp: Number(cur.temperature_2m), feels: Number(cur.apparent_temperature), code: cur.weather_code, cover: Number(cur.cloud_cover) || 0,
        kmh: Number(cur.wind_speed_10m) || 0, gust: Number(cur.wind_gusts_10m) || Number(cur.wind_speed_10m) || 0, dir: Number(cur.wind_direction_10m) || 0,
        precip: Math.max(Number(cur.precipitation) || 0, Number(cur.rain) || 0, Number(cur.showers) || 0),
        sunrise: hhmm(String(j?.daily?.sunrise?.[0] || "").slice(11, 16)) ?? sr0, sunset: hhmm(String(j?.daily?.sunset?.[0] || "").slice(11, 16)) ?? ss0,
      };
      try {
        deps.storage?.setItem(WX_KEY, JSON.stringify(live));
      } catch {
        /* private mode */
      }
      return true;
    } catch {
      /* no weather today: the beach keeps the real clock and its last known sky */
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
  const stale = () => !live || now() - live.at > POLL_MS - 30000;
  /** the URL previews: `?wx=`, `?tod=`, `?temp=` (the demo walks these) */
  const over: Overrides = { wx: params.get("wx") || "", tod: (params.get("tod") === "day" ? "midday" : params.get("tod") || "") as Phase | "", temp: params.get("temp") ? Number(params.get("temp")) : NaN };
  function readState(): SceneState {
    const [sr, ss] = live ? [live.sunrise, live.sunset] : sunTimes(new Date(now()));
    const todP = PHASE_NAMES.includes(over.tod as Phase) ? (over.tod as Phase) : null;
    const cyc = todP ? PHASES[todP].at : cycAt(clockMin(), sr, ss);
    const pre = WX_PRESETS[over.wx];
    const w = pre ? { ...pre, cover: SKY[pre.sky].cover * 100, label: (over.wx === "wind" ? T.windy : T.sky?.[pre.sky]) ?? "" } : live ? { sky: codeSky(live.code, live.cover, live.precip), kmh: live.kmh, gust: live.gust, dir: live.dir, temp: live.temp, cover: live.cover, label: codeName(live.code) } : null;
    const blowsTo = w ? -Math.sin((w.dir * Math.PI) / 180) : -0.7; // wind_direction is where it comes FROM; the beach faces north
    const sky = w?.sky ?? "clear";
    return {
      sky, phase: todP ?? phaseOf(cyc), cyc,
      cover: w ? (sky === "clear" || sky === "partly" ? clamp(w.cover / 100, 0.04, 0.7) : SKY[sky].cover) : 0.2,
      wind: w ? clamp((w.kmh * 0.6 + w.gust * 0.4 - 4) / 40, 0, 1) : 0.15,
      windX: Math.abs(blowsTo) < 0.25 ? (blowsTo < 0 ? -0.25 : 0.25) : blowsTo,
      kmh: w ? Math.round(w.kmh) : 0, compass: w ? (T.compass?.[Math.round(w.dir / 45) % 8] ?? "") : "", temp: Number.isFinite(over.temp) ? over.temp : w ? w.temp : null, label: w ? w.label : "",
      preview: [pre ? over.wx : "", todP ?? (fakeClock !== null ? params.get("t") : "")].filter(Boolean).join(" · "),
    };
  }
  /** the clock's text: hh:mm in São Paulo, or the `?t=` preview */
  const timeText = () => (fakeClock !== null ? (params.get("t") || "").padStart(5, "0") : fmt.format(new Date(now())));
  /** the moon tonight, or `?moon=0…1` */
  const moon = () => {
    const forced = Number(params.get("moon"));
    return moonPath(params.get("moon") && Number.isFinite(forced) ? forced : moonPhaseNow(now()));
  };
  return { readState, poll, stale, over, timeText, moon, get live() { return live; }, fakeClock };
}
export type Weather = ReturnType<typeof createWeather>;
