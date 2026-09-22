import assert from "node:assert/strict";
import { test } from "node:test";
import { createChannels, goalFor } from "../src/lib/beach/channels.ts";
import type { SceneState } from "../src/lib/beach/scene.ts";
import { fakeScene } from "./fakes.ts";

const state = (over: Partial<SceneState> = {}): SceneState => ({ sky: "clear", phase: "midday", cyc: 0.5, cover: 0.1, wind: 0.2, windX: 0.3, kmh: 8, compass: "NE", temp: 26, label: "clear", preview: "", ...over });
function setup(snapNow = () => false) {
  const scene = fakeScene({});
  let next = state();
  const calls: string[] = [];
  const hooks = { state: () => calls.push("state"), snapped: () => calls.push("snapped"), eased: () => calls.push("eased"), frame: () => calls.push("frame"), render: () => calls.push("render"), rates: () => calls.push("rates") };
  const channels = createChannels(scene, { read: () => next, snapNow, blocked: () => false, hooks });
  return { scene, channels, calls, set: (s: SceneState) => { next = s; } };
}

test("first paint snaps: the channels take the goal at once and the sky is placed", () => {
  const { scene, channels, calls } = setup();
  channels.update();
  assert.deepEqual(scene.env, goalFor(state()));
  assert.deepEqual(calls, ["state", "snapped"]);
  assert.equal(channels.moving, false);
  calls.length = 0;
  channels.update();
  assert.deepEqual(calls, [], "an unchanged state does nothing");
});

test("a new sky eases in over seconds, with ~8 palette steps a second, then settles exactly on the goal", () => {
  const { scene, channels, calls, set } = setup();
  channels.update();
  set(state({ sky: "rain", cover: 1, wind: 0.6 }));
  channels.update();
  assert.equal(calls.at(-1), "eased");
  assert.equal(channels.moving, true);
  calls.length = 0;
  for (let i = 0; i < 60; i++) channels.tick(1 / 60);
  assert.ok(scene.env.rFirst > 0.3 && scene.env.rFirst < 0.6, "the first rain is well on its way after a second (1.6 s to arrive)");
  assert.ok(scene.env.wet < 0.2, "the sand takes much longer to darken");
  const renders = calls.filter((c) => c === "render").length;
  assert.ok(renders >= 7 && renders <= 8, `about 8 palette steps a second (${renders})`);
  assert.equal(calls.filter((c) => c === "frame").length, 60);
  for (let i = 0; i < 60 * 80; i++) channels.tick(1 / 60);
  assert.deepEqual(scene.env, goalFor(state({ sky: "rain", cover: 1, wind: 0.6 })));
  assert.equal(channels.moving, false);
});

test("the day turns the short way round: dusk to dawn goes forward through the night, not back", () => {
  const { scene, channels, set } = setup();
  set(state({ cyc: 1.9, phase: "night" })); channels.update();
  set(state({ cyc: 0.05, phase: "dawn" })); channels.update();
  channels.tick(0.5);
  assert.ok(scene.env.cyc > 1.9 || scene.env.cyc < 0.05, "moving forward past 2, never backwards through the day");
});

test("no motion, a stopped clock, or lite: every state change snaps", () => {
  const { scene, channels, calls, set } = setup(() => true);
  channels.update();
  set(state({ sky: "storm" })); channels.update();
  assert.equal(calls.at(-1), "snapped");
  assert.equal(scene.env.storm, 1);
});
