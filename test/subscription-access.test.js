import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { createCredits } from '../server/payments/credits.js';
import { registerUser } from '../server/auth.js';
import { plans } from '../server/payments/plans.js';

test('paid application limits and Team membership are enforced by the API', async t => {
  const app = await createApp({ databasePath: process.env.TEST_DATABASE_URL ? undefined : ':memory:', databaseUrl: process.env.TEST_DATABASE_URL,
    serveStatic: false, entitlementsRequired: true, paymentEnv: {} });
  const db = app.locals.db, accounts = [];
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    await app.locals.scans.drain(); await app.locals.evaluator.drain();
    await new Promise(resolve => server.close(resolve));
    for (const user of accounts) await db.prepare('DELETE FROM workspaces WHERE id=?').run(user.workspace.id);
    for (const user of accounts) await db.prepare('DELETE FROM users WHERE id=?').run(user.id);
    await db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function call(path, method = 'GET', body) {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
    return { status: r.status, body: r.status === 204 ? null : await r.json() };
  }
  async function account() {
    const email = `${crypto.randomUUID()}@example.com`, password = crypto.randomUUID();
    const user = await registerUser(db, { email, password, name: 'Subscription test' }); accounts.push(user);
    await db.prepare('UPDATE users SET email_verified_at=? WHERE id=?').run(new Date().toISOString(), user.id);
    assert.equal((await call('/api/auth/login', 'POST', { email, password })).status, 200);
    return user;
  }
  async function activate(user, plan) {
    const id = crypto.randomUUID(), stamp = new Date().toISOString();
    await db.prepare(`INSERT INTO payment_orders (id,workspace_id,created_by,idempotency_key,order_code,product_id,product_name,amount,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,'PAID',?,?)`).run(id, user.workspace.id, user.id, crypto.randomUUID(), Date.now() * 1000 + crypto.randomInt(1000), plan.id, plan.name, plan.amount, stamp, stamp);
    await db.transaction(() => createCredits(db).grant({ id, workspace_id: user.workspace.id, plan_key: plan.id,
      test_allowance: plan.tests, project_allowance: plan.projects, member_allowance: plan.members, processing_priority: plan.priority }))();
  }
  const owner = await account(), ownerCookie = cookie;
  const project = { name: 'Paid application', targetType: 'HTTP_CHATBOT', environment: 'STAGING' };
  assert.equal((await call('/api/projects', 'POST', project)).status, 402);
  await activate(owner, plans[0]);
  const concurrent = await Promise.all([call('/api/projects', 'POST', project), call('/api/projects', 'POST', project)]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 402]);
  const paidProject = concurrent.find(r => r.status === 201).body.project;
  const targetInput = { type: 'HTTP_CHATBOT', name: 'Owned test target', baseUrl: 'https://example.com/chat', authorized: true };
  const targetResults = await Promise.all([call(`/api/projects/${paidProject.id}/targets`, 'POST', targetInput), call(`/api/projects/${paidProject.id}/targets`, 'POST', targetInput)]);
  assert.deepEqual(targetResults.map(r => r.status).sort(), [201, 409]);
  const connected = targetResults.find(r => r.status === 201);
  await db.prepare("UPDATE targets SET last_connection_status='SUCCESS' WHERE id=?").run(connected.body.target.id);
  await db.transaction(() => createCredits(db, { required: true }).consume(owner.workspace.id, 'scan', crypto.randomUUID(), 300))();
  const blockedScan = await call('/api/scans', 'POST', { projectId: paidProject.id, targetId: connected.body.target.id, testIds: [app.locals.scans.securityTests[0].id] });
  assert.equal(blockedScan.status, 402);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM scans WHERE project_id=?').get(paidProject.id)).count, 0);
  assert.equal((await call('/api/workspaces/members', 'POST', { email: 'nobody@example.com' })).status, 402);
  const member = await account(), memberCookie = cookie;
  assert.equal((await call('/api/workspaces/switch', 'POST', { workspaceId: owner.workspace.id })).status, 404);
  cookie = ownerCookie;
  await db.prepare('UPDATE subscription_periods SET ends_at=? WHERE workspace_id=?').run('2020-01-01T00:00:00.000Z', owner.workspace.id);
  await activate(owner, plans[1]);
  assert.equal((await call('/api/workspaces/members', 'POST', { email: member.email })).status, 201);
  cookie = memberCookie;
  const switched = await call('/api/workspaces/switch', 'POST', { workspaceId: owner.workspace.id });
  assert.equal(switched.body.user.workspace.role, 'MEMBER');
  assert.equal((await call('/api/projects')).body.projects.length, 1);
  assert.equal((await call('/api/workspaces/members', 'POST', { email: owner.email })).status, 403);
  cookie = ownerCookie;
  assert.equal((await call(`/api/workspaces/members/${member.id}`, 'PATCH', { role: 'ADMIN' })).status, 200);
  cookie = memberCookie;
  assert.equal((await call('/api/auth/me')).body.user.workspace.role, 'ADMIN');
  assert.equal((await call(`/api/workspaces/members/${owner.id}`, 'DELETE')).status, 403);
  cookie = ownerCookie;
  assert.equal((await call(`/api/workspaces/members/${member.id}`, 'DELETE')).status, 204);
  cookie = memberCookie;
  assert.equal((await call('/api/auth/me')).body.user.workspace.id, member.workspace.id);
});
