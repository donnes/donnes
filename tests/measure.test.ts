import assert from "node:assert/strict";
import { test } from "node:test";
import { createMeasure } from "../src/lib/beach/measure.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

function setup(notFound = false) {
  const scene = fakeScene({ notFound });
  const properties = new Map<string, string>();
  scene.root.style.setProperty = (k: string, v: string) => void properties.set(k, v);
  const sceneEl = { clientWidth: 411, clientHeight: 783 };
  const viewport = { innerWidth: 411, innerHeight: 783 };
  const placed = [fakeElement(), fakeElement()];
  Object.assign(placed[0].dataset, { fx: "0.2", pfx: "0.3", shore: "40", pshore: "50", prow: "bottom" });
  Object.assign(placed[1].dataset, { fx: "0.5", pfx: "0.5", y: "700" });
  placed[1].classList.add("jb-ball");
  return { scene, properties, sceneEl, viewport, layout: createMeasure(scene, { sceneEl: sceneEl as unknown as HTMLElement, placed }, viewport), placed };
}

test("browser toolbar height changes never move the court within its fixed 100svh painting", () => {
  const { layout, properties, sceneEl, viewport } = setup();
  assert.equal(layout.measure(), true);
  const initial = [...properties];
  viewport.innerHeight += 90; // the painting's canvas did not change, only the browser chrome
  assert.equal(layout.measure(), false);
  assert.deepEqual([...properties], initial, "toolbar movement must not move the scene");
  sceneEl.clientWidth = 783; sceneEl.clientHeight = 411;
  assert.equal(layout.measure(), true, "orientation changes must still resize the scene");
  assert.notDeepEqual([...properties], initial);
});

test("portrait screens see the middle of the painting: things gather in rows, the court takes the middle", () => {
  const { layout, properties, scene, placed } = setup();
  layout.measure();
  assert.equal(scene.fit.portrait, true);
  assert.ok(Number(properties.get("--k")) >= 0.46 && Number(properties.get("--k")) <= 0.64, "things shrink a little");
  assert.ok(properties.has("--bt-x") && properties.has("--hb-w") && !properties.has("--nf-x"));
  const bottomRow = Number(placed[0].style.getPropertyValue("--y"));
  const ball = Number(placed[1].style.getPropertyValue("--y"));
  assert.ok(bottomRow > 0 && ball > 0);
  assert.equal(layout.width, 411);
});

test("a wide screen keeps the court by the palms and the 404 digits on the open sand", () => {
  const { layout, properties, scene, sceneEl } = setup(true);
  sceneEl.clientWidth = 1600; sceneEl.clientHeight = 900;
  layout.measure();
  assert.equal(scene.fit.portrait, false);
  assert.ok(Number(properties.get("--bt-x")) <= 1195, "clear of the palm fronds");
  assert.ok(properties.has("--nf-x") && properties.has("--nf-w"), "the 404 beach places its digits");
});
