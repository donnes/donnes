import assert from "node:assert/strict";
import { test } from "node:test";
import { createBirds } from "../src/lib/beach/birds.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

test("a launched bird crosses the sky on the main thread and is put away at the far end", () => {
  const els = [fakeElement(), fakeElement()] as unknown as SVGSVGElement[];
  const birds = createBirds(fakeScene({ random: () => 0.5 }), { birds: els }, { life: () => 1 });
  const lead = birds.launch();
  assert.ok(lead && lead.on && !lead.auto);
  assert.ok(els[0].classList.contains("is-flying"));
  let frames = 0;
  while (birds.birds[0].on && frames++ < 2000) birds.tick(1 / 60);
  assert.ok(frames > 60 * 5 && frames < 2000, `a flight takes a while (${frames} frames)`);
  assert.equal(els[0].style.opacity, "0");
  assert.ok(!els[0].classList.contains("is-flying"));
});

test("banking follows the curve: a bird flying right leans into a climb, and never beyond 22°", () => {
  const birds = createBirds(fakeScene({}), { birds: [] }, { life: () => 1 });
  const b = { el: fakeElement() as unknown as SVGSVGElement, on: true, auto: false, t: 0, dur: 1, size: 1, p: [[0, 300], [500, 0], [1000, 0], [1500, 300]] };
  assert.match(birds.birdAt(b, 0.1), /rotate\(-\d+\.\d+deg\)/);
  const angles = Array.from({ length: 11 }, (_, i) => Number(/rotate\((-?[\d.]+)deg\)/.exec(birds.birdAt(b, i / 10))![1]));
  assert.ok(angles.every((a) => Math.abs(a) <= 22));
});

test("lite scenes hand one bird at a time to the compositor", () => {
  const els = [fakeElement(), fakeElement()] as unknown as SVGSVGElement[];
  const birds = createBirds(fakeScene({ caps: { lite: true, calm: false, sheet: false } }), { birds: els }, { life: () => 1 });
  const a = birds.launch();
  assert.ok(a?.auto, "the flight is a WAAPI animation");
  assert.equal(birds.launch(), undefined, "no second bird while one is up");
});
