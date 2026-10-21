import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createDatabase } from '../server/db/index.js';
import { registerUser } from '../server/auth.js';

const baseUrl = process.argv[2];
if (!baseUrl || !process.env.DATABASE_URL) throw new Error('Provide APP URL and DATABASE_URL for cleanup.');
const accounts = [];
const db = await createDatabase();
let cookie = '';
let checks = 0;

async function api(path, method = 'GET', input) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    ...(input ? { body: JSON.stringify(input) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  const sessionCookie = response.headers.get('set-cookie');
  if (sessionCookie) {
    assert.match(sessionCookie, /HttpOnly/i);
    assert.match(sessionCookie, /Secure/i);
    cookie = sessionCookie.split(';')[0];
  }
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}`);
  return response.json();
}

async function register() {
  const email = `deployment-check-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomBytes(24).toString('base64url');
  // Seed owned temporary accounts through the admin DB connection, not an OTP bypass.
  const user = await registerUser(db, { name: 'Deployment verification', email, password });
  accounts.push({ id: user.id, workspace: user.workspace.id, email });
  await api('/api/auth/login', 'POST', { email, password });
  checks += 1;
}

try {
  assert.equal((await api('/api/health')).ok, true);
  assert.equal((await fetch(`${baseUrl}/api/evaluations`)).status, 401);
  await register();
  assert.equal((await api('/api/evaluations/connection', 'POST', { demo: true })).result.http, 200);
  const benchmark = await api('/api/evaluations', 'POST', { demo: true, suite: 20, name: 'Deployment verification' });
  let evaluation;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    evaluation = (await api(`/api/evaluations/${benchmark.id}`)).evaluation;
    if (['COMPLETED', 'FAILED'].includes(evaluation.status)) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.equal(evaluation.status, 'COMPLETED');
  assert.equal(evaluation.progress, evaluation.total);
  assert.equal(evaluation.report.classification, 'DEMO');
  assert.equal(evaluation.report.confidence, null);
  assert.equal(evaluation.report.overall, 10);
  assert.ok(evaluation.report.results.some(item => item.status === 'REVIEW'));
  assert.equal((await api('/api/evaluations')).evaluations[0].id, benchmark.id);
  const cancelled = await api('/api/evaluations', 'POST', { demo: true, suite: 30 });
  await api(`/api/evaluations/${cancelled.id}/cancel`, 'POST', {});
  let cancellation;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    cancellation = (await api(`/api/evaluations/${cancelled.id}`)).evaluation;
    if (cancellation.status === 'CANCELLED') break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(cancellation.status, 'CANCELLED');
  checks += 1;
  const { project } = await api('/api/projects', 'POST', { name: 'Deployment verification', targetType: 'DEMO', environment: 'DEMO' });
  const { target } = await api(`/api/projects/${project.id}/targets`, 'POST', { type: 'DEMO', name: 'Verification target' });
  assert.equal((await api(`/api/targets/${target.id}/test-connection`, 'POST', {})).connection.status, 'SUCCESS');
  const { tests } = await api('/api/security-tests');
  const created = await api('/api/scans', 'POST', { projectId: project.id, targetId: target.id, testIds: tests.map(item => item.id) });
  let scan;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    scan = (await api(`/api/scans/${created.scan.id}`)).scan;
    if (['COMPLETED', 'FAILED'].includes(scan.status)) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(scan.status, 'COMPLETED');
  assert.equal(scan.completed_tests, tests.length);
  assert.ok(scan.findings.length > 0);
  checks += 1;
  const finding = scan.findings[0];
  await api(`/api/targets/${target.id}`, 'PATCH', { mode: 'fixed' });
  await api(`/api/findings/${finding.id}/retest`, 'POST', {});
  let retested;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    retested = (await api(`/api/scans/${scan.id}`)).scan;
    if (retested.findings.find(item => item.id === finding.id).retest_status !== 'RETESTING') break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(retested.findings.find(item => item.id === finding.id).retest_status, 'FIXED');
  const { report } = await api(`/api/reports/${scan.id}`);
  assert.ok(report.retests.some(item => item.finding_id === finding.id && item.status === 'FIXED'));
  checks += 1;
  await register();
  const inaccessible = await fetch(`${baseUrl}/api/scans/${scan.id}`, { headers: { cookie }, signal: AbortSignal.timeout(20_000) });
  assert.equal(inaccessible.status, 404);
  assert.equal((await fetch(`${baseUrl}/api/evaluations/${benchmark.id}`, { headers: { cookie } })).status, 404);
  checks += 1;
  for (const route of ['/login', '/app', '/app/evaluator', '/products']) {
    const response = await fetch(`${baseUrl}${route}`, { signal: AbortSignal.timeout(20_000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
  }
  console.log(JSON.stringify({ verified: true, checks, benchmark: 'COMPLETED', benchmarkCancel: true, scan: 'COMPLETED', retest: 'FIXED', workspaceIsolation: true, spaRouting: true }));
} finally {
  try {
    for (const account of accounts) {
      // Only delete the temporary accounts and workspaces created by this run.
      const owned = await db.prepare('SELECT id FROM users WHERE id=? AND email=?').get(account.id, account.email);
      if (!owned) continue;
      await db.transaction(async () => {
        await db.prepare('DELETE FROM workspaces WHERE id=?').run(account.workspace);
        await db.prepare('DELETE FROM users WHERE id=? AND email=?').run(account.id, account.email);
      })();
    }
    console.log(JSON.stringify({ temporaryAccountsRemoved: accounts.length }));
  } finally {
    await db.close();
  }
}
