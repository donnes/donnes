import assert from "node:assert/strict";
import { test } from "node:test";
import { createBall } from "../src/lib/beach/ball.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

test("a poked ball rolls, slows and stays on the beach", () => {
  const ball = fakeElement(), art = fakeElement();
  ball.style.setProperty("--x", "800");
  const scene = fakeScene({ random: () => 0.5, fit: { left: 0, width: 1600 }, env: { wind: 0, windX: 0, storm: 0 } });
  const b = createBall(scene, { ball, art });
  b.poke(true);
  for (let i = 0; i < 300; i++) b.tick(1 / 60);
  assert.ok(b.state.x > 0 && b.state.x < 800, `rolled right and stopped on the sand (x=${b.state.x.toFixed(0)})`);
  assert.ok(Math.abs(b.state.v) < 2, "came to rest");
  assert.match(ball.style.translate, /px 0$/);
});

test("a storm blows the ball off the beach; afterwards it rolls home", () => {
  const ball = fakeElement(), art = fakeElement();
  ball.style.setProperty("--x", "800");
  const scene = fakeScene({ random: () => 0.5, fit: { left: 0, width: 1600 }, env: { wind: 1, windX: 1, storm: 1 } });
  const b = createBall(scene, { ball, art });
  for (let i = 0; i < 600; i++) b.tick(1 / 60);
  assert.ok(b.state.x > 740, `blown beyond the right edge (x=${b.state.x.toFixed(0)})`);
  scene.env.storm = 0; scene.env.wind = 0; scene.env.windX = 0;
  for (let i = 0; i < 1200; i++) b.tick(1 / 60);
  assert.ok(b.state.x <= 741, "rolled back onto the beach");
});
