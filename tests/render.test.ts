import assert from "node:assert/strict";
import { test } from "node:test";
import { createRender } from "../src/lib/beach/render.ts";
import { createPalette, COLS, NUMS, VEILED, LAND } from "../src/lib/beach/palette.ts";
import { goalFor } from "../src/lib/beach/channels.ts";
import type { SceneState } from "../src/lib/beach/scene.ts";
import { fakeScene } from "./fakes.ts";

const probe = (box: string) => ({ getPropertyValue: (k: string) => (NUMS.includes(k) ? (box === "night" ? (k === "--stars" ? "1" : "0.9") : "0") : box === "night" ? "#101830" : "#80b0e0") });
function setup(state: Partial<SceneState> = {}) {
  const scene = fakeScene({});
  scene.state = { sky: "clear", phase: "midday", cyc: 0.5, cover: 0.1, wind: 0.2, windX: 0.3, kmh: 8, compass: "NE", temp: 26, label: "clear", preview: "", ...state };
  Object.assign(scene.env, goalFor(scene.state));
  const vars = new Map<string, string>();
  scene.root.style.setProperty = (k: string, v: string) => void vars.set(k, v);
  const root = scene.root as any;
  root.toggleAttribute = (k: string, on: boolean) => { on ? root.attributes.add(k) : root.attributes.delete(k); return on; };
  root.dataset = {};
  const palette = createPalette(scene, { veiledEls: [] }, probe as any);
  const painter = createRender(scene, palette, { themeMeta: null, winEls: [] });
  return { scene, vars, painter };
}

test("a dry, lit beach means a rally; rain leaves the court to the weather; night rests the rackets", () => {
  const { scene, painter } = setup();
  painter.render();
  assert.equal(scene.court, "play");
  scene.env.rFirst = 0.5; painter.render();
  assert.equal(scene.court, "wet");
  scene.env.rFirst = 0; scene.env.cyc = 1.5; painter.render();
  assert.equal(scene.court, "rest");
});

test("the 404 beach never plays; overcast and fog still do", () => {
  const { scene, painter } = setup();
  Object.assign(scene.env, goalFor({ ...scene.state!, sky: "fog" }));
  painter.render();
  assert.equal(scene.court, "play");
  const nf = setup(); (nf.scene as any).notFound = true; nf.painter.render();
  assert.equal(nf.scene.court, "rest");
});

test("flags and variables follow the channels: every palette colour is written, night lights the windows and fireflies", () => {
  const { scene, vars, painter } = setup({ cyc: 1.5, phase: "night" });
  painter.render();
  for (const k of [...COLS, ...VEILED]) assert.ok(vars.has(k), k);
  assert.ok(scene.root.hasAttribute("data-night"));
  assert.ok(scene.root.hasAttribute("data-ff"), "fireflies on a calm dry night");
  assert.equal(scene.root.dataset.umb, "shut");
  scene.env.wind = 0.9; painter.render();
  assert.ok(!scene.root.hasAttribute("data-ff"), "no fireflies in a gale");
  assert.ok(scene.root.hasAttribute("data-windy") && scene.root.hasAttribute("data-caps"));
  assert.equal(vars.get("--wdir"), "1");
  assert.equal(LAND.length, 22);
});
