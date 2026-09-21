import assert from 'node:assert/strict';
export function runMatch({createMatch, awardPoint, pointScore, decidingPoint, landingWinner, faultWinner}) {
  const winGame = (match, who) => { for (let i = 0; i < 4; i++) match = awardPoint(match, who, 'in'); return match; };
  let m = createMatch(0);
  for (const [who, expected] of [[0,['15','0']],[1,['15','15']],[0,['30','15']],[0,['40','15']],[1,['40','30']],[1,['40','40']]]) {
    m = awardPoint(m,who,'in'); assert.deepEqual(pointScore(m),expected); assert.equal(m.server,0);
  }
  assert.ok(decidingPoint(m));
  const prior = structuredClone(m);
  m = awardPoint(m,1,'in');
  assert.deepEqual(prior.points,[3,3]); assert.deepEqual(m.games,[0,1]); assert.deepEqual(m.points,[0,0]); assert.equal(m.server,1); assert.equal(m.ends,true);
  m = winGame(m,0); assert.equal(m.ends,true); assert.equal(m.server,0);
  m = winGame(m,0); assert.equal(m.ends,false);
  m = createMatch(); for(let i=0;i<5;i++)m=winGame(m,0); assert.equal(m.winner,null);
  m=winGame(m,0); assert.equal(m.winner,0); assert.deepEqual(m.games,[6,0]); assert.equal(awardPoint(m,1,'in'),m);
  m=createMatch(); for(let i=0;i<5;i++){m=winGame(m,0);m=winGame(m,1)}
  m=winGame(m,0);assert.equal(m.winner,null);m=winGame(m,0);assert.deepEqual(m.games,[7,5]);assert.equal(m.winner,0);
  for (const first of [0,1]) {
    m=createMatch(first);for(let i=0;i<6;i++){m=winGame(m,0);m=winGame(m,1)}
    assert.equal(m.tieBreak,true); assert.equal(m.server,first);
    const servers=[];const ends=[];
    for(let i=0;i<12;i++){servers.push(m.server);m=awardPoint(m,i%2,'in');ends.push(m.lastPoint.changeEnds)}
    assert.deepEqual(servers,[first,1-first,1-first,first,first,1-first,1-first,first,first,1-first,1-first,first]);
    assert.deepEqual(ends.map((on,i)=>on?i+1:0).filter(Boolean),[1,5,9]);
    assert.deepEqual(m.points,[6,6]); m=awardPoint(m,0,'in'); assert.equal(m.winner,null);
    m=awardPoint(m,1,'in');m=awardPoint(m,1,'in');assert.equal(m.winner,null);
    m=awardPoint(m,1,'in');assert.equal(m.winner,1);assert.deepEqual(m.games,[6,7]);assert.deepEqual(m.points,[7,9]);
  }
  assert.deepEqual(landingWinner(0,-1,8,4),{winner:0,reason:'in'});
  assert.equal(landingWinner(0,-1,8.001,0).winner,1);
  assert.equal(landingWinner(0,-1,7,4.001).winner,1);
  assert.equal(landingWinner(1,1,-8,-4).winner,1);
  assert.equal(landingWinner(0,-1,8.03,0,4,0.03).winner,0,'a ball touching the baseline is in');
  assert.equal(landingWinner(0,-1,8.03,4.03,4,0.03).winner,1,'outside the corner despite overlapping both axis ranges');
  assert.equal(landingWinner(1,1,1,0).winner,0);
  for(const reason of ['net','net-touch','double-hit','serve-fault'])assert.equal(faultWinner(0,reason).winner,1);
  console.log('Match checks passed: no-ad, fixed server, 6–0/7–5, extended tie-break, service rotation, ends, line calls and faults.');
}
