import crypto from "node:crypto";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate, clearSessionCookie, createEmailOtp, destroySession, loginUser, optionalAuthenticate, registerUser, setSessionCookie, verifyEmailOtp } from "./auth.js";
import { createDatabase, json } from "./db/index.js";
import { respondAsDemoTarget } from "./security/demo-target.js";
import { encryptSecret } from "./security/secret-provider.js";
import { calculateRisk } from "./security/scoring.js";
import { sendTargetRequest } from "./security/target-client.js";
import { createScanService, httpError } from "./services/scan-service.js";
import { sendVerificationOtp } from "./services/email-service.js";
import { createPayments } from "./payments/service.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export function createApp(options = {}) {
  const db = options.db || createDatabase(options.databasePath);
  const app = express();
  const origin = options.origin || process.env.APP_ORIGIN || `http://127.0.0.1:${process.env.PORT || 3000}`;
  const scans = createScanService({ db, origin });
  const requireAuth = authenticate(db);
  const readAuth = optionalAuthenticate(db);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "200kb" }));
  app.use('/api/payments', createPayments({ db, requireAuth, env: options.paymentEnv || process.env, client: options.payosClient }));

  app.get("/api/health", (_request, response) => response.json({ ok: true, service: "greenshield" }));

  app.post("/api/contact", (request, response, next) => {
    try {
      if (request.body?.website) return response.status(202).json({ received: true });
      const fullName = String(request.body?.fullName || "").trim();
      const email = String(request.body?.email || "").trim().toLowerCase();
      const subject = String(request.body?.subject || "").trim();
      const message = String(request.body?.message || "").trim();
      if (!fullName || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !subject || subject.length > 160 || message.length < 10 || message.length > 4000) {
        throw httpError(400, "Vui lòng kiểm tra lại thông tin liên hệ.");
      }
      const recent = db.prepare("SELECT 1 FROM contact_requests WHERE email=? AND created_at>? LIMIT 1").get(email, new Date(Date.now() - 60_000).toISOString());
      if (recent) throw httpError(429, "Vui lòng đợi một phút trước khi gửi yêu cầu khác.");
      db.prepare("INSERT INTO contact_requests (id, full_name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id("contact"), fullName, email, subject, message, now());
      response.status(201).json({ received: true });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/send-otp", async (request, response, next) => {
    try {
      const result = createEmailOtp(db, request.body || {});
      await (options.sendVerificationOtp || sendVerificationOtp)(result.email, result.otp, result.name);
      response.status(200).json({ sent: true, email: result.email });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/verify-otp", async (request, response, next) => {
    try {
      const session = verifyEmailOtp(db, request.body?.email, request.body?.otp);
      setSessionCookie(response, session.token, request.secure || request.headers["x-forwarded-proto"] === "https");
      response.status(201).json({ user: session.user });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/register", (request, response, next) => {
    try {
      if (options.allowUnverifiedSignup !== true) throw httpError(403, "Vui lòng đăng ký bằng mã xác nhận email.");
      const user = registerUser(db, request.body || {});
      response.status(201).json({ user });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/login", (request, response, next) => {
    try {
      const session = loginUser(db, request.body?.email, request.body?.password);
      setSessionCookie(response, session.token, request.secure || request.headers["x-forwarded-proto"] === "https");
      response.json({ user: session.user });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/logout", requireAuth, (request, response) => {
    destroySession(db, request.sessionId);
    clearSessionCookie(response);
    response.status(204).end();
  });

  app.get("/api/auth/me", readAuth, (request, response) => response.json({ user: request.auth }));

  app.post("/api/demo-target/:targetId/chat", async (request, response) => {
    if (request.headers["x-greenshield-internal"] !== (process.env.INTERNAL_DEMO_TOKEN || "greenshield-local-demo")) {
      return response.status(404).json({ error: "NOT_FOUND" });
    }
    const target = db.prepare("SELECT * FROM targets WHERE id=? AND type='DEMO'").get(request.params.targetId);
    if (!target) return response.status(404).json({ error: "TARGET_NOT_FOUND" });
    await new Promise((resolve) => setTimeout(resolve, 220));
    const mode = json(target.config_json, {}).mode || "vulnerable";
    return response.json(respondAsDemoTarget(mode, request.body?.prompt));
  });

  app.get("/api/security-tests", requireAuth, (_request, response) => {
    response.json({ tests: scans.securityTests.map(({ evaluate, recommendation, ...test }) => ({ ...test, recommendation })) });
  });

  app.get("/api/dashboard", requireAuth, (request, response) => {
    const workspaceId = request.auth.workspace.id;
    const metrics = db.prepare(`SELECT
      (SELECT COUNT(*) FROM projects WHERE workspace_id=? AND archived_at IS NULL) AS active_projects,
      (SELECT COUNT(*) FROM scans s JOIN projects p ON p.id=s.project_id WHERE p.workspace_id=?) AS recent_scans,
      (SELECT COUNT(*) FROM findings f JOIN scans s ON s.id=f.scan_id JOIN projects p ON p.id=s.project_id WHERE p.workspace_id=? AND f.status='OPEN') AS open_findings,
      (SELECT COUNT(*) FROM findings f JOIN scans s ON s.id=f.scan_id JOIN projects p ON p.id=s.project_id WHERE p.workspace_id=? AND f.severity IN ('HIGH','CRITICAL') AND f.status='OPEN') AS high_findings,
      (SELECT COUNT(*) FROM findings f JOIN scans s ON s.id=f.scan_id JOIN projects p ON p.id=s.project_id WHERE p.workspace_id=? AND f.status='FIXED') AS fixed_findings`)
      .get(workspaceId, workspaceId, workspaceId, workspaceId, workspaceId);
    const projects = listProjects(db, workspaceId).slice(0, 5);
    const recentScans = db.prepare(`SELECT s.*, p.name AS project_name, t.name AS target_name
      FROM scans s JOIN projects p ON p.id=s.project_id JOIN targets t ON t.id=s.target_id
      WHERE p.workspace_id=? ORDER BY s.created_at DESC LIMIT 8`).all(workspaceId);
    response.json({ metrics, projects, recentScans });
  });

  app.get("/api/projects", requireAuth, (request, response) => {
    response.json({ projects: listProjects(db, request.auth.workspace.id, request.query.search) });
  });

  app.post("/api/projects", requireAuth, (request, response, next) => {
    try {
      const name = String(request.body?.name || "").trim();
      if (!name) throw httpError(400, "Tên project là bắt buộc.");
      const projectId = id("project");
      const createdAt = now();
      db.prepare(`INSERT INTO projects (id, workspace_id, name, description, target_type, environment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        projectId,
        request.auth.workspace.id,
        name,
        String(request.body?.description || "").trim(),
        request.body?.targetType || "DEMO",
        request.body?.environment || "DEMO",
        createdAt,
        createdAt,
      );
      addAudit(db, request.auth, "PROJECT_CREATED", "project", projectId);
      response.status(201).json({ project: getProject(db, projectId, request.auth.workspace.id) });
    } catch (error) { next(error); }
  });

  app.get("/api/projects/:projectId", requireAuth, (request, response, next) => {
    try {
      const project = getProject(db, request.params.projectId, request.auth.workspace.id);
      if (!project) throw httpError(404, "Không tìm thấy project.");
      response.json({ project });
    } catch (error) { next(error); }
  });

  app.patch("/api/projects/:projectId", requireAuth, (request, response, next) => {
    try {
      const project = getProject(db, request.params.projectId, request.auth.workspace.id);
      if (!project) throw httpError(404, "Không tìm thấy project.");
      db.prepare(`UPDATE projects SET name=?, description=?, environment=?, updated_at=? WHERE id=?`)
        .run(request.body?.name || project.name, request.body?.description ?? project.description, request.body?.environment || project.environment, now(), project.id);
      response.json({ project: getProject(db, project.id, request.auth.workspace.id) });
    } catch (error) { next(error); }
  });

  app.delete("/api/projects/:projectId", requireAuth, (request, response, next) => {
    try {
      const project = getProject(db, request.params.projectId, request.auth.workspace.id);
      if (!project) throw httpError(404, "Không tìm thấy project.");
      db.prepare("UPDATE projects SET status='ARCHIVED', archived_at=?, updated_at=? WHERE id=?").run(now(), now(), project.id);
      addAudit(db, request.auth, "PROJECT_ARCHIVED", "project", project.id);
      response.status(204).end();
    } catch (error) { next(error); }
  });

  app.post("/api/projects/:projectId/targets", requireAuth, (request, response, next) => {
    try {
      const project = getProject(db, request.params.projectId, request.auth.workspace.id);
      if (!project) throw httpError(404, "Không tìm thấy project.");
      const targetType = request.body?.type || "DEMO";
      const targetId = id("target");
      const createdAt = now();
      const baseUrl = targetType === "DEMO" ? "demo://included" : String(request.body?.baseUrl || "").trim();
      if (!baseUrl) throw httpError(400, "Target URL là bắt buộc.");
      db.prepare(`INSERT INTO targets (id, project_id, name, type, base_url, method, headers_json,
        credential_ciphertext, request_template_json, prompt_field, response_field, timeout_ms, config_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        targetId, project.id, request.body?.name || "Included demo target", targetType, baseUrl,
        request.body?.method || "POST", JSON.stringify(request.body?.headers || {}), encryptSecret(request.body?.credential || ""),
        JSON.stringify(request.body?.requestTemplate || {}), request.body?.promptField || "prompt",
        request.body?.responseField || "message", Math.min(Number(request.body?.timeoutMs) || 8000, 15000),
        JSON.stringify({ mode: request.body?.mode === "fixed" ? "fixed" : "vulnerable" }), createdAt, createdAt,
      );
      addAudit(db, request.auth, "TARGET_CREATED", "target", targetId, { projectId: project.id, type: targetType });
      response.status(201).json({ target: sanitizeTarget(db.prepare("SELECT * FROM targets WHERE id=?").get(targetId)) });
    } catch (error) { next(error); }
  });

  app.patch("/api/targets/:targetId", requireAuth, (request, response, next) => {
    try {
      const target = ownedTarget(db, request.params.targetId, request.auth.workspace.id);
      if (!target) throw httpError(404, "Không tìm thấy target.");
      if (target.type !== 'DEMO' || !['fixed', 'vulnerable'].includes(request.body?.mode)) throw httpError(400, "Chỉ demo target hỗ trợ chuyển chế độ vulnerable/fixed.");
      const config = { ...json(target.config_json, {}), ...(request.body?.mode ? { mode: request.body.mode } : {}) };
      db.prepare("UPDATE targets SET config_json=?, updated_at=? WHERE id=?").run(JSON.stringify(config), now(), target.id);
      addAudit(db, request.auth, "TARGET_UPDATED", "target", target.id, { mode: config.mode });
      response.json({ target: sanitizeTarget({ ...target, config_json: JSON.stringify(config) }) });
    } catch (error) { next(error); }
  });

  app.post("/api/targets/:targetId/test-connection", requireAuth, async (request, response, next) => {
    try {
      const target = ownedTarget(db, request.params.targetId, request.auth.workspace.id);
      if (!target) throw httpError(404, "Không tìm thấy target.");
      const result = await sendTargetRequest(target, "Trả lời đúng một từ: OK", { origin });
      const status = result.ok ? "SUCCESS" : "FAILED";
      db.prepare("UPDATE targets SET last_connection_status=?, last_connection_at=?, updated_at=? WHERE id=?")
        .run(status, now(), now(), target.id);
      response.json({ connection: { status, latencyMs: result.latencyMs, httpStatus: result.status, responsePreview: result.text.slice(0, 240) } });
    } catch (error) {
      const target = ownedTarget(db, request.params.targetId, request.auth.workspace.id);
      if (target) db.prepare("UPDATE targets SET last_connection_status='FAILED', last_connection_at=?, updated_at=? WHERE id=?").run(now(), now(), target.id);
      next(error);
    }
  });

  app.post("/api/scans", requireAuth, (request, response, next) => {
    try {
      const scan = scans.createScan({
        projectId: request.body?.projectId,
        targetId: request.body?.targetId,
        testIds: request.body?.testIds,
        name: request.body?.name,
        workspaceId: request.auth.workspace.id,
        actorUserId: request.auth.id,
      });
      response.status(202).json({ scan });
    } catch (error) { next(error); }
  });

  app.get("/api/scans/:scanId", requireAuth, (request, response, next) => {
    try {
      const scan = scans.getScan(request.params.scanId, request.auth.workspace.id);
      if (!scan) throw httpError(404, "Không tìm thấy scan.");
      response.json({ scan });
    } catch (error) { next(error); }
  });

  app.post('/api/scans/:scanId/retry', requireAuth, (request, response, next) => {
    try {
      const previous = scans.getScan(request.params.scanId, request.auth.workspace.id);
      if (!previous) throw httpError(404, 'Không tìm thấy scan.');
      if (['QUEUED', 'RUNNING'].includes(previous.status)) throw httpError(409, 'Scan vẫn đang chạy.');
      const config = db.prepare('SELECT test_ids_json FROM scan_configurations WHERE scan_id=?').get(previous.id);
      const scan = scans.createScan({ projectId: previous.project_id, targetId: previous.target_id, testIds: JSON.parse(config.test_ids_json), name: previous.name, workspaceId: request.auth.workspace.id, actorUserId: request.auth.id });
      response.status(202).json({ scan });
    } catch (error) { next(error); }
  });

  app.post("/api/findings/:findingId/retest", requireAuth, async (request, response, next) => {
    try {
      const retest = await scans.retestFinding({
        findingId: request.params.findingId,
        workspaceId: request.auth.workspace.id,
        actorUserId: request.auth.id,
      });
      response.status(202).json({ retest });
    } catch (error) { next(error); }
  });

  app.get("/api/reports/:scanId", requireAuth, (request, response, next) => {
    try {
      const scan = scans.getScan(request.params.scanId, request.auth.workspace.id);
      if (!scan) throw httpError(404, "Không tìm thấy report.");
      if (scan.status !== "COMPLETED") throw httpError(409, "Report chỉ có sau khi scan hoàn tất.");
      const retests = db.prepare(`SELECT r.* FROM retests r JOIN findings f ON f.id=r.finding_id
        WHERE f.scan_id=? ORDER BY r.created_at`).all(scan.id);
      response.json({ report: buildReport(scan, retests) });
    } catch (error) { next(error); }
  });

  app.use("/api", (_request, response) => response.status(404).json({ error: "NOT_FOUND", message: "API route không tồn tại." }));

  const distDir = path.join(rootDir, "dist");
  if (fs.existsSync(distDir) && options.serveStatic !== false) {
    app.use(express.static(distDir, { index: false }));
    app.use((request, response, next) => {
      if (request.method !== "GET") return next();
      return response.sendFile('index.html', { root: distDir });
    });
  }

  app.use((error, _request, response, _next) => {
    console.error(JSON.stringify({ level: "error", message: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined }));
    response.status(error.status || 500).json({ error: error.code || "REQUEST_FAILED", message: error.status ? error.message : "Không thể xử lý yêu cầu." });
  });

  app.locals.db = db;
  return app;
}

function listProjects(db, workspaceId, search = "") {
  const term = `%${String(search).trim()}%`;
  return db.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM targets t WHERE t.project_id=p.id) AS target_count,
    (SELECT COUNT(*) FROM scans s WHERE s.project_id=p.id) AS scan_count,
    (SELECT COUNT(*) FROM findings f JOIN scans s ON s.id=f.scan_id WHERE s.project_id=p.id AND f.status='OPEN') AS open_findings,
    (SELECT risk_level FROM scans s WHERE s.project_id=p.id AND s.status='COMPLETED' ORDER BY s.completed_at DESC LIMIT 1) AS risk_level,
    (SELECT created_at FROM scans s WHERE s.project_id=p.id ORDER BY s.created_at DESC LIMIT 1) AS last_scan_at
    FROM projects p WHERE p.workspace_id=? AND p.archived_at IS NULL AND (p.name LIKE ? OR p.description LIKE ?)
    ORDER BY p.updated_at DESC`).all(workspaceId, term, term);
}

function getProject(db, projectId, workspaceId) {
  const project = db.prepare("SELECT * FROM projects WHERE id=? AND workspace_id=? AND archived_at IS NULL").get(projectId, workspaceId);
  if (!project) return null;
  return {
    ...project,
    targets: db.prepare("SELECT * FROM targets WHERE project_id=? ORDER BY created_at DESC").all(projectId).map(sanitizeTarget),
    scans: db.prepare("SELECT * FROM scans WHERE project_id=? ORDER BY created_at DESC").all(projectId),
    findings: db.prepare(`SELECT f.* FROM findings f JOIN scans s ON s.id=f.scan_id WHERE s.project_id=? ORDER BY f.created_at DESC`).all(projectId),
  };
}

function ownedTarget(db, targetId, workspaceId) {
  return db.prepare(`SELECT t.* FROM targets t JOIN projects p ON p.id=t.project_id WHERE t.id=? AND p.workspace_id=? AND p.archived_at IS NULL`).get(targetId, workspaceId);
}

function sanitizeTarget(target) {
  if (!target) return null;
  const { credential_ciphertext, ...safe } = target;
  return { ...safe, config: json(target.config_json, {}), hasCredential: Boolean(credential_ciphertext) };
}

function addAudit(db, auth, action, entityType, entityId, metadata = {}) {
  db.prepare(`INSERT INTO audit_events (id, workspace_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id("audit"), auth.workspace.id, auth.id, action, entityType, entityId, JSON.stringify(metadata), now());
}

function buildReport(scan, retests) {
  const openFindings = scan.findings.filter((finding) => finding.status !== 'FIXED');
  const currentRisk = calculateRisk(openFindings);
  const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const ordered = [...scan.findings].sort((a, b) => Number(a.status === 'FIXED') - Number(b.status === 'FIXED') || (priority[a.severity] ?? 4) - (priority[b.severity] ?? 4));
  const severityCounts = scan.findings.reduce((counts, finding) => ({ ...counts, [finding.severity]: (counts[finding.severity] || 0) + 1 }), {});
  return {
    id: `report_${scan.id}`,
    generatedAt: scan.completed_at || now(),
    executiveSummary: openFindings.length
      ? `${scan.project_name} còn ${openFindings.length} phát hiện cần xử lý. Ưu tiên: ${ordered[0].title}.`
      : `${scan.project_name} không có phát hiện từ các security test đã chạy.`,
    risk: { ...currentRisk, initialScore: scan.risk_score, severityCounts },
    scope: { project: scan.project_name, target: scan.target_name, targetType: scan.target_type, testsRun: scan.total_tests },
    scan,
    findings: ordered,
    retests,
    methodology: "Payload xác định trước và rule đánh giá response từ GreenShield security test registry v1.",
  };
}
