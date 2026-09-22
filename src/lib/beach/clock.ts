// One clock for everything that moves: a requestAnimationFrame loop running named tasks in the order they were added.
// It pauses for hidden tabs, held sheets, reduced motion and the loading intro.

export type Task = (dt: number, now: number) => void;
export type Gates = { hidden: boolean; held: boolean; calm: boolean; intro: boolean };
export type ClockDeps = {
  random: () => number;
  requestAnimationFrame?: (fn: (now: number) => void) => unknown;
  now?: () => number;
};

export function createClock(deps: ClockDeps) {
  const raf = deps.requestAnimationFrame ?? ((fn) => requestAnimationFrame(fn));
  const clockNow = deps.now ?? (() => performance.now());
  const tasks: { name: string; task: Task }[] = [];
  let running = false;
  let last = 0;
  let loop = 0; // only the newest loop keeps going
  function frame(now: number, id: number) {
    if (!running || id !== loop) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const t of tasks) t.task(dt, now);
    raf((t) => frame(t, id));
  }
  const rand = (a: number, b: number) => a + deps.random() * (b - a);
  return {
    /** tasks run in the order they were added: writers (channels) before readers (actors) */
    add(name: string, task: Task) {
      tasks.push({ name, task });
    },
    /** run `fn` every `min`–`max` seconds, the first time after `firstIn` */
    sometimes(min: number, max: number, fn: () => void, firstIn = rand(min, max)) {
      let left = firstIn;
      tasks.push({ name: `sometimes:${fn.name || "anon"}`, task: (dt) => {
        left -= dt;
        if (left <= 0) {
          left = rand(min, max);
          fn();
        }
      } });
    },
    /** start or stop according to the gates; safe to call as often as they change */
    sync(gates: Gates) {
      const should = !gates.hidden && !gates.held;
      const go = should && !gates.calm && !gates.intro;
      if (go && !running) {
        running = true;
        last = clockNow();
        const id = ++loop;
        raf((t) => frame(t, id));
      } else if (!go) running = false;
    },
    get running() {
      return running;
    },
    names(): string[] {
      return tasks.map((t) => t.name);
    },
    /** one frame by hand, for tests and for still scenes */
    step(dt: number, now = 0) {
      for (const t of tasks) t.task(dt, now);
    },
  };
}
export type Clock = ReturnType<typeof createClock>;
