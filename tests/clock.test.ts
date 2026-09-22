import assert from "node:assert/strict";
import { test } from "node:test";
import { createClock } from "../src/lib/beach/clock.ts";

test("the active scene keeps up with 60 and 120 Hz displays", () => {
  for (const hz of [60, 120]) {
    let now = 0, updates = 0, raf: ((t: number) => void)[] = [];
    const clock = createClock({ random: () => 0.5, requestAnimationFrame: (fn) => raf.push(fn), now: () => now });
    clock.add("count", () => updates++);
    clock.sync({ hidden: false, held: false, calm: false, intro: false });
    for (let i = 1; i <= hz * 3; i++) {
      now = (i * 1000) / hz;
      const due = raf; raf = [];
      due.forEach((fn) => fn(now));
    }
    assert.ok(updates >= hz * 3 - 1, `${hz} Hz: ${updates} updates in 3 s; the scene must not drop display callbacks deliberately`);
  }
});

test("tasks run in the order they were added, with a clamped dt", () => {
  const order: string[] = [], dts: number[] = [];
  let now = 0, raf: ((t: number) => void)[] = [];
  const clock = createClock({ random: () => 0.5, requestAnimationFrame: (fn) => raf.push(fn), now: () => now });
  clock.add("channels", (dt) => { order.push("channels"); dts.push(dt); });
  clock.add("rally", () => order.push("rally"));
  assert.deepEqual(clock.names(), ["channels", "rally"]);
  clock.sync({ hidden: false, held: false, calm: false, intro: false });
  now = 500; raf.splice(0).forEach((fn) => fn(now)); // a long gap after a tab switch
  assert.deepEqual(order, ["channels", "rally"]);
  assert.equal(dts[0], 0.05, "a frame never advances the scene by more than 50 ms");
});

test("any closed gate stops the loop; only the newest loop keeps going", () => {
  let now = 0, raf: ((t: number) => void)[] = [], ticks = 0;
  const clock = createClock({ random: () => 0.5, requestAnimationFrame: (fn) => raf.push(fn), now: () => now });
  clock.add("tick", () => ticks++);
  const open = { hidden: false, held: false, calm: false, intro: false };
  for (const gate of ["hidden", "held", "calm", "intro"] as const) {
    clock.sync({ ...open, [gate]: true });
    assert.equal(clock.running, false, `${gate} pauses the scene`);
  }
  clock.sync(open); assert.equal(clock.running, true);
  const stale = raf.splice(0);
  clock.sync({ ...open, hidden: true });
  clock.sync(open); // restarted: the old callback must be a no-op
  const fresh = raf.splice(0);
  now = 16; stale.forEach((fn) => fn(now)); assert.equal(ticks, 0, "a superseded loop does nothing");
  fresh.forEach((fn) => fn(now)); assert.equal(ticks, 1);
});

test("sometimes() fires between min and max seconds, first after firstIn", () => {
  const clock = createClock({ random: () => 0 }); // rand(min, max) → min
  let fired = 0;
  clock.sometimes(2, 4, () => fired++, 1);
  clock.step(0.9); assert.equal(fired, 0);
  clock.step(0.2); assert.equal(fired, 1);
  clock.step(1.9); assert.equal(fired, 1);
  clock.step(0.2); assert.equal(fired, 2);
});
