import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { createDatabase } from '../server/db/index.js';
import { createEmailOtp, verifyEmailOtp, registerUser } from '../server/auth.js';
import { createApp } from '../server/app.js';

async function fixture(t) {
  const db = await createDatabase(process.env.TEST_DATABASE_URL ? undefined : ':memory:', process.env.TEST_DATABASE_URL);
  const emails = [];
  const account = () => {
    const email = `otp-${crypto.randomUUID()}@example.com`;
    emails.push(email);
    return { name: 'OTP test', email, password: 'otp-test-password' };
  };
  t.after(async () => {
    for (const email of emails) {
      const user = await db.prepare('SELECT id FROM users WHERE email=?').get(email);
      if (user) {
        const members = await db.prepare("SELECT workspace_id FROM workspace_members WHERE user_id=? AND role='OWNER'").all(user.id);
        for (const member of members) await db.prepare('DELETE FROM workspaces WHERE id=?').run(member.workspace_id);
        await db.prepare('DELETE FROM users WHERE id=?').run(user.id);
      }
      await db.prepare('DELETE FROM email_verifications WHERE email=?').run(email);
    }
    await db.close();
  });
  return { db, account };
}

test('resend preserves history, invalidates prior codes and rejects concurrent replay', async t => {
  const { db, account } = await fixture(t);
  const input = account();
  await createEmailOtp(db, input);
  const second = await createEmailOtp(db, input);
  assert.equal(Number((await db.prepare('SELECT COUNT(*) AS n FROM email_verifications WHERE email=?').get(input.email)).n), 2);
  assert.equal(Number((await db.prepare('SELECT COUNT(*) AS n FROM email_verifications WHERE email=? AND expires_at>?').get(input.email, new Date().toISOString())).n), 1);
  const results = await Promise.allSettled([verifyEmailOtp(db, input.email, second.otp), verifyEmailOtp(db, input.email, second.otp)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const session = results.find(result => result.status === 'fulfilled').value;
  assert.equal(session.user.email, input.email);
  assert.equal(session.user.emailVerified, true);
  await assert.rejects(verifyEmailOtp(db, input.email, second.otp));
  const rate = account();
  const sends = await Promise.allSettled(Array.from({ length: 4 }, () => createEmailOtp(db, rate)));
  assert.equal(sends.filter(result => result.status === 'fulfilled').length, 3);
  assert.equal(sends.filter(result => result.reason?.status === 429).length, 1);
});

test('failed attempts survive rollback boundaries and cannot reset the resend budget', async t => {
  const { db, account } = await fixture(t);
  const input = account();
  await createEmailOtp(db, input);
  for (let n = 0; n < 5; n++) await assert.rejects(verifyEmailOtp(db, input.email, '000000'), error => error.status === 400);
  assert.equal((await db.prepare('SELECT attempts FROM email_verifications WHERE email=?').get(input.email)).attempts, 5);
  await assert.rejects(verifyEmailOtp(db, input.email, '000000'), error => error.status === 429);
  await createEmailOtp(db, input);
  await createEmailOtp(db, input);
  await assert.rejects(createEmailOtp(db, input), error => error.status === 429);
  const expiredInput = account();
  const expired = await createEmailOtp(db, expiredInput);
  await db.prepare('UPDATE email_verifications SET expires_at=? WHERE email=?').run('2000-01-01T00:00:00.000Z', expired.email);
  await assert.rejects(verifyEmailOtp(db, expired.email, expired.otp), error => error.status === 400);
});

test('API requires registration OTP and supports verification of existing accounts', async t => {
  const { db, account } = await fixture(t);
  let sent;
  const app = await createApp({ db, serveStatic: false, sendVerificationOtp: async (email, otp) => { sent = { email, otp }; } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await app.locals.evaluator.drain(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const registration = account();
  assert.equal((await post('/api/auth/register', registration)).status, 403);
  assert.equal((await post('/api/auth/send-otp', registration)).status, 200);
  assert.equal((await post('/api/auth/verify-otp', sent)).status, 201);
  const existing = account();
  const user = await registerUser(db, existing);
  const login = await post('/api/auth/login', existing);
  cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/auth/email-verification/send', {})).status, 200);
  const ownCode = { ...sent };
  await assert.rejects(verifyEmailOtp(db, ownCode.email, ownCode.otp), error => error.status === 400);
  assert.equal((await post('/api/auth/email-verification/confirm', { otp: ownCode.otp, email: 'ignored@example.com' })).status, 200);
  assert.ok((await db.prepare('SELECT email_verified_at FROM users WHERE id=?').get(user.id)).email_verified_at);
  assert.equal((await post('/api/auth/email-verification/confirm', ownCode)).status, 400);
});
