import assert from "node:assert/strict";
import { test } from "node:test";
import { createCrab } from "../src/lib/beach/crab.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

test("the crab comes out when invited, hides from the pointer, and walks off the far edge", () => {
  const el = fakeElement();
  const scene = fakeScene({ random: () => 0.5, fit: { left: 0, width: 1600, s: 1, ox: 0, oy: 0 } });
  const crab = createCrab(scene, { crab: el });
  crab.tick(1); assert.ok(!el.classes.has("is-out"), "idle at first");
  crab.invite(); crab.tick(0.02);
  assert.ok(el.classes.has("is-out") && el.classes.has("is-walking"), "invited: out and walking");
  scene.pointer.x = crab.state.x; scene.pointer.y = crab.state.y;
  crab.tick(0.02);
  assert.ok(el.classes.has("is-hid") && !el.classes.has("is-walking"), "ducks into the sand when the pointer is close");
  scene.pointer.x = -999; scene.pointer.y = -999;
  for (let i = 0; i < 100 && el.classes.has("is-hid"); i++) crab.tick(0.02);
  assert.ok(!el.classes.has("is-hid"), "comes back out once the pointer has gone");
  for (let i = 0; i < 6000 && el.classes.has("is-out"); i++) crab.tick(0.02);
  assert.ok(!el.classes.has("is-out"), "walks off the beach eventually");
  assert.equal(crab.state.mode, "gone");
});

test("the crab stays home in lite scenes and storms", () => {
  for (const scene of [fakeScene({ caps: { lite: true, calm: false, sheet: false } }), fakeScene({ env: { storm: 1 } })]) {
    const el = fakeElement();
    const crab = createCrab(scene, { crab: el });
    crab.invite(); crab.tick(1);
    assert.equal(crab.state.mode, "gone");
  }
});
