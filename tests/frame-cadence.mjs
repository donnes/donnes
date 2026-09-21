import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const source=await readFile('src/components/beach/beach-home.astro','utf8');
const code=source.slice(source.indexOf('  let running = false;'),source.indexOf('  function syncRunning()'));
assert.ok(code.includes('function frame('));
for(const hz of [60,120]){
 let now=0,updates=0,raf=[],timers=[];
 const context=vm.createContext({LITE:true,tasks:[()=>updates++],requestAnimationFrame:fn=>raf.push(fn),window:{setTimeout:(fn,ms)=>timers.push({fn,at:now+ms})}});
 vm.runInContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nrunning=true;loop=1;requestAnimationFrame(t=>frame(t,1));',context);
 for(let i=1;i<=hz*3;i++){
  now=i*1000/hz;
  const due=timers.filter(t=>t.at<=now);timers=timers.filter(t=>t.at>now);due.forEach(t=>t.fn());
  const frame=raf;raf=[];frame.forEach(fn=>fn(now));
 }
 console.log(`${hz} Hz display: ${updates} scene updates in 3 seconds`);
 assert.ok(updates>=hz*3-1,'the active mobile scene must not drop display callbacks deliberately');
}

// Browser toolbar height changes must not move the court within its fixed 100svh painting.
const layout = source.slice(source.indexOf('  let measuredWidth = 0'), source.indexOf('  measure();'));
const properties = new Map();
const scene = { clientWidth: 411, clientHeight: 783 };
const viewport = { innerWidth: 411, innerHeight: 783 };
const context = vm.createContext({
  scene, window: viewport, fit: {}, placed: [], HORIZON: 240,
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
