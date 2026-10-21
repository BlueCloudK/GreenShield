import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SESSION_COOKIE = "greenshield_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerUser(db, input) {
  const now = new Date().toISOString();
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const name = String(input.name || "").trim();
  const password = String(input.password || "");
  if (!name || !email.includes("@") || password.length < 8) {
    const error = new Error("Tên, email hợp lệ và mật khẩu từ 8 ký tự là bắt buộc.");
    error.status = 400;
    throw error;
  }
  if (await db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    const error = new Error("Email này đã được đăng ký.");
    error.status = 409;
    throw error;
  }

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  await db.transaction(async () => {
    await db
      .prepare(
        `INSERT INTO users (id, name, email, company, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, name, email, String(input.company || "").trim(), bcrypt.hashSync(password, 12), now, now);
    await db
      .prepare("INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(workspaceId, input.company?.trim() || `${name}'s workspace`, now, now);
    await db
      .prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'OWNER', ?)")
      .run(workspaceId, userId, now);
  })();
  return await getUserContext(db, userId);
}

export async function loginUser(db, email, password) {
  const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(
    String(email || "")
      .trim()
      .toLowerCase(),
  );
  if (!user || !bcrypt.compareSync(String(password || ""), user.password_hash)) {
    const error = new Error("Email hoặc mật khẩu không đúng.");
    error.status = 401;
    throw error;
  }
  return await createSession(db, user.id);
}

async function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_AGE_SECONDS * 1000);
  await db
    .prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), userId, hashToken(token), expires.toISOString(), now.toISOString());
  return { token, user: await getUserContext(db, userId) };
}

export function setSessionCookie(response, token, useSecureCookie = false) {
  const secure = useSecureCookie ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_AGE_SECONDS}${secure}`,
  );
}

export function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function authenticate(db) {
  return async (request, response, next) => {
    const session = await resolveSession(db, request);
    if (!session) return response.status(401).json({ error: "AUTH_REQUIRED", message: "Vui lòng đăng nhập." });
    request.auth = await getUserContext(db, session.user_id);
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
  return (
    (await db.prepare(`SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?`).get(hashToken(token), new Date().toISOString())) ||
    null
  );
}

export async function getUserContext(db, userId) {
  const row = await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.company, w.id AS workspace_id,
    w.name AS workspace_name, wm.role
    FROM users u
    JOIN workspace_members wm ON wm.user_id = u.id
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE u.id = ? LIMIT 1`,
    )
    .get(userId);
  return row
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        company: row.company,
        workspace: { id: row.workspace_id, name: row.workspace_name, role: row.role },
      }
    : null;
}

export async function destroySession(db, sessionId) {
  await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
