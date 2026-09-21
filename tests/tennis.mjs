import assert from 'node:assert/strict';
export async function runTennis({ LOCAL_TENNIS, parseTennis, chooseShot }, { createTennisCoach }) {
  assert.deepEqual(parseTennis(LOCAL_TENNIS), LOCAL_TENNIS);
  assert.equal(parseTennis({ ...LOCAL_TENNIS, tired: { drive: -1, lob: 2, drop: 0 } }), null);
  assert.equal(parseTennis({ ...LOCAL_TENNIS, tired: { drive: 0, lob: 0, drop: 0 } }), null);
  assert.equal(chooseShot(LOCAL_TENNIS, 'stretched', 'drop', 0.5), 'lob');
  assert.equal(chooseShot(LOCAL_TENNIS, 'balanced', 'rally', 0.1), 'drive');
  let calls = 0, now = 0;
  const coach = createTennisCoach('test', 1, async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.deepEqual(Object.keys(body.questions), ['balanced', 'stretched', 'tired']);
    assert.ok(Object.values(body.questions).every(q => q.type === 'choice'));
    return Response.json({ model: "jev-test", usage: { input_tokens: 234, output_tokens: 56 }, answers: Object.fromEntries(Object.entries(LOCAL_TENNIS).map(([s, probabilities]) => [s, { type: 'choice', probabilities }])) });
  }, () => now);
  const results = await Promise.all([coach('sunny'), coach('sunny')]);
  assert.equal(results[0].usage.input, 234);
  assert.equal(results[0].usage.output, 56);
  assert.equal(results[0].usage.model, "jev-test");
  assert.equal(calls, 1); assert.ok(results.every(r => r.source === 'typesafe'));
  now += 3_600_001;
  assert.equal((await coach('sunny')).source, 'local'); assert.equal(calls, 1);
  const missing = createTennisCoach(undefined, 4, () => { throw Error('must not call'); });
  assert.equal((await missing('sunny')).source, 'local');
  const wet = createTennisCoach('test', 4, () => { throw Error('must not call'); });
  assert.equal((await wet('wet')).source, 'local');
  const invalid = createTennisCoach('test', 4, async () => Response.json({ answers: {} }));
  assert.equal((await invalid('sunny')).source, 'local');
  console.log('Tennis checks passed: probabilities, sampling, batched questions, cache, budget, missing key, weather, malformed replies.');
}
