// The Scene: the painted beach as it is right now. Created once by the page and handed to every actor.
// Actors get the read-only view; only the channels task, measure() and the pointer listener hold the mutable handle.

export type Sky = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "heavy" | "storm";
export type Phase = "night" | "dawn" | "morning" | "midday" | "afternoon" | "golden" | "dusk";
/** what the beach is like right now: real data, or a labelled preview */
export type SceneState = { sky: Sky; phase: Phase; cyc: number; cover: number; wind: number; windX: number; kmh: number; compass: string; temp: number | null; label: string; preview: string };

/** the channels: every continuous quantity the scene eases towards its state. `cyc` is the time of day, 0 = sunrise, 1 = sunset, 2 = the next sunrise */
export type Env = {
  cover: number; deck: number; fog: number; rFirst: number; rFar: number; rMid: number; rNear: number; rSpd: number; storm: number; spray: number; wet: number;
  desat: number; tint: number; dark: number; tr: number; tg: number; tb: number; sun: number; glit: number; shade: number; birds: number; sea: number; amp: number;
  wind: number; windX: number; cyc: number;
};

/** painting → screen: the painting is 1600×1000, scaled to cover the viewport */
export type Fit = { s: number; ox: number; oy: number; left: number; width: number; portrait: boolean };

/** what this device may do. `lite`: phones, tablets and narrow windows get the cheap scene. `calm`: reduced motion. `sheet`: phone-width panels. */
export type Caps = { readonly lite: boolean; readonly calm: boolean; readonly sheet: boolean };

/** the beach tennis court: a rally, the rackets waiting by the net, or the court left to the weather */
export type Court = "play" | "rest" | "wet";

/** where the sun (by day) or the moon (by night) is, in painting coordinates */
export type Lum = { x: number; y: number; sunUp: number; elev: number; side: number; cross: number };

export type Pointer = { x: number; y: number };

export type Scene = {
  readonly root: HTMLElement;
  /** the 404 beach: nobody plays and no AI is asked */
  readonly notFound: boolean;
  readonly caps: Caps;
  readonly random: () => number;
  fit: Fit;
  env: Env;
  state: SceneState | null;
  pointer: Pointer;
  court: Court;
  lum: Lum;
};

/** what an actor sees: everything, none of it writable */
export type SceneView = {
  readonly root: HTMLElement;
  readonly notFound: boolean;
  readonly caps: Caps;
  readonly random: () => number;
  readonly fit: Readonly<Fit>;
  readonly env: Readonly<Env>;
  readonly state: Readonly<SceneState> | null;
  readonly pointer: Readonly<Pointer>;
  readonly court: Court;
  readonly lum: Readonly<Lum>;
};

export function createScene(init: { root: HTMLElement; notFound?: boolean; caps: Caps; random?: () => number }): Scene {
  return {
    root: init.root,
    notFound: init.notFound ?? false,
    caps: init.caps,
    random: init.random ?? Math.random,
    fit: { s: 1, ox: 0, oy: 0, left: 0, width: 1600, portrait: false },
    env: {} as Env,
    state: null,
    pointer: { x: -999, y: -999 },
    court: "rest",
    lum: { x: 800, y: 100, sunUp: 1, elev: 1, side: 0, cross: 0 },
  };
}
