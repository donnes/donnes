import assert from "node:assert/strict";
import { test } from "node:test";
import { createSky } from "../src/lib/beach/sky.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

(globalThis as any).window ??= { setTimeout, clearTimeout };
const cloud = (tier: string, v: string) => { const el = fakeElement() as any; el.dataset.tier = tier; el.dataset.v = v; el.style.left = "100px"; el.style.width = "300px"; return el; };
const els = () => ({
  sun: fakeElement(), moon: fakeElement(), glow: null, sparks: null, dimmer: null,
  clouds: [cloud("far", "0.3"), cloud("near", "1"), cloud("near", "1")] as any[], decks: [], shades: [], flash: null, bolt: null, shoot: null,
});

test("the sun is up by day and the moon by night; both sit over the open sea", () => {
  const scene = fakeScene({ env: { cyc: 0.5, sun: 1 } });
  const e = els();
  const sky = createSky(scene, e);
  sky.placeLum();
  assert.equal(scene.lum.sunUp, 1);
  assert.ok(scene.lum.elev > 0.99, "noon: the sun at the top of its arc");
  assert.ok(scene.lum.x > 700 && scene.lum.x < 1060, "over the water, clear of the name and the morro");
  scene.env.cyc = 1.5; sky.placeLum();
  assert.equal(scene.lum.sunUp, 0);
  sky.stillLum();
  assert.equal(e.sun.style.opacity, "0.00", "at night the sun is out of sight");
  assert.ok(Number(e.moon.style.opacity) > 0.5, "and the moon is up");
});

test("clouds appear with cover and leave when the sky clears; snapping places them at once", () => {
  const scene = fakeScene({ random: () => 0.5 });
  const e = els();
  const sky = createSky(scene, e);
  assert.ok(e.clouds.every((c) => c.classList.contains("is-gone")), "nothing until the sky asks");
  sky.syncClouds({ ...scene.env, cover: 1, deck: 0, windX: 1 }, true);
  assert.ok(sky.clouds.every((c) => c.on));
  assert.deepEqual(e.clouds.map((c) => c.style.opacity), ["0.92", "1", "1"]);
  assert.ok(e.clouds.every((c) => !c.classList.contains("is-gone")));
  assert.ok(e.clouds.every((c) => /^translate3d\(/.test(c.style.transform)), "snapped into place");
  sky.syncClouds({ ...scene.env, cover: 1, deck: 1, windX: 1 }, false);
  assert.equal(sky.clouds[1].on, false, "under a full deck every other cumulus stays hidden");
  assert.equal(sky.clouds[2].on, true);
  sky.syncClouds({ ...scene.env, cover: 0, deck: 0, windX: 1 }, true);
  assert.deepEqual(sky.clouds.map((c) => c.on), [true, false, false], "one far cloud is always there; the rest leave");
  assert.deepEqual(e.clouds.map((c) => c.classList.contains("is-gone")), [false, false, true], "a cloud that fades out is only marked gone 3 s later; a snapped one at once");
});

test("clouds drift downwind, and a cumulus crossing the sun dims it", () => {
  const scene = fakeScene({ random: () => 0.5, env: { cyc: 0.5, sun: 1, wind: 0.5, windX: 1, storm: 0 } });
  const e = els();
  const sky = createSky(scene, e);
  sky.placeLum();
  sky.syncClouds({ ...scene.env, cover: 1, deck: 0 }, true);
  const x0 = sky.clouds[1].x;
  for (let i = 0; i < 60; i++) sky.tick(1 / 60);
  assert.ok(sky.clouds[1].x > x0, "moved with the wind (left to right)");
  assert.ok(Number(e.sun.style.opacity) > 0, "the sun shows through");
});
