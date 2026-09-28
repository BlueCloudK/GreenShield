import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../server/app.js";

test("complete vulnerable scan, evidence, fixed retest, and report flow", async (context) => {
  const port = 41000 + Math.floor(Math.random() * 1000);
  const app = createApp({ databasePath: ":memory:", serveStatic: false, origin: `http://127.0.0.1:${port}` });
  const server = app.listen(port, "127.0.0.1");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${port}`;
  let cookie = "";

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
    body: JSON.stringify({ name: "Demo Owner", email: "owner@example.com", company: "Demo Co", password: "password123" }),
  });
  assert.equal(registration.user.workspace.role, "OWNER");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "owner@example.com", password: "password123" }),
  });
  assert.equal(login.user.email, "owner@example.com");

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

  const retry = await api(`/api/scans/${scan.id}/retry`, { method: "POST", body: "{}" });
  assert.notEqual(retry.scan.id, scan.id);
  assert.equal(retry.scan.project_id, project.id);
});
