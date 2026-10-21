import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { createApp } from "../server/app.js";

test("complete vulnerable scan, evidence, fixed retest, and report flow", async (context) => {
  const port = 41000 + Math.floor(Math.random() * 1000);
  const app = await createApp({
    databasePath: process.env.TEST_DATABASE_URL ? undefined : ":memory:",
    databaseUrl: process.env.TEST_DATABASE_URL,
    serveStatic: false,
    allowUnverifiedSignup: true,
    origin: `http://127.0.0.1:${port}`,
  });
  const server = app.listen(port, "127.0.0.1");
  context.after(async () => {
    await app.locals.scans.drain();
    await new Promise((resolve) => server.close(resolve));
    await app.locals.db.close();
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  let cookie = "";
  const email = `owner-${crypto.randomUUID()}@example.com`;

  async function api(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...options.headers },
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
    return body;
  }

  const registration = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Demo Owner", email, company: "Demo Co", password: "password123" }),
  });
  assert.equal(registration.user.workspace.role, "OWNER");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123" }),
  });
  assert.equal(login.user.email, email);

  const { project } = await api("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name: "My AI Assistant", targetType: "DEMO", environment: "DEMO" }),
  });
  const { target } = await api(`/api/projects/${project.id}/targets`, {
    method: "POST",
    body: JSON.stringify({ type: "DEMO", name: "Vulnerable demo AI" }),
  });
  const connection = await api(`/api/targets/${target.id}/test-connection`, { method: "POST", body: "{}" });
  assert.equal(connection.connection.status, "SUCCESS");

  const registry = await api("/api/security-tests");
  const created = await api("/api/scans", {
    method: "POST",
    body: JSON.stringify({ projectId: project.id, targetId: target.id, testIds: registry.tests.map((item) => item.id) }),
  });
  let scan;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    scan = (await api(`/api/scans/${created.scan.id}`)).scan;
    if (["COMPLETED", "FAILED"].includes(scan.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(scan.status, "COMPLETED");
  assert.equal(scan.completed_tests, registry.tests.length);
  assert.ok(scan.findings.length >= 1);
  assert.ok(scan.findings[0].test_input);
  assert.ok(scan.findings[0].target_response);

  await api(`/api/targets/${target.id}`, { method: "PATCH", body: JSON.stringify({ mode: "fixed" }) });
  const findingId = scan.findings[0].id;
  await api(`/api/findings/${findingId}/retest`, { method: "POST", body: "{}" });
  let retested;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    retested = (await api(`/api/scans/${scan.id}`)).scan;
    const finding = retested.findings.find((item) => item.id === findingId);
    if (finding.retest_status !== "RETESTING") break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(retested.findings.find((item) => item.id === findingId).retest_status, "FIXED");

  const report = await api(`/api/reports/${scan.id}`);
  assert.equal(report.report.scope.project, "My AI Assistant");
  assert.ok(report.report.retests.some((item) => item.finding_id === findingId && item.status === "FIXED"));
  assert.ok(report.report.risk.score <= report.report.risk.initialScore);

  const ownerCookie = cookie;
  const otherEmail = `other-${crypto.randomUUID()}@example.com`;
  await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Other Owner", email: otherEmail, password: "password123" }),
  });
  await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: otherEmail, password: "password123" }),
  });
  const inaccessible = await fetch(`${baseUrl}/api/scans/${scan.id}`, { headers: { cookie } });
  assert.equal(inaccessible.status, 404);
  cookie = ownerCookie;
  assert.equal(typeof (await api("/api/dashboard")).metrics.active_projects, "number");

  const retry = await api(`/api/scans/${scan.id}/retry`, { method: "POST", body: "{}" });
  assert.notEqual(retry.scan.id, scan.id);
  assert.equal(retry.scan.project_id, project.id);
  await app.locals.scans.drain();
  await app.locals.db.prepare("UPDATE scans SET status='RUNNING' WHERE id=?").run(retry.scan.id);
  await app.locals.scans.recoverInterrupted();
  assert.equal((await api(`/api/scans/${retry.scan.id}`)).scan.status, "FAILED");
});
