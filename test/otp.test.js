import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createDatabase } from '../server/db/index.js';
import { createEmailOtp, verifyEmailOtp } from '../server/auth.js';
import { createApp } from '../server/app.js';

const account = { name: 'OTP test', email: 'otp@example.com', password: 'otp-test-password' };
test('resend preserves rate-limit history and invalidates previous OTP', t => {
  const db = createDatabase(':memory:');
  t.after(() => db.close());
  createEmailOtp(db, account);
  const second = createEmailOtp(db, account);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM email_verifications').get().n, 2);
  const session = verifyEmailOtp(db, account.email, second.otp);
  assert.equal(session.user.email, account.email);
  assert.ok(db.prepare('SELECT email_verified_at FROM users WHERE id=?').get(session.user.id).email_verified_at);
  assert.throws(() => verifyEmailOtp(db, account.email, second.otp));
  const other = { ...account, email: 'rate@example.com' };
  for (let n = 0; n < 3; n++) createEmailOtp(db, other);
  assert.throws(() => createEmailOtp(db, other), error => error.status === 429);
});

test('OTP attempt budget, expiry and registration API bypass protection', async t => {
  const db = createDatabase(':memory:');
  createEmailOtp(db, account);
  for (let n = 0; n < 5; n++) assert.throws(() => verifyEmailOtp(db, account.email, '000000'), error => error.status === 400);
  assert.throws(() => verifyEmailOtp(db, account.email, '000000'), error => error.status === 429);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM email_verifications WHERE email=?').get(account.email).n, 1);
  createEmailOtp(db, account);
  createEmailOtp(db, account);
  assert.throws(() => createEmailOtp(db, account), error => error.status === 429);
  const expired = createEmailOtp(db, { ...account, email: 'expired@example.com' });
  db.prepare('UPDATE email_verifications SET expires_at=?').run('2000-01-01T00:00:00.000Z');
  assert.throws(() => verifyEmailOtp(db, expired.email, expired.otp), error => error.status === 400);
  let sent;
  const app = createApp({ db, serveStatic: false, sendVerificationOtp: async (email, otp) => { sent = { email, otp }; } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('/api/auth/register', account)).status, 403);
  const user = { ...account, email: 'verified@example.com' };
  assert.equal((await post('/api/auth/send-otp', user)).status, 200);
  assert.equal((await post('/api/auth/verify-otp', sent)).status, 201);
});
