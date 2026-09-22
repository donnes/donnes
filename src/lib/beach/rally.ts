// The rally: the one-set Donald vs Wife exhibition on the beach tennis court, volleys only. The Match rules are pure
// (src/lib/habitat/match.ts); this actor moves the players and the ball, calls the lines and hands each point to them.
// It reads the habitat player's intent, fatigue and policy, and tells it when a point was played or the players are resting.
import type { SceneView } from "./scene.ts";
import type { HabitatPlayer } from "./habitat-player.ts";
import { clamp, ease, between } from "./math.ts";
import { createMatch, awardPoint, landingWinner, faultWinner, other, type Player, type PointReason, type Match } from "../habitat/match.ts";
import { chooseShot, type Shot, type Situation } from "../habitat/tennis.ts";

export type PlayerEls = { el: HTMLElement; arm: SVGGElement | null; body: SVGGElement | null; la: SVGPathElement | null; lb: SVGPathElement | null };
export type RallyEls = { court: HTMLElement; ball: HTMLElement | null; shadow: HTMLElement | null; pok: HTMLElement | null; puff: HTMLElement | null; net: SVGSVGElement | null; players: [PlayerEls, PlayerEls] };
export type RallyDeps = {
  habitat: Pick<HabitatPlayer, "action" | "fatigue" | "resting" | "policy" | "tire" | "refresh" | "rested">;
  /** the habitat board: the score changed (announce: a point was just played) */
  publish(match: Match, announce?: boolean): void;
  /** the habitat board: a shot was played */
  record(shot: Shot, situation: Situation, by: Player, serve: boolean): void;
};

export function createRally(scene: SceneView, els: RallyEls, deps: RallyDeps) {
  const rand = (a: number, b: number) => between(scene.random, a, b);
  const { habitat } = deps;
  const { court, ball: ballEl, shadow: bshEl, pok: pokEl, puff: puffEl, net: netEl } = els;
  const M = Number(court.dataset.m) || -0.085;
  const baseline = Number(court.dataset.baseline) || 140;
  const serveX = (face: number) => -face * (baseline + 24);
  type Kind = "hi" | "lo";
  // racket arm, degrees about the shoulder: ready, backswing, contact, follow-through; dx/h = where the racket meets the ball
  const SW: Record<Kind, { dx: number; h: number; a: number[] }> = { hi: { dx: 15, h: 50, a: [-35, -140, -55, 25] }, lo: { dx: 22, h: 24, a: [-35, 125, 25, -60] } };
  type Pl = PlayerEls & { face: number; x: number; tx: number; home: number; step: number; hitAt: number; kind: Kind };
  const mk = (p: PlayerEls, face: number): Pl => ({ ...p, face, x: -face * 36, tx: -face * 36, home: -face * 86, step: 0, hitAt: -9, kind: "hi" });
  const P = [mk(els.players[0], 1), mk(els.players[1], -1)];
  let match = createMatch();
  const publishMatch = (announce = false) => {
    deps.publish(match, announce);
    court.dataset.server = String(match.server);
    court.dataset.games = match.games.join("-");
    court.dataset.points = match.points.join("-");
    court.dataset.tiebreak = String(match.tieBreak);
  };
  publishMatch();
  let changingEnds = false;
  let changeStart = P.map(p => p.x);
  const placeEnds = () => {
    changingEnds = P[0].face !== (match.ends ? -1 : 1);
    if (changingEnds) changeStart = P.map(p => p.x);
    P.forEach((p, i) => {
      p.face = (i === 0 ? 1 : -1) * (match.ends ? -1 : 1);
      p.home = -p.face * 86;
      p.tx = p.home;
    });
  };
  type Seg = { x1: number; h1: number; H: number; T: number; bend?: number; then: "return" | "serve" | "whiff" | "net" | "net-over" | "ground" | "rest" };
  const ball = { x: 0, h: 0, x0: 0, h0: 0, t: 0, on: false, segs: [] as Seg[] };
  let courtTime = 0;
  let mode: "off" | "toServe" | "fly" | "dead" | "fetch" | "leave" | "matchOver" = "off";
  let rally = 0, server: Player = 0, rcv: Player = 1, collector: Player = 0, wait = 0, leaveT = 0;
  let lastHitter: Player = 0;
  let hitterEnd: -1 | 1 = -1;
  let pointLive = false;
  let serveFlight = false;
  const finishPoint = (result: { winner: Player; reason: PointReason }) => {
    if (!pointLive) return;
    pointLive = false;
    match = awardPoint(match, result.winner, result.reason);
    publishMatch(true);
    court.dataset.pointReason = result.reason;
  };
  const burst = (el: HTMLElement | null, x: number, h: number) => {
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${(M * x - h).toFixed(1)}px,0)`;
    el.classList.remove("is-go");
    void el.getBoundingClientRect();
    el.classList.add("is-go");
  };
  const showBall = (on: boolean) => {
    ball.on = on;
    ballEl?.classList.toggle("is-on", on);
    bshEl?.classList.toggle("is-on", on);
  };
  const fly = (segs: Seg[]) => {
    ball.segs = segs;
    ball.x0 = ball.x;
    ball.h0 = ball.h;
    ball.t = 0;
    mode = "fly";
  };
  const bounces = (x: number, dir: number): Seg[] => [{ x1: x + dir * 17, h1: 0, H: 11, T: 0.36, then: "ground" }, { x1: x + dir * 26, h1: 0, H: 4.5, T: 0.22, then: "rest" }];
  function hit(by: Player, serve = false) {
    const me = P[by], ot = P[other(by)], dir = me.face, wind = scene.env.wind || 0;
    // A return must come from the opposing side; no passes or second contacts.
    if (!serve && by === lastHitter) {
      finishPoint(faultWinner(by, "double-hit"));
      fly([{ x1: ball.x, h1: 0, H: 0, T: 0.3, then: "rest" }]);
      return;
    }
    lastHitter = by;
    hitterEnd = -me.face as -1 | 1;
    serveFlight = serve;
    ball.x = me.x + dir * SW[me.kind].dx;
    ball.h = SW[me.kind].h;
    rcv = other(by);
    const r = scene.random();
    const situation = Math.abs(me.x - me.home) > 26 ? "stretched" : habitat.fatigue >= 4 || rally >= 6 ? "tired" : "balanced";
    const shot = serve ? "lob" : chooseShot(habitat.policy, situation, habitat.action, r);
    court.dataset.shot = shot;
    court.dataset.situation = situation;
    deps.record(shot, situation, by, serve);
    const T = shot === "drive" ? rand(0.82, 1) : shot === "lob" ? rand(1.3, 1.6) : rand(0.95, 1.1);
    const H = shot === "drive" ? rand(12, 20) : shot === "lob" ? rand(34, 50) : rand(24, 30);
    const dist = shot === "drive" ? rand(60, 110) : shot === "lob" ? rand(88, 118) : rand(44, 58);
    const kind: Kind = shot === "drop" ? "lo" : "hi";
    const bend = scene.env.windX * wind * 36; // a strong wind bows the flight; the receiver still reads it
    const pf = serve ? 0.04 : clamp(0.07 + rally * 0.03 + wind * 0.2, 0, 0.5);
    const fault = scene.random() < pf ? ["net", "long", "miss"][Math.floor(rand(0, 3))] : "";

    const X = dir * dist;
    me.tx = me.home;
    if (fault === "net") {
      ot.tx = ot.home;
      fly([{ x1: -dir * 4, h1: rand(24, 36), H: 7, T: T * 0.5, then: "net" }, { x1: -dir * 10, h1: 0, H: 0, T: 0.42, then: "ground" }, { x1: -dir * 15, h1: 0, H: 3, T: 0.2, then: "rest" }]);
    } else if (fault === "long") {
      const out = dir * rand(152, 172);
      ot.tx = dir * rand(92, 108);
      fly([{ x1: out, h1: 0, H: H + 14, T: T * 1.12, bend, then: "ground" }, ...bounces(out, dir)]);
    } else {
      ot.kind = kind;
      ot.tx = X + dir * SW[kind].dx + (fault ? dir * 15 : 0); // a miss: read it a step too deep
      ot.hitAt = courtTime + T;
      if (serve && !fault && scene.random() < 0.08) {
        // A serve brushing the tape stays live. It is never replayed as a let.
        ot.hitAt = courtTime + T + 0.15;
        fly([{ x1: 0, h1: 43.5, H: 14, T: T * 0.5, then: "net-over" }, { x1: X, h1: SW[kind].h, H: 12, T: T * 0.5 + 0.15, then: "return" }]);
      } else fly(fault ? [{ x1: X, h1: SW[kind].h, H, T, bend, then: "whiff" }, { x1: X + dir * 30, h1: 0, H: 0, T: 0.34, then: "ground" }, ...bounces(X + dir * 30, dir)] : [{ x1: X, h1: SW[kind].h, H, T, bend, then: "return" }]);
    }
  }
  function toss(by: Player) {
    const me = P[by];
    // Both feet stay behind the painted baseline until racket contact.
    me.x = me.tx = serveX(me.face);
    me.step = 0;
    pointLive = true;
    me.kind = "hi";
    me.hitAt = courtTime + 0.62;
    ball.x = me.x + me.face * 9;
    ball.h = 28;
    showBall(true);
    fly([{ x1: me.x + me.face * SW.hi.dx, h1: SW.hi.h, H: 20, T: 0.62, then: "serve" }]);
  }
  const armAt = (p: Pl): number => {
    const tau = courtTime - p.hitAt, a = SW[p.kind].a;
    if (tau < -0.5 || tau > 0.55) return a[0];
    if (tau < -0.13) return a[0] + (a[1] - a[0]) * ease((tau + 0.5) / 0.37);
    if (tau < 0) return a[1] + (a[2] - a[1]) * ((tau + 0.13) / 0.13) ** 2;
    if (tau < 0.14) return a[2] + (a[3] - a[2]) * (1 - (1 - tau / 0.14) ** 2);
    return a[3] + (a[0] - a[3]) * ease((tau - 0.14) / 0.41);
  };
  function pose(p: Pl, v: number) {
    const walk = clamp(Math.abs(v) / 30, 0, 1), sw = Math.sin(p.step) * walk * 24;
    const tau = courtTime - p.hitAt;
    const hop = tau > -0.12 && tau < 0.2 ? Math.sin((Math.PI * (tau + 0.12)) / 0.32) * (p.kind === "hi" ? 4 : 1.5) : 0;
    const index = P.indexOf(p);
    const travel = clamp((p.x - changeStart[index]) / (p.tx - changeStart[index] || 1), 0, 1);
    const aroundPost = changingEnds ? Math.sin(Math.PI * travel) * (index ? -48 : 48) : 0;
    p.el.style.transform = `translate3d(${(p.x - 30).toFixed(1)}px,${(M * p.x - 64 + aroundPost).toFixed(1)}px,0) scaleX(${p.face})`;
    if (p.body) p.body.style.transform = `translate(0px,${(-hop - Math.abs(Math.sin(p.step)) * walk * 1.3).toFixed(1)}px) translate(0px,-20px) rotate(${(clamp(v / 95, -1, 1) * p.face * 6).toFixed(1)}deg) translate(0px,20px)`;
    if (p.arm) p.arm.style.transform = `translate(3px,-33px) rotate(${armAt(p).toFixed(1)}deg) translate(-3px,33px)`;
    if (p.la) p.la.style.transform = `translate(-1px,-19px) rotate(${sw.toFixed(1)}deg) translate(1px,19px)`;
    if (p.lb) p.lb.style.transform = `translate(1.5px,-19px) rotate(${(-sw).toFixed(1)}deg) translate(-1.5px,19px)`;
  }
  function putBall() {
    if (ballEl) ballEl.style.transform = `translate3d(${ball.x.toFixed(1)}px,${(M * ball.x - ball.h).toFixed(1)}px,0)`;
    if (bshEl) bshEl.style.transform = `translate3d(${(ball.x + ball.h * 0.12).toFixed(1)}px,${(M * ball.x + 1).toFixed(1)}px,0) scale(${clamp(1 - ball.h / 150, 0.45, 1).toFixed(2)})`;
  }
  // without the courtTime (reduced motion) the court still tells the truth: a held pose, or the rackets by the net
  const hold = () => {
    court.dataset.bt = scene.court;
    mode = "off";
    if (scene.court !== "play") return;
    P.forEach((p) => {
      p.x = p.home;
      p.hitAt = -9;
      pose(p, 0);
    });
    ball.x = -34;
    ball.h = 74;
    showBall(true);
    putBall();
  };
  function tick(dt: number) {
    if (mode === "off") {
      if (scene.court === "play") {
        if (match.winner !== null) { mode = "matchOver"; wait = 9; return; }
        const alreadyOnCourt = court.dataset.bt === "play";
        court.dataset.bt = "play";
        P.forEach((p) => {
          // Continue from the sketched pose when loading hands over to the rally.
          if (!alreadyOnCourt) p.x = -p.face * 36;
          p.tx = p.home;
          p.hitAt = -9;
        });
        placeEnds();
        server = match.server;
        P[server].tx = serveX(P[server].face);
        showBall(false);
        mode = "toServe";
        wait = 0.7;
      } else if (court.dataset.bt !== scene.court) court.dataset.bt = scene.court;
      if (mode === "off") return;
    } else if (scene.court !== "play" && mode !== "leave") {
      mode = "leave";
      pointLive = false; // Weather suspends the unfinished point, preserving the score and server.
      ball.segs = [];
      leaveT = 2.4;
      showBall(false);
      P.forEach((p) => (p.tx = -p.face * 36));
    }
    courtTime += dt;
    if (mode === "matchOver") {
      wait -= dt;
      if (wait <= 0) {
        match = createMatch(other(match.firstServer));
        habitat.refresh();
        publishMatch();
        mode = "off";
      }
      return;
    }
    for (const p of P) {
      const v = clamp((p.tx - p.x) * 5.5, -96, 96);
      p.x += v * dt;
      p.step += Math.abs(v) * dt * 0.21;
      pose(p, v);
    }
    if (mode === "leave") {
      leaveT -= dt;
      if (leaveT <= 0 || P.every((p) => Math.abs(p.tx - p.x) < 3)) {
        court.dataset.bt = scene.court === "play" ? "rest" : scene.court;
        mode = "off";
      }
      return;
    }
    if (mode === "fly") {
      const sg = ball.segs[0];
      ball.t = Math.min(1, ball.t + dt / sg.T);
      const t = ball.t, arc = 4 * t * (1 - t);
      ball.x = ball.x0 + (sg.x1 - ball.x0) * t + (sg.bend || 0) * arc;
      ball.h = Math.max(0, ball.h0 + (sg.h1 - ball.h0) * t + sg.H * arc);
      putBall();
      if (t < 1) return;
      ball.segs.shift();
      ball.x0 = ball.x;
      ball.h0 = ball.h;
      ball.t = 0;
      if (sg.then === "return" || sg.then === "serve") {
        burst(pokEl, ball.x, ball.h);
        rally = sg.then === "serve" ? 0 : rally + 1;
        hit(sg.then === "serve" ? server : rcv, sg.then === "serve");
      } else if (sg.then === "net" || sg.then === "net-over") {
        if (sg.then === "net") finishPoint(faultWinner(lastHitter, serveFlight ? "serve-fault" : "net"));
        netEl?.classList.remove("is-hit");
        void netEl?.getBoundingClientRect();
        netEl?.classList.add("is-hit");
      } else if (sg.then === "ground") {
        burst(puffEl, ball.x, 0);
        const result = landingWinner(lastHitter, hitterEnd, ball.x / baseline * 8, 0, 4, 3.5 / baseline * 8);
        if (serveFlight && result.winner !== lastHitter) result.reason = "serve-fault";
        finishPoint(result); // Only the first landing scores; subsequent bounces are dead-ball retrieval.
      }
      else if (sg.then === "rest") {
        habitat.tire();
        mode = match.winner !== null ? "matchOver" : "dead";
        wait = match.winner !== null ? 9 : match.lastPoint?.changeEnds ? 1.8 : rand(0.7, 1.3);
        P.forEach((p) => (p.tx = p.home));
      }
    } else if (mode === "dead") {
      wait -= dt;
      if (wait > 0) return;
      collector = P[0].face * ball.x < 0 ? 0 : 1;
      P[collector].tx = clamp(ball.x - P[collector].face * 8, -176, 176);
      mode = "fetch";
    } else if (mode === "fetch") {
      if (Math.abs(P[collector].tx - P[collector].x) > 3) return;
      showBall(false); // The collector returns the dead ball; the rules choose the server.
      placeEnds();
      server = match.server;
      P[server].tx = serveX(P[server].face);
      mode = "toServe";
      wait = rand(0.5, 0.9);
    } else if (mode === "toServe") {
      // Finish the point and retrieve its ball before resting. Resume from the held serve.
      if (habitat.action === "break") {
        if (P.every(p => Math.abs(p.tx - p.x) < 3)) habitat.rested();
        return;
      }
      if (P.some(p => Math.abs(p.tx - p.x) > 3)) return;
      changingEnds = false;
      wait -= dt;
      if (wait <= 0) toss(server);
    }
  }
  return {
    tick,
    /** without the clock (reduced motion) the court still tells the truth: a held pose, or the rackets by the net */
    snap: hold,
    /** for tests */
    inspect: () => ({ match, P, mode, server, pointLive, ball }),
  };
}

