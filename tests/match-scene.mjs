import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
export async function runMatchScene(rules) {
  const source = await readFile('src/components/beach/beach-home.astro','utf8');
  let code = source.slice(source.indexOf('  const court = q(".jb-court");'),source.indexOf('  /* ───────────── ?demo=1:'));
  const end = code.lastIndexOf('\n  }');
  code = code.slice(0,end) + '\n globalThis.inspect = () => ({match, P, mode, server, pointLive, ball});' + code.slice(end);
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector,{dataset:{m:'-0.085',baseline:'140',bt:'play'},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({})});
    return elements.get(selector);
  };
  let seed = 42, reports = [], serves = [], shots = [], contacts = [], netCrossings = 0;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0) / 2**32);
  const math = Object.create(Math); math.random = random;
  const tasks = [];
  let context;
  context = vm.createContext({
    ...rules, Math:math, q:element, tasks, btWant:'play', running:true, NOT_FOUND:false,
    env:{wind:0.2,windX:0.1}, habitat:{action:'rally',fatigue:0,resting:false},
    clamp:(n,a,b)=>Math.max(a,Math.min(b,n)), rand:(a,b)=>a+(b-a)*random(), ease:n=>n,
    tennisPolicy:{}, chooseShot:()=>['lob','drop','drive'][Math.floor(random()*3)],
    reportMatch:(match,announce)=>reports.push({match:structuredClone(match),announce:!!announce}),
    recordHabitat:(shot,situation,by,serve)=>{
      const state=context.inspect();
      if(serve){
        assert.equal(by,state.match.server,'the designated player serves, independent of retrieval');
        assert.equal(state.P[0].face,state.match.ends?-1:1,'players change ends before the next serve');
        assert.ok(state.P[by].x*state.P[by].face < -140,'server remains behind baseline at contact');
        serves.push(by);contacts=[];
      }else{
        assert.notEqual(contacts.at(-1),by,'contacts must alternate');
      }
      contacts.push(by);shots.push(shot);
    },
  });
  vm.runInContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
  for(let i=0;i<240000 && reports.filter(r=>r.match.winner!==null).length<2;i++) {
    const before = context.inspect(), segment = before.ball.segs[0], score = before.match;
    tasks[0](1/60);
    if(before.mode==='fly' && segment?.then==='net-over' && context.inspect().ball.segs[0]!==segment){
      netCrossings++;
      assert.equal(context.inspect().match,score,'a legal net serve continues without awarding or replaying a point');
      assert.equal(context.inspect().pointLive,true);
    }
  }
  assert.ok(netCrossings>0,'exercise serves that touch the tape and cross');
  const results=reports.filter(r=>r.match.winner!==null);
  assert.equal(results.length,2,'complete two actual animated matches without getting stuck');
  assert.ok(serves.length>40);
  // Every announced update must equal exactly one application of the pure rule engine.
  for(let i=1;i<reports.length;i++){
    const {match,announce}=reports[i];
    if(announce){const p=match.lastPoint;assert.deepEqual(match,rules.awardPoint(reports[i-1].match,p.winner,p.reason));}
    else assert.deepEqual(match.games,[0,0]);
  }
  assert.equal(reports.find(r=>!r.announce&&r.match.firstServer===1)?.match.firstServer,1,'rematch alternates the opening server');
  // Weather interrupts the point without changing points or service order.
  for(let i=0;i<2000&&!context.inspect().pointLive;i++)tasks[0](1/60);
  const before=structuredClone(context.inspect().match);
  context.btWant='wet'; for(let i=0;i<300;i++)tasks[0](1/60);
  assert.deepEqual(context.inspect().match,before); assert.equal(context.inspect().pointLive,false);
  console.log(`Animated match checks passed: ${serves.length} serves, two complete matches, no duplicate points, weather suspension.`);
}
