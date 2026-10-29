import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { createDatabase } from '../server/db/index.js';
import { registerUser } from '../server/auth.js';
import { createCredits } from '../server/payments/credits.js';
import { plans, nextMonth } from '../server/payments/plans.js';
import { createWorkQueue } from '../server/services/work-queue.js';

test('monthly test quota, renewal, expiry, isolation, refund and concurrent reservations', async t => {
  const db = await createDatabase(process.env.TEST_DATABASE_URL ? undefined : ':memory:', process.env.TEST_DATABASE_URL);
  const user = await registerUser(db, { name: 'Subscription verification', email: `${crypto.randomUUID()}@example.com`, password: 'subscription-test-password' });
  t.after(async () => {
    await db.prepare('DELETE FROM workspaces WHERE id=?').run(user.workspace.id);
    await db.prepare('DELETE FROM users WHERE id=?').run(user.id);
    await db.close();
  });
  let stamp = '2026-01-31T10:00:00.000Z';
  const credits = createCredits(db, { required: true, clock: () => stamp });
  async function buy(plan) {
    const order = { id: crypto.randomUUID(), workspace_id: user.workspace.id, plan_key: plan.id, test_allowance: plan.tests,
      project_allowance: plan.projects, member_allowance: plan.members, processing_priority: plan.priority };
    await db.prepare(`INSERT INTO payment_orders (id,workspace_id,created_by,idempotency_key,order_code,product_id,product_name,amount,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,'PAID',?,?)`).run(order.id, user.workspace.id, user.id, crypto.randomUUID(), Date.now() * 1000 + crypto.randomInt(1000), plan.id, plan.name, plan.amount, stamp, stamp);
    await db.transaction(async () => { await credits.grant(order); await credits.grant(order); })();
    return order;
  }
  await buy(plans[0]);
  let state = await credits.summary(user.workspace.id);
  assert.equal(state.periods.length, 1);
  assert.equal(state.active.ends_at, '2026-02-28T10:00:00.000Z');
  assert.equal(state.testsRemaining, 300);
  assert.equal((await credits.summary('unrelated-workspace')).testsRemaining, 0);
  const first = crypto.randomUUID();
  await assert.rejects(db.transaction(async () => { await credits.consume(user.workspace.id, 'scan', first, 10); throw new Error('rollback'); })(), /rollback/);
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 300);
  const results = await Promise.allSettled([first, crypto.randomUUID()].map(id => db.transaction(() => credits.consume(user.workspace.id, 'scan', id, 200))()));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 402);
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 100);
  const used = await db.prepare('SELECT resource_id FROM package_usage WHERE order_id=?').get(state.active.order_id);
  await credits.refund(used.resource_id); await credits.refund(used.resource_id);
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 300);
  const cancelled = crypto.randomUUID();
  await db.transaction(() => credits.consume(user.workspace.id, 'scan', cancelled, 100))();
  await credits.finalize(cancelled, 3);
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 297);
  await credits.refund(cancelled);
  await db.transaction(() => credits.consume(user.workspace.id, 'retest', crypto.randomUUID()))();
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 299);
  await buy(plans[1]);
  state = await credits.summary(user.workspace.id);
  assert.equal(state.active.plan_key, 'builder_pro');
  assert.equal(state.next.plan_key, 'team');
  assert.equal(state.next.starts_at, state.active.ends_at);
  stamp = state.next.starts_at;
  assert.equal((await credits.summary(user.workspace.id)).testsRemaining, 1500);
  stamp = '2027-01-01T00:00:00.000Z';
  assert.equal((await credits.summary(user.workspace.id)).active, null);
  await assert.rejects(db.transaction(() => credits.consume(user.workspace.id, 'scan', crypto.randomUUID()))(), { status: 402 });
});

test('calendar months clamp dates and waiting Team jobs take priority', async () => {
  assert.equal(nextMonth('2028-01-31T10:00:00.000Z'), '2028-02-29T10:00:00.000Z');
  assert.equal(nextMonth('2026-01-30T20:00:00.000Z'), '2026-02-27T20:00:00.000Z');
  const queue = createWorkQueue(1), order = [];
  const low = queue.enqueue(() => order.push('builder'), 0);
  const high = queue.enqueue(() => order.push('team'), 1);
  await Promise.all([low, high]);
  assert.deepEqual(order, ['team', 'builder']);
});
