import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/db/index.js';
import { registerUser } from '../server/auth.js';
import { createPayOS } from '../server/payments/payos.js';
import { paymentConfig } from '../server/payments/service.js';

const env = {
  NODE_ENV: 'test', PAYOS_ENABLED: 'true', PAYOS_ASSESSMENT_AMOUNT_VND: '2000',
  PAYOS_PUBLIC_ORIGIN: 'http://127.0.0.1:5174', PAYOS_CLIENT_ID: 'test-client',
  PAYOS_API_KEY: 'test-api-key', PAYOS_CHECKSUM_KEY: 'a'.repeat(64),
};

async function setup(t, { disabled = false, timeout = false } = {}) {
  const db = await createDatabase(process.env.TEST_DATABASE_URL ? undefined : ':memory:', process.env.TEST_DATABASE_URL);
  const accounts = [];
  const states = new Map();
  const sdk = createPayOS(env);
  let creates = 0;
  const fake = {
    webhooks: sdk.webhooks,
    paymentRequests: {
      async create(input) {
        creates++;
        assert.equal(input.amount, 2000);
        assert.ok(input.returnUrl.startsWith(env.PAYOS_PUBLIC_ORIGIN + '/app/billing?order='));
        const state = { id: `link-${input.orderCode}`, orderCode: input.orderCode, amount: input.amount, amountPaid: 0, status: 'PENDING' };
        states.set(input.orderCode, state);
        await new Promise(resolve => setTimeout(resolve, 10));
        if (timeout) throw new Error('Test timeout with private upstream details');
        return { ...state, paymentLinkId: state.id, currency: 'VND', checkoutUrl: `https://pay.payos.vn/web/${state.id}` };
      },
      async get(code) { return { ...states.get(code) }; },
      async cancel(code) { if (states.get(code).status !== 'PAID') states.get(code).status = 'CANCELLED'; },
    },
  };
  const app = await createApp({ db, serveStatic: false, paymentEnv: disabled ? {} : env, payosClient: fake });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await app.locals.evaluator.drain();
    await new Promise(resolve => server.close(resolve));
    for (const user of accounts) {
      await db.prepare('DELETE FROM workspaces WHERE id=?').run(user.workspace.id);
      await db.prepare('DELETE FROM users WHERE id=?').run(user.id);
    }
    await db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function call(path, body, headers = {}) {
    const r = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
    return { status: r.status, body: await r.json() };
  }
  async function login(email, verified = true) {
    email = `${crypto.randomUUID()}-${email}`;
    const user = await registerUser(db, { name: 'Payment test', email, password: 'payment-test-only-password' });
    accounts.push(user);
    if (verified) await db.prepare('UPDATE users SET email_verified_at=? WHERE id=?').run(new Date().toISOString(), user.id);
    assert.equal((await call('/api/auth/login', { email, password: 'payment-test-only-password' })).status, 200);
    return user;
  }
  const create = key => call('/api/payments/orders', { productId: 'assessment' }, { 'Idempotency-Key': key });
  async function webhook(order, overrides = {}) {
    const data = { code: '00', orderCode: order.order_code, paymentLinkId: order.payment_link_id || `link-${order.order_code}`, amount: 2000, currency: 'VND', ...overrides };
    return call('/api/payments/webhook', { code: '00', success: true, data, signature: await sdk.crypto.createSignatureFromObj(data, env.PAYOS_CHECKSUM_KEY) });
  }
  return { db, states, call, login, create, webhook, creates: () => creates };
}

test('PayOS requires explicit production approval and an HTTPS origin', () => {
  assert.equal(paymentConfig({}).enabled, false);
  assert.throws(() => paymentConfig({ ...env, NODE_ENV: 'production' }), /not authorized/);
  const production = { ...env, NODE_ENV: 'production', PAYOS_PRODUCTION_APPROVED: 'true', PAYOS_PUBLIC_ORIGIN: 'https://www.greenshieldai.tech' };
  assert.equal(paymentConfig(production).enabled, true);
  assert.throws(() => paymentConfig({ ...production, PAYOS_PRODUCTION_APPROVED: 'false' }), /not authorized/);
  assert.throws(() => paymentConfig({ ...production, PAYOS_PUBLIC_ORIGIN: 'http://127.0.0.1:3102' }), /origin/);
  assert.throws(() => paymentConfig({ ...env, PAYOS_API_KEY: '' }), /Configure/);
  assert.throws(() => paymentConfig({ ...env, PAYOS_PUBLIC_ORIGIN: 'https://user:pass@example.com' }), /origin/);
});

test('disabled mode, authentication, verified email, role and server pricing gates', async t => {
  const f = await setup(t, { disabled: true });
  assert.equal((await f.call('/api/payments/config')).status, 401);
  await f.login('disabled@example.com');
  const config = await f.call('/api/payments/config');
  assert.equal(config.body.enabled, false);
  assert.equal((await f.create('disabled-request-key')).status, 503);
  assert.equal(f.creates(), 0);
  const g = await setup(t);
  const user = await g.login('unverified@example.com', false);
  assert.equal((await g.create('unverified-request-key')).status, 403);
  await g.db.prepare('UPDATE users SET email_verified_at=? WHERE id=?').run(new Date().toISOString(), user.id);
  await g.db.prepare("UPDATE workspace_members SET role='MEMBER' WHERE user_id=?").run(user.id);
  assert.equal((await g.create('member-request-key')).status, 403);
  await g.db.prepare("UPDATE workspace_members SET role='OWNER' WHERE user_id=?").run(user.id);
  assert.equal((await g.call('/api/payments/orders', { productId: 'assessment', amount: 1 }, { 'Idempotency-Key': 'client-price-request-key' })).status, 400);
  assert.equal((await g.call('/api/payments/orders', { productId: 'assessment' }, { origin: 'https://evil.example', 'Idempotency-Key': 'cross-origin-request-key' })).status, 403);
});

test('idempotent checkout, verified webhook, amount validation and workspace isolation', async t => {
  const f = await setup(t);
  await f.login('owner@example.com');
  const [a, b] = await Promise.all([f.create('same-checkout-request-key'), f.create('same-checkout-request-key')]);
  assert.equal(a.body.order.id, b.body.order.id);
  assert.equal(f.creates(), 1);
  const order = a.body.order.status === 'PENDING' ? a.body.order : b.body.order;
  assert.equal(order.amount, 2000);
  assert.equal((await f.create('another-checkout-key')).body.order.id, order.id);
  assert.equal((await f.call('/api/payments/webhook', { success: true, data: { orderCode: order.order_code }, signature: 'invalid' })).status, 400);
  assert.equal((await f.webhook(order, { amount: 1999 })).status, 409);
  assert.equal((await f.webhook(order, { paymentLinkId: 'wrong-link' })).status, 409);
  assert.equal((await f.call(`/api/payments/orders/${order.id}?status=PAID&cancel=false`)).body.order.status, 'PENDING');
  assert.equal((await f.call(`/api/payments/orders/${order.id}/refresh`, {})).body.order.status, 'PENDING');
  f.states.get(order.order_code).status = 'PAID';
  f.states.get(order.order_code).amountPaid = 1000;
  assert.equal((await f.webhook(order)).status, 409);
  f.states.get(order.order_code).amountPaid = 2000;
  const repeated = await Promise.all([f.webhook(order), f.webhook(order), f.webhook(order)]);
  assert.ok(repeated.every(result => result.status === 200));
  assert.equal(Number((await f.db.prepare('SELECT COUNT(*) AS n FROM payment_receipts WHERE order_id=?').get(order.id)).n), 1);
  f.states.get(order.order_code).status = 'CANCELLED';
  assert.equal((await f.call(`/api/payments/orders/${order.id}/refresh`, {})).body.order.status, 'PAID');
  await f.login('outsider@example.com');
  for (const path of [`/api/payments/orders/${order.id}`, `/api/payments/orders/${order.id}/refresh`, `/api/payments/orders/${order.id}/cancel`]) {
    assert.equal((await f.call(path, path.endsWith(order.id) ? undefined : {})).status, 404);
  }
  assert.equal((await f.call('/api/payments/orders')).body.orders.length, 0);
});

test('ambiguous create timeout is recoverable without creating a duplicate charge', async t => {
  const f = await setup(t, { timeout: true });
  await f.login('timeout@example.com');
  const first = await f.create('timeout-checkout-key');
  assert.equal(first.status, 502);
  assert.ok(!JSON.stringify(first.body).includes('private upstream'));
  const order = (await f.create('timeout-checkout-key')).body.order;
  assert.equal(order.status, 'UNKNOWN');
  assert.equal(f.creates(), 1);
  f.states.get(order.order_code).status = 'PAID';
  f.states.get(order.order_code).amountPaid = 2000;
  assert.equal((await f.call(`/api/payments/orders/${order.id}/refresh`, {})).body.order.status, 'PAID');
  assert.equal(Number((await f.db.prepare('SELECT COUNT(*) AS n FROM payment_receipts WHERE order_id=?').get(order.id)).n), 1);
});

test('pending order cancellation is verified with PayOS rather than a redirect', async t => {
  const f = await setup(t);
  await f.login('cancel@example.com');
  const order = (await f.create('cancel-checkout-request-key')).body.order;
  assert.equal((await f.call(`/api/payments/orders/${order.id}/cancel`, {})).body.order.status, 'CANCELLED');
  assert.equal(Number((await f.db.prepare('SELECT COUNT(*) AS n FROM payment_receipts WHERE order_id=?').get(order.id)).n), 0);
});
