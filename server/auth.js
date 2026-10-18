import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 phút
const OTP_MAX_ATTEMPTS = 5;

const SESSION_COOKIE = "greenshield_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function registerUser(db, input) {
  const now = new Date().toISOString();
  const email = String(input.email || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const password = String(input.password || "");
  if (!name || !email.includes("@") || password.length < 8) {
    const error = new Error("Tên, email hợp lệ và mật khẩu từ 8 ký tự là bắt buộc.");
    error.status = 400;
    throw error;
  }
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    const error = new Error("Email này đã được đăng ký.");
    error.status = 409;
    throw error;
  }

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  db.transaction(() => {
    db.prepare(`INSERT INTO users (id, name, email, company, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      userId,
      name,
      email,
      String(input.company || "").trim(),
      bcrypt.hashSync(password, 12),
      now,
      now,
    );
    db.prepare("INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(workspaceId, input.company?.trim() || `${name}'s workspace`, now, now);
    db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'OWNER', ?)")
      .run(workspaceId, userId, now);
  })();
  return getUserContext(db, userId);
}

/**
 * Bước 1: Tạo OTP và lưu pending registration vào DB.
 * Trả về { otp } để caller gửi email.
 */
export function createEmailOtp(db, input) {
  const email = String(input.email || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const password = String(input.password || "");
  const company = String(input.company || "").trim();

  if (!name || !email.includes("@") || password.length < 8) {
    const error = new Error("Tên, email hợp lệ và mật khẩu từ 8 ký tự là bắt buộc.");
    error.status = 400;
    throw error;
  }
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    const error = new Error("Email này đã được đăng ký.");
    error.status = 409;
    throw error;
  }

  // Rate-limit: không gửi quá 3 OTP trong 5 phút cho cùng email
  const recentCount = db.prepare(
    "SELECT COUNT(*) AS cnt FROM email_verifications WHERE email = ? AND created_at > ?"
  ).get(email, new Date(Date.now() - 5 * 60 * 1000).toISOString());
  if (recentCount.cnt >= 3) {
    const error = new Error("Quá nhiều yêu cầu. Vui lòng đợi 5 phút rồi thử lại.");
    error.status = 429;
    throw error;
  }

  // Xoá OTP cũ của email này
  db.prepare("DELETE FROM email_verifications WHERE email = ?").run(email);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO email_verifications (id, email, otp_hash, name, company, password_hash, attempts, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    crypto.randomUUID(),
    email,
    otpHash,
    name,
    company,
    bcrypt.hashSync(password, 12),
    expiresAt,
    now,
  );

  return { otp, name, email };
}

/**
 * Bước 2: Xác nhận OTP, tạo user và trả về session.
 */
export function verifyEmailOtp(db, email, otp) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const record = db.prepare(
    "SELECT * FROM email_verifications WHERE email = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
  ).get(normalizedEmail, new Date().toISOString());

  if (!record) {
    const error = new Error("Mã xác nhận đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.");
    error.status = 400;
    throw error;
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    db.prepare("DELETE FROM email_verifications WHERE id = ?").run(record.id);
    const error = new Error("Quá nhiều lần nhập sai. Vui lòng yêu cầu mã xác nhận mới.");
    error.status = 429;
    throw error;
  }

  const inputHash = crypto.createHash("sha256").update(String(otp || "").trim()).digest("hex");
  if (inputHash !== record.otp_hash) {
    db.prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?").run(record.id);
    const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
    const error = new Error(`Mã xác nhận không đúng. Còn ${remaining} lần thử.`);
    error.status = 400;
    throw error;
  }

  // OTP hợp lệ – tạo user
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();

  db.transaction(() => {
    db.prepare(`INSERT INTO users (id, name, email, company, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      userId,
      record.name,
      record.email,
      record.company,
      record.password_hash,
      now,
      now,
    );
    db.prepare("INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(workspaceId, record.company || `${record.name}'s workspace`, now, now);
    db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'OWNER', ?)")
      .run(workspaceId, userId, now);
    db.prepare("DELETE FROM email_verifications WHERE id = ?").run(record.id);
  })();

  return createSession(db, userId);
}

export function loginUser(db, email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ""), user.password_hash)) {
    const error = new Error("Email hoặc mật khẩu không đúng.");
    error.status = 401;
    throw error;
  }
  return createSession(db, user.id);
}

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_AGE_SECONDS * 1000);
  db.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), userId, hashToken(token), expires.toISOString(), now.toISOString());
  return { token, user: getUserContext(db, userId) };
}

export function setSessionCookie(response, token, useSecureCookie = false) {
  const secure = useSecureCookie ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_AGE_SECONDS}${secure}`);
}

export function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function authenticate(db) {
  return (request, response, next) => {
    const session = resolveSession(db, request);
    if (!session) return response.status(401).json({ error: "AUTH_REQUIRED", message: "Vui lòng đăng nhập." });
    request.auth = getUserContext(db, session.user_id);
    request.sessionId = session.id;
    next();
  };
}

export function optionalAuthenticate(db) {
  return (request, _response, next) => {
    const session = resolveSession(db, request);
    request.auth = session ? getUserContext(db, session.user_id) : null;
    request.sessionId = session?.id;
    next();
  };
}

function resolveSession(db, request) {
  const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  return db.prepare(`SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?`)
    .get(hashToken(token), new Date().toISOString()) || null;
}

export function getUserContext(db, userId) {
  const row = db.prepare(`SELECT u.id, u.name, u.email, u.company, w.id AS workspace_id,
    w.name AS workspace_name, wm.role
    FROM users u
    JOIN workspace_members wm ON wm.user_id = u.id
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE u.id = ? LIMIT 1`).get(userId);
  return row ? {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    workspace: { id: row.workspace_id, name: row.workspace_name, role: row.role },
  } : null;
}

export function destroySession(db, sessionId) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
