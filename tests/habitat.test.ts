import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlan, fallback, CONTEXTS } from "../src/lib/habitat/plan.ts";
import { createDirector } from "../src/lib/habitat/director.ts";
import { createEndpoint } from "../src/lib/habitat/endpoint.ts";

test("plans validate against the context", () => {
  for (const context of CONTEXTS) assert.deepEqual(parsePlan(fallback(context), context), fallback(context));
  assert.equal(parsePlan({ actions: ["lob", "rally", "break", "gull"] }, "wet"), null);
  assert.equal(parsePlan({ actions: ["execute", "rally", "break", "gull"] }, "sunny"), null);
  assert.equal(parsePlan({ actions: ["rally"] }, "sunny"), null);
});

test("the director: concurrency, cache, cooldown, daily cap and reset, failures, no key, disabled", async () => {
  let calls = 0, time = Date.UTC(2026, 8, 21);
  const mock = async (_url: unknown, options: any) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.max_tokens, 1024);
    assert.equal(body.response_format.type, "json_schema");
    return Response.json({ model: "test-model", usage: { prompt_tokens: 123, completion_tokens: 45 }, choices: [{ message: { content: JSON.stringify(fallback("sunny")) } }] });
  };
  const direct = createDirector({ key: "test", dailyCalls: 2 }, mock, () => time);
  const results = await Promise.all(Array.from({ length: 10 }, () => direct("sunny")));
  assert.equal(results[0].usage!.input, 123);
  assert.equal(results[0].usage!.output, 45);
  assert.equal(results[0].usage!.model, "test-model");
  assert.equal(results[0].usage!.generatedAt, new Date(time).toISOString());
  assert.equal(calls, 1, "concurrent requests share one paid call");
  assert.ok(results.every((r) => r.source === "openrouter"));
  await direct("sunny"); assert.equal(calls, 1, "plans are cached");
  assert.equal((await direct("windy")).source, "local", "cross-context cooldown");
  time += 3_600_001; await direct("sunny"); assert.equal(calls, 2);
  time += 3_600_001; assert.equal((await direct("sunny")).source, "local"); assert.equal(calls, 2, "daily cap");
  time += 86_400_000; await direct("sunny"); assert.equal(calls, 3, "daily reset");
  let failures = 0;
  const failed = createDirector({ key: "test", dailyCalls: 8 }, async () => { failures++; throw Error("offline"); });
  assert.equal((await failed("sunny")).source, "local");
  await failed("sunny"); assert.equal(failures, 1, "failure backoff");
  const malformed = createDirector({ key: "test", dailyCalls: 8 }, async () => Response.json({ choices: [{ message: { content: "not json" } }] }));
  assert.equal((await malformed("sunny")).source, "local");
  const local = createDirector({ dailyCalls: 8 }, () => { throw Error("must not call without key"); });
  assert.equal((await local("sunny")).source, "local");
  const off = createDirector({ key: "test", dailyCalls: 0 }, () => { throw Error("must not call when disabled"); });
  assert.equal((await off("sunny")).source, "local");
});

test("the endpoint: GET only, a strict query, local answers are not cached", async () => {
  const endpoint = createEndpoint({});
  const url = (s: string) => new URL(`https://example.com/api/habitat${s}`);
  assert.equal((await endpoint(url("?context=sunny"), "POST")).status, 405);
  for (const query of ["", "?context=bad", "?context=sunny&prompt=hello", "?context=sunny&context=wet"]) assert.equal((await endpoint(url(query))).status, 400);
  const response = await endpoint(url("?context=sunny"));
  assert.equal(response.status, 200); assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await response.json()).source, "local");
});
