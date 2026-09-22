import assert from "node:assert/strict";
import { test } from "node:test";
import { createRally } from "../src/lib/beach/rally.ts";
import { awardPoint, type Match } from "../src/lib/habitat/match.ts";
import { LOCAL_TENNIS } from "../src/lib/habitat/tennis.ts";
import { fakeElement, fakeScene } from "./fakes.ts";

function setup(seed = 42) {
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const scene = fakeScene({ random, env: { wind: 0.2, windX: 0.1 } });
  scene.court = "play";
  const court = fakeElement();
  Object.assign(court.dataset, { m: "-0.085", baseline: "140", bt: "play" });
  const player = () => ({ el: fakeElement(), arm: fakeElement() as any, body: fakeElement() as any, la: fakeElement() as any, lb: fakeElement() as any });
  const habitat = { action: "rally" as const, fatigue: 0, resting: false, policy: LOCAL_TENNIS, tire() { this.fatigue++; }, refresh() { this.fatigue = 0; }, rested() { this.resting = true; } };
  const reports: { match: Match; announce: boolean }[] = [], serves: number[] = [], shots: string[] = [];
  let contacts: number[] = [];
  const rally = createRally(scene, { court, ball: fakeElement(), shadow: fakeElement(), pok: fakeElement(), puff: fakeElement(), net: fakeElement() as any, players: [player(), player()] }, {
    habitat,
    publish: (match, announce) => reports.push({ match: structuredClone(match), announce: !!announce }),
    record: (shot, _situation, by, serve) => {
      const state = rally.inspect();
      if (serve) {
        assert.equal(by, state.match.server, "the designated player serves, independent of retrieval");
        assert.equal(state.P[0].face, state.match.ends ? -1 : 1, "players change ends before the next serve");
        assert.ok(state.P[by].x * state.P[by].face < -140, "server remains behind baseline at contact");
        serves.push(by); contacts = [];
      } else assert.notEqual(contacts.at(-1), by, "contacts must alternate");
      contacts.push(by); shots.push(shot);
    },
  });
  return { scene, court, habitat, rally, reports, serves, shots };
}

test("two complete animated matches: every announced score is one application of the rules, net serves stay live, the rematch swaps servers", () => {
  const { rally, reports, serves, shots } = setup();
  let netCrossings = 0;
  for (let i = 0; i < 240000 && reports.filter((r) => r.match.winner !== null).length < 2; i++) {
    const before = rally.inspect(), segment = before.ball.segs[0], score = before.match;
    rally.tick(1 / 60);
    if (before.mode === "fly" && segment?.then === "net-over" && rally.inspect().ball.segs[0] !== segment) {
      netCrossings++;
      assert.equal(rally.inspect().match, score, "a legal net serve continues without awarding or replaying a point");
      assert.equal(rally.inspect().pointLive, true);
    }
  }
  assert.ok(netCrossings > 0, "exercise serves that touch the tape and cross");
  assert.equal(reports.filter((r) => r.match.winner !== null).length, 2, "complete two actual animated matches without getting stuck");
  assert.ok(serves.length > 40);
  assert.ok(new Set(shots).size === 3, "drives, lobs and drops all get played");
  for (let i = 1; i < reports.length; i++) {
    const { match, announce } = reports[i];
    if (announce) { const p = match.lastPoint!; assert.deepEqual(match, awardPoint(reports[i - 1].match, p.winner, p.reason)); }
    else assert.deepEqual(match.games, [0, 0]);
  }
  assert.equal(reports.find((r) => !r.announce && r.match.firstServer === 1)?.match.firstServer, 1, "rematch alternates the opening server");
});

test("weather interrupts the point without changing points or service order; the players leave and come back", () => {
  const { scene, court, rally } = setup(7);
  for (let i = 0; i < 4000 && !rally.inspect().pointLive; i++) rally.tick(1 / 60);
  assert.ok(rally.inspect().pointLive);
  const before = structuredClone(rally.inspect().match);
  scene.court = "wet";
  for (let i = 0; i < 300; i++) rally.tick(1 / 60);
  assert.deepEqual(rally.inspect().match, before);
  assert.equal(rally.inspect().pointLive, false);
  assert.equal(court.dataset.bt, "wet");
  scene.court = "play";
  for (let i = 0; i < 4000 && !rally.inspect().pointLive; i++) rally.tick(1 / 60);
  assert.ok(rally.inspect().pointLive, "play resumes when the rain stops");
  assert.equal(rally.inspect().match.server, before.server, "same server as before the rain");
});

test("a break from the habitat player holds the serve until the players have retrieved the ball, then they rest", () => {
  const { habitat, rally } = setup(3);
  for (let i = 0; i < 4000 && !rally.inspect().pointLive; i++) rally.tick(1 / 60);
  (habitat as { action: string }).action = "break";
  for (let i = 0; i < 4000 && !habitat.resting; i++) rally.tick(1 / 60);
  assert.ok(habitat.resting, "the rally tells the habitat player the players are resting");
  assert.equal(rally.inspect().mode, "toServe");
  assert.equal(rally.inspect().pointLive, false);
});

test("snap: without the clock the court still shows a held pose", () => {
  const { rally, court } = setup();
  rally.snap();
  assert.equal(court.dataset.bt, "play");
  const { P, ball } = rally.inspect();
  assert.ok(P.every((p) => p.x === p.home));
  assert.ok(ball.on);
});
