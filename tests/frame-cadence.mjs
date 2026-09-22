import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const source=await readFile('src/components/beach/beach-home.astro','utf8');
// Browser toolbar height changes must not move the court within its fixed 100svh painting.
const layout = source.slice(source.indexOf('  let measuredWidth = 0'), source.indexOf('  measure();'));
const properties = new Map();
const scene = { clientWidth: 411, clientHeight: 783 };
const viewport = { innerWidth: 411, innerHeight: 783 };
const context = vm.createContext({
  sceneEl: scene, window: viewport, fit: {}, placed: [], HORIZON: 240, NOT_FOUND: false,
  root: { style: { setProperty: (key, value) => properties.set(key, value) } },
  clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)), shoreY: () => 600,
});
vm.runInContext(ts.transpileModule(layout, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
assert.equal(vm.runInContext('measure()', context), true);
const initial = [...properties];
viewport.innerHeight += 90;
assert.equal(vm.runInContext('measure()', context), false);
assert.deepEqual([...properties], initial, 'toolbar movement must not move the scene');
scene.clientWidth = 783; scene.clientHeight = 411;
assert.equal(vm.runInContext('measure()', context), true, 'orientation changes must still resize the scene');
assert.notDeepEqual([...properties], initial);
console.log('Stable toolbar layout and orientation resize passed.');
