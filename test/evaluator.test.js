import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../server/app.js";
import { isPublicAddress, pathValue, requestBody, redact, resolveEndpoint } from "../server/evaluator/client.js";
import { validateConfig } from "../server/evaluator/service.js";
import { check } from "../server/evaluator/scoring.js";

test("endpoint mapping, masking and safety validation", async () => {
  assert.equal(pathValue({ choices: [{ message: { content: "hello" } }] }, "choices[0].message.content"), "hello");
  assert.equal(pathValue({}, "constructor.prototype"), undefined);
  const config = validateConfig({ template: '{"messages":[{"role":"user","content":"{{PROMPT}}"}]}', conversation: "messages", authorized: true });
  assert.equal(
    requestBody(config, { prompt: '"Hello"\nworld', history: [{ role: "user", content: "ORANGE" }] }).messages[1].content,
    '"Hello"\nworld',
  );
  assert.deepEqual(redact({ authorization: "Bearer demo-secret", response: "demo-secret someone@example.com" }, ["demo-secret"]), {
    authorization: "[REDACTED]",
    response: "[REDACTED] [EMAIL]",
  });
  for (const address of ["127.0.0.1", "169.254.169.254", "10.0.0.1", "100.64.0.1", "::1", "::ffff:127.0.0.1", "2001:db8::1"])
    assert.equal(isPublicAddress(address), false);
  assert.equal(isPublicAddress("1.1.1.1"), true);
  await assert.rejects(
    resolveEndpoint("https://service.example.org", async () => [{ address: "10.0.0.1", family: 4 }]),
    /không được phép/,
  );
  await assert.rejects(resolveEndpoint("https://127.0.0.1"), /hostname/);
  assert.throws(() => validateConfig({ headers: '{"Host":"localhost"}' }), /Headers/);
  assert.throws(() => validateConfig({ suite: 300 }), /không hợp lệ/);
  assert.equal(check({ method: "review" }, "open-ended answer").score, null);
});

test("authenticated benchmark fixture completes, persists, isolates and cancels", async (context) => {
  const app = await createApp({ databasePath: ":memory:", serveStatic: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  context.after(async () => {
    await app.locals.evaluator.drain();
    await new Promise((resolve) => server.close(resolve));
    await app.locals.db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie;
  async function call(path, method = "GET", body) {
    const r = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const set = r.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const json = await r.json();
    assert.ok(r.ok, JSON.stringify(json));
    return json;
  }
  assert.equal((await fetch(base + "/api/evaluations")).status, 401);
  for (const email of ["one@example.com", "two@example.com"])
    await call("/api/auth/register", "POST", { name: "Evaluator owner", email, password: "password123" });
  await call("/api/auth/login", "POST", { email: "one@example.com", password: "password123" });
  const ownerCookie = cookie;
  const connection = await call("/api/evaluations/connection", "POST", { demo: true });
  assert.equal(connection.result.http, 200);
  const created = await call("/api/evaluations", "POST", {
    demo: true,
    name: "Fixture benchmark",
    suite: 20,
    apiKey: "do-not-persist-this-secret",
  });
  let evaluation;
  for (let n = 0; n < 80; n += 1) {
    evaluation = (await call(`/api/evaluations/${created.id}`)).evaluation;
    if (evaluation.status === "COMPLETED") break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(evaluation.status, "COMPLETED");
  assert.equal(evaluation.progress, evaluation.total);
  assert.equal(evaluation.report.classification, "DEMO");
  assert.equal(evaluation.report.confidence, null);
  assert.equal(evaluation.report.overall, 10);
  assert.ok(evaluation.report.results.some((row) => row.status === "REVIEW"));
  assert.ok(!JSON.stringify(evaluation).includes("do-not-persist-this-secret"));
  assert.equal((await call("/api/evaluations")).evaluations[0].id, created.id);
  await call("/api/auth/login", "POST", { email: "two@example.com", password: "password123" });
  assert.equal((await fetch(base + `/api/evaluations/${created.id}`, { headers: { cookie } })).status, 404);
  cookie = ownerCookie;
  const cancelled = await call("/api/evaluations", "POST", { demo: true, suite: 30 });
  await call(`/api/evaluations/${cancelled.id}/cancel`, "POST", {});
  await app.locals.evaluator.drain();
  assert.equal((await call(`/api/evaluations/${cancelled.id}`)).evaluation.status, "CANCELLED");
});
