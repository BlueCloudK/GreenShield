import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { transactionLock } from './db/locks.js';

const SESSION_COOKIE = 'greenshield_session';
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;
const OTP_TTL_MS = 10 * 60 * 1000;
const fail = (status, message) => Object.assign(new Error(message), { status });
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = email => String(email || '').trim().toLowerCase();

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}
function validateAccount(input) {
  const account = { name: String(input.name || '').trim(), email: normalizeEmail(input.email), company: String(input.company || '').trim(), password: String(input.password || '') };
  if (!account.name || account.name.length > 120 || account.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) || account.password.length < 8 || account.password.length > 72) {
    throw fail(400, 'Tên, email hợp lệ và mật khẩu từ 8 đến 72 ký tự là bắt buộc.');
  }
  return account;
}

async function insertAccount(db, account, verified = false) {
  const stamp = new Date().toISOString();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  await db.prepare(`INSERT INTO users (id,name,email,company,password_hash,created_at,updated_at,email_verified_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(userId, account.name, account.email, account.company, account.password_hash, stamp, stamp, verified ? stamp : null);
  await db.prepare('INSERT INTO workspaces (id,name,created_at,updated_at) VALUES (?,?,?,?)').run(workspaceId, account.company || `${account.name}'s workspace`, stamp, stamp);
  await db.prepare("INSERT INTO workspace_members (workspace_id,user_id,role,created_at) VALUES (?,?,'OWNER',?)").run(workspaceId, userId, stamp);
  return userId;
}

// Internal/test helper. The public registration endpoint requires an OTP.
export async function registerUser(db, input) {
  const account = validateAccount(input);
  account.password_hash = bcrypt.hashSync(account.password, 12);
  return db.transaction(async () => {
    await transactionLock(db, `otp:${account.email}`);
    if (await db.prepare('SELECT id FROM users WHERE email=?').get(account.email)) throw fail(409, 'Email này đã được đăng ký.');
    return getUserContext(db, await insertAccount(db, account));
  })();
}

export async function createEmailOtp(db, input, { userId = null } = {}) {
  const account = userId ? await db.prepare('SELECT * FROM users WHERE id=?').get(userId) : validateAccount(input);
  if (!account) throw fail(404, 'Không tìm thấy tài khoản.');
  if (userId && account.email_verified_at) throw fail(409, 'Email đã được xác minh.');
  const purpose = userId ? 'VERIFY_EMAIL' : 'REGISTER';
  const passwordHash = userId ? '' : bcrypt.hashSync(account.password, 12);
  return db.transaction(async () => {
    await transactionLock(db, `otp:${account.email}`);
    if (!userId && await db.prepare('SELECT id FROM users WHERE email=?').get(account.email)) throw fail(409, 'Email này đã được đăng ký.');
    const stamp = new Date().toISOString();
    const recent = await db.prepare('SELECT COUNT(*) AS cnt FROM email_verifications WHERE email=? AND created_at>?').get(account.email, new Date(Date.now() - 300_000).toISOString());
    if (Number(recent.cnt) >= 3) throw fail(429, 'Quá nhiều yêu cầu. Vui lòng đợi 5 phút rồi thử lại.');
    await db.prepare('UPDATE email_verifications SET expires_at=? WHERE email=? AND purpose=?').run(stamp, account.email, purpose);
    const otp = String(crypto.randomInt(100000, 1000000));
    await db.prepare(`INSERT INTO email_verifications (id,email,otp_hash,name,company,password_hash,attempts,expires_at,created_at,purpose,user_id)
      VALUES (?,?,?,?,?,?,0,?,?,?,?)`).run(crypto.randomUUID(), account.email, hashToken(otp), account.name, account.company, passwordHash, new Date(Date.now() + OTP_TTL_MS).toISOString(), stamp, purpose, userId);
    return { otp, name: account.name, email: account.email };
  })();
}

export async function verifyEmailOtp(db, email, otp, { userId = null } = {}) {
  const normalized = normalizeEmail(email);
  const result = await db.transaction(async () => {
    await transactionLock(db, `otp:${normalized}`);
    const purpose = userId ? 'VERIFY_EMAIL' : 'REGISTER';
    const record = await db.prepare('SELECT * FROM email_verifications WHERE email=? AND purpose=? AND expires_at>? ORDER BY created_at DESC LIMIT 1').get(normalized, purpose, new Date().toISOString());
    if (!record || (userId && record.user_id !== userId)) return { error: fail(400, 'Mã xác nhận đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.') };
    if (record.attempts >= 5) {
      await db.prepare('UPDATE email_verifications SET expires_at=? WHERE id=?').run(new Date().toISOString(), record.id);
      return { error: fail(429, 'Quá nhiều lần nhập sai. Vui lòng yêu cầu mã xác nhận mới.') };
    }
    if (hashToken(String(otp || '').trim()) !== record.otp_hash) {
      await db.prepare('UPDATE email_verifications SET attempts=attempts+1 WHERE id=?').run(record.id);
      return { error: fail(400, `Mã xác nhận không đúng. Còn ${4 - record.attempts} lần thử.`) };
    }
    const stamp = new Date().toISOString();
    if (userId) {
      await db.prepare('UPDATE users SET email_verified_at=?,updated_at=? WHERE id=? AND email=?').run(stamp, stamp, userId, normalized);
      await db.prepare('UPDATE email_verifications SET expires_at=? WHERE id=?').run(stamp, record.id);
      return { user: await getUserContext(db, userId) };
    }
    if (await db.prepare('SELECT id FROM users WHERE email=?').get(normalized)) return { error: fail(409, 'Email này đã được đăng ký.') };
    const registered = await insertAccount(db, record, true);
    await db.prepare('UPDATE email_verifications SET expires_at=? WHERE id=?').run(stamp, record.id);
    return { session: await createSession(db, registered) };
  })();
  // Throw only after committing failed-attempt counters and code invalidation.
  if (result.error) throw result.error;
  return result.session || result;
}

export async function loginUser(db, email, password) {
  const user = await db.prepare('SELECT * FROM users WHERE email=?').get(normalizeEmail(email));
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) throw fail(401, 'Email hoặc mật khẩu không đúng.');
  return createSession(db, user.id);
}
async function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const stamp = new Date();
  await db.prepare('INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').run(crypto.randomUUID(), userId, hashToken(token), new Date(stamp.getTime() + SESSION_AGE_SECONDS * 1000).toISOString(), stamp.toISOString());
  return { token, user: await getUserContext(db, userId) };
}
export function setSessionCookie(response, token, useSecureCookie = false) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_AGE_SECONDS}${useSecureCookie ? '; Secure' : ''}`);
}
export function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}
export function authenticate(db) {
  return async (request, response, next) => {
    const session = await resolveSession(db, request);
    if (!session) return response.status(401).json({ error: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập.' });
    request.auth = await getUserContext(db, session.user_id);
    if (!request.auth) return response.status(401).json({ error: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập.' });
    request.sessionId = session.id;
    next();
  };
}
export function optionalAuthenticate(db) {
  return async (request, _response, next) => {
    const session = await resolveSession(db, request);
    request.auth = session ? await getUserContext(db, session.user_id) : null;
    request.sessionId = session?.id;
    next();
  };
}
async function resolveSession(db, request) {
  const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  return await db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').get(hashToken(token), new Date().toISOString()) || null;
}
export async function getUserContext(db, userId) {
  const row = await db.prepare(`SELECT u.id,u.name,u.email,u.company,u.email_verified_at,w.id AS workspace_id,w.name AS workspace_name,wm.role
    FROM users u JOIN workspace_members wm ON wm.user_id=u.id JOIN workspaces w ON w.id=wm.workspace_id WHERE u.id=? LIMIT 1`).get(userId);
  return row ? { id: row.id, name: row.name, email: row.email, company: row.company, emailVerified: Boolean(row.email_verified_at), workspace: { id: row.workspace_id, name: row.workspace_name, role: row.role } } : null;
}
export async function destroySession(db, sessionId) {
  await db.prepare('DELETE FROM sessions WHERE id=?').run(sessionId);
}
