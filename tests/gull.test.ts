import assert from "node:assert/strict";
import { test } from "node:test";
import { createGull } from "../src/lib/beach/gull.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

test("gull departure: visible takeoff, flight, offscreen cleanup; dry and rainy, both directions", () => {
  for (const rain of [0, 0.2]) for (const random of [0.1, 0.9]) {
    const el = fakeElement();
    const scene = fakeScene({ random: () => random, fit: { left: 100, width: 1200 }, env: { wind: 0, rMid: 0 } });
    const gull = createGull(scene, { gull: el }, { life: () => 1 });
    gull.invite();
    const tick = () => gull.tick(0.02);
    while (el.classes.has("is-air")) tick();
    scene.env.rMid = rain; // Cover ordinary departures and rain-triggered takeoffs.
    for (let i = 0; i < 1000 && !el.classes.has("is-air"); i++) tick();
    assert.ok(el.classes.has("is-air"), "the gull takes off");
    assert.ok(el.classes.has("is-out"), "the gull must remain visible when takeoff begins");
    let frames = 0;
    const x = () => Number(/translate3d\(([-\d.]+)px/.exec(el.style.transform)![1]);
    while (el.classes.has("is-air") && frames++ < 500) {
      tick();
      if (x() >= 100 && x() <= 1300) assert.ok(el.classes.has("is-out"), "the gull must not disappear while still inside the scene");
    }
    assert.ok(frames > 10 && frames < 500, "departure completes with an animated path");
    assert.ok(x() < 100 || x() > 1300, "the departure ends beyond the visible scene");
    assert.ok(!el.classes.has("is-out"), "the gull is cleaned up after leaving");
  }
});

test("the gull declines lite scenes, quiet hours and strong wind", () => {
  const el = fakeElement();
  const quiet = createGull(fakeScene({}), { gull: el }, { life: () => 0.5 });
  quiet.invite(); assert.equal(quiet.state.mode, "gone");
  const windy = createGull(fakeScene({ env: { wind: 0.8, rMid: 0 } }), { gull: el }, { life: () => 1 });
  windy.invite(); assert.equal(windy.state.mode, "gone");
  const lite = createGull(fakeScene({ caps: { lite: true, calm: false, sheet: false } }), { gull: el }, { life: () => 1 });
  lite.invite(); assert.equal(lite.state.mode, "gone");
});
