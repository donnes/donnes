import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const source = await readFile('src/components/beach/beach-home.astro', 'utf8');
const start = source.indexOf('  const gull = q(".jb-gull");');
const end = source.indexOf('  // the crab:', start);
assert.ok(start > 0 && end > start);
const script = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
for (const rain of [0, 0.2]) for (const random of [0.1, 0.9]) {
  const classes = new Set(), tasks = [];
  const gull = { style: {}, classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) } };
  const env = { wind: 0, rMid: 0 };
  const context = vm.createContext({ q: () => gull, inviteGull: null, LITE: false, lifeNow: () => 1, env,
    fit: { left: 100, width: 1200 }, shoreY: () => 520, rand: (a,b) => (a+b)/2,
    clamp: (n,a,b) => Math.min(b,Math.max(a,n)), sometimes: () => {}, tasks,
    Math: Object.assign(Object.create(Math), { random: () => random }),
  });
  vm.runInContext(script, context);
  context.inviteGull();
  const tick = () => tasks.forEach(task => task(0.02));
  while (classes.has('is-air')) tick();
  env.rMid = rain; // Cover ordinary departures and rain-triggered takeoffs.
  for (let i=0; i<1000 && !classes.has('is-air'); i++) tick();
  assert.ok(classes.has('is-air'), 'the gull takes off');
  assert.ok(classes.has('is-out'), 'the gull must remain visible when takeoff begins');
  let frames = 0;
  while (classes.has('is-air') && frames++ < 500) {
    tick();
    const x = Number(gull.style.transform.match(/translate3d\(([-\d.]+)px/)[1]);
    if (x >= 100 && x <= 1300) assert.ok(classes.has('is-out'), 'the gull must not disappear while still inside the scene');
  }
  assert.ok(frames > 10 && frames < 500, 'departure completes with an animated path');
  const x = Number(gull.style.transform.match(/translate3d\(([-\d.]+)px/)[1]);
  assert.ok(x < 100 || x > 1300, 'the departure ends beyond the visible scene');
  assert.ok(!classes.has('is-out'), 'the gull is cleaned up after leaving');
}
console.log('Gull departure passed in both directions, dry and rainy: visible takeoff, flight, offscreen cleanup.');
