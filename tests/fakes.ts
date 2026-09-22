// Fakes for actor tests: a Scene with plain fields and a DOM element with just style and classList.
import type { Scene, Env, Fit, Caps } from "../src/lib/beach/scene.ts";
import { createScene } from "../src/lib/beach/scene.ts";

export function fakeElement() {
  const classes = new Set<string>();
  const vars = new Map<string, string>();
  const style: Record<string, any> = {
    setProperty: (k: string, v: string) => void vars.set(k, v),
    getPropertyValue: (k: string) => vars.get(k) ?? "",
  };
  const el = {
    classes, style,
    classList: {
      add: (...n: string[]) => n.forEach((c) => classes.add(c)),
      remove: (...n: string[]) => n.forEach((c) => classes.delete(c)),
      toggle: (c: string, on?: boolean) => { (on ?? !classes.has(c)) ? classes.add(c) : classes.delete(c); return classes.has(c); },
      contains: (c: string) => classes.has(c),
    },
    attributes: new Set<string>(),
    hasAttribute(n: string) { return this.attributes.has(n); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  };
  return el as unknown as HTMLElement & { classes: Set<string>; attributes: Set<string> };
}

export function fakeScene(init: { random?: () => number; fit?: Partial<Fit>; env?: Partial<Env>; caps?: Caps; notFound?: boolean }): Scene {
  const root = fakeElement();
  const scene = createScene({ root, notFound: init.notFound, random: init.random ?? (() => 0.5), caps: init.caps ?? { lite: false, calm: false, sheet: false } });
  Object.assign(scene.fit, init.fit);
  Object.assign(scene.env, { cover: 0, deck: 0, fog: 0, rFirst: 0, rFar: 0, rMid: 0, rNear: 0, rSpd: 1, storm: 0, spray: 0, wet: 0, desat: 0, tint: 0, dark: 0, tr: 150, tg: 162, tb: 178, sun: 1, glit: 1, shade: 1, birds: 1, sea: 1, amp: 1, wind: 0, windX: 0.25, cyc: 0.5 }, init.env);
  return scene;
}
