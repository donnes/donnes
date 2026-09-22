import assert from "node:assert/strict";
import { test } from "node:test";
import { createHabitatPlayer } from "../src/lib/beach/habitat-player.ts";
import { fallback } from "../src/lib/habitat/plan.ts";
import { fakeScene } from "./fakes.ts";

const tick = (dt: number) => new Promise((r) => setTimeout(r, dt));
const json = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

test("the local plan plays at once, thirty seconds an action; a break is shorter and resets fatigue", () => {
  const scene = fakeScene({});
  scene.court = "play";
  const recorded: string[] = [];
  const player = createHabitatPlayer(scene, { fetch: async () => { throw new Error("offline"); }, report() {}, record: (a) => recorded.push(a) });
  const first = player.tick(0.016);
  assert.equal(first?.action, fallback("sunny").actions[0]);
  assert.equal(scene.root.dataset.habitat, first?.action);
  assert.equal(player.tick(29.9), undefined, "still the same action");
  assert.equal(player.tick(0.2)?.action, fallback("sunny").actions[1]);
  for (let i = 0; i < 7; i++) player.tire();
  assert.equal(player.tick(30.1)?.action, "break", "six tired points force a breather");
  assert.equal(player.fatigue, 0);
  assert.deepEqual(recorded.slice(0, 3), [fallback("sunny").actions[0], fallback("sunny").actions[1], "break"]);
});

test("gull and crab actions come back as invitations for boot to dispatch", () => {
  const scene = fakeScene({});
  const player = createHabitatPlayer(scene, { fetch: async () => { throw new Error("offline"); }, report() {}, record() {} });
  const seen = new Set<string>();
  for (let i = 0; i < 8; i++) { const ev = player.tick(30.1); if (ev?.invite) seen.add(ev.invite); }
  assert.deepEqual([...seen].sort(), ["crab", "gull"]);
});

test("a fetched plan replaces the local one; a context change drops it and asks again, at most twice a visit", async () => {
  const scene = fakeScene({});
  const asked: string[] = [];
  const reports: unknown[] = [];
  const player = createHabitatPlayer(scene, {
    fetch: async (url) => { asked.push(String(url)); return json({ source: "openrouter", plan: { actions: ["lob", "lob", "lob", "lob"] }, tennis: { source: "typesafe", policy: { balanced: { drive: 1, lob: 0, drop: 0 }, stretched: { drive: 1, lob: 0, drop: 0 }, tired: { drive: 1, lob: 0, drop: 0 } } } }); },
    report: (d) => reports.push(d), record() {},
  });
  player.tick(0.016);
  await tick(0);
  assert.deepEqual(asked, ["/api/habitat?context=sunny"]);
  assert.equal(scene.root.dataset.habitatSource, "openrouter");
  assert.equal(scene.root.dataset.tennisSource, "typesafe");
  assert.equal(player.policy.balanced.drive, 1);
  assert.equal(player.tick(30.1)?.action, "lob", "the director's plan is playing");
  scene.env.wind = 0.9; // it turned windy: local rules until the new context answers
  player.tick(0.016);
  assert.equal(player.context, "windy");
  assert.equal(scene.root.dataset.habitatSource, "local");
  assert.equal(player.policy.balanced.drive, 0.5);
  await tick(0);
  assert.deepEqual(asked, ["/api/habitat?context=sunny", "/api/habitat?context=windy"]);
  scene.env.wind = 0; player.tick(0.016); await tick(0);
  assert.equal(asked.length, 2, "two paid requests a visit, no more");
});

test("a break on a live court waits until the players have retrieved the ball", () => {
  const scene = fakeScene({});
  scene.court = "play";
  const player = createHabitatPlayer(scene, { fetch: async () => { throw new Error("offline"); }, report() {}, record() {} });
  while (player.tick(30.1)?.action !== "break");
  player.tick(10); player.tick(10);
  assert.equal(player.action, "break", "the rest has not started counting down");
  player.rested();
  player.tick(10); assert.equal(player.action, "break");
  assert.notEqual(player.tick(10)?.action, undefined, "18 s after the players sat down, the plan moves on");
});

test("the 404 beach never asks the models", async () => {
  const scene = fakeScene({ notFound: true });
  let calls = 0;
  const player = createHabitatPlayer(scene, { fetch: async () => { calls++; return json({}); }, report() {}, record() {} });
  player.tick(0.016); await tick(0);
  assert.equal(calls, 0);
});
