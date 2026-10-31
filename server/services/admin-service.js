import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import express from "express";
import { authenticate, isAdminEmail, requireAdminAuth } from "../auth.js";

export function createAdminRouter({ db }) {
  const router = express.Router();
  const requireAuth = authenticate(db);
  const requireAdmin = requireAdminAuth(db);

  // Allow workspace owner or admin to force-cancel their own stuck order
  router.post("/orders/:orderId/force-cancel", requireAuth, async (request, response, next) => {
    try {
      const order = await db
        .prepare("SELECT * FROM payment_orders WHERE id=?")
        .get(request.params.orderId);
      const isAdmin = isAdminEmail(request.auth?.email);
      if (!order || (!isAdmin && order.workspace_id !== request.auth?.workspace?.id)) {
        return response.status(404).json({ message: "Không tìm thấy đơn thanh toán." });
      }
      if (order.status !== "PAID") {
        await db
          .prepare("UPDATE payment_orders SET status='CANCELLED', updated_at=? WHERE id=?")
          .run(new Date().toISOString(), order.id);
      }
      const updated = await db
        .prepare("SELECT * FROM payment_orders WHERE id=?")
        .get(request.params.orderId);
      response.json({ order: updated });
    } catch (error) {
      next(error);
    }
  });

  router.use(requireAdmin);

  router.get("/overview", async (_request, response, next) => {
    try {
      const stats = await db
        .prepare(
          `SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL) AS verified_users,
            (SELECT COUNT(*) FROM workspaces) AS total_workspaces,
            (SELECT COUNT(*) FROM projects WHERE archived_at IS NULL) AS total_projects,
            (SELECT COUNT(*) FROM scans) AS total_scans,
            (SELECT COUNT(*) FROM endpoint_evaluations) AS total_evaluations,
            (SELECT COUNT(*) FROM contact_requests) AS total_contacts,
            (SELECT COUNT(*) FROM payment_orders) AS total_payments,
            (SELECT COUNT(*) FROM payment_orders WHERE status='PAID') AS paid_orders_count`
        )
        .get();

      const users = await db
        .prepare(
          `SELECT
            u.id,
            u.name,
            u.email,
            u.company,
            u.email_verified_at,
            u.created_at,
            w.id AS workspace_id,
            w.name AS workspace_name,
            wm.role,
            (SELECT COUNT(*) FROM projects p WHERE p.workspace_id=w.id AND p.archived_at IS NULL) AS project_count,
            (SELECT COUNT(*) FROM scans s JOIN projects p ON p.id=s.project_id WHERE p.workspace_id=w.id) AS scan_count,
            (SELECT COUNT(*) FROM payment_orders po WHERE po.workspace_id=w.id AND po.status IN ('CREATING','PENDING','UNKNOWN')) AS pending_orders_count,
            (SELECT COUNT(*) FROM payment_orders po WHERE po.workspace_id=w.id AND po.status='PAID') AS paid_orders_count
          FROM users u
          LEFT JOIN workspace_members wm ON wm.user_id=u.id
          LEFT JOIN workspaces w ON w.id=wm.workspace_id
          ORDER BY u.created_at DESC
          LIMIT 100`
        )
        .all();

      const contacts = await db
        .prepare(
          `SELECT id, full_name, email, subject, message, created_at
           FROM contact_requests
           ORDER BY created_at DESC
           LIMIT 100`
        )
        .all();

      const payments = await db
        .prepare(
          `SELECT
            po.id,
            po.order_code,
            po.product_id,
            po.product_name,
            po.amount,
            po.currency,
            po.status,
            po.created_at,
            po.paid_at,
            u.email AS user_email,
            u.name AS user_name,
            w.name AS workspace_name
          FROM payment_orders po
          LEFT JOIN users u ON u.id=po.created_by
          LEFT JOIN workspaces w ON w.id=po.workspace_id
          ORDER BY po.created_at DESC
          LIMIT 100`
        )
        .all();

      const recentScans = await db
        .prepare(
          `SELECT
            s.id,
            s.name,
            s.status,
            s.risk_score,
            s.risk_level,
            s.total_tests,
            s.completed_tests,
            s.created_at,
            p.name AS project_name,
            t.name AS target_name,
            w.name AS workspace_name
          FROM scans s
          JOIN projects p ON p.id=s.project_id
          JOIN targets t ON t.id=s.target_id
          JOIN workspaces w ON w.id=p.workspace_id
          ORDER BY s.created_at DESC
          LIMIT 30`
        )
        .all();

      response.json({
        stats,
        users: users.map((u) => ({ ...u, isAdmin: isAdminEmail(u.email) })),
        contacts,
        payments,
        recentScans,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users", async (request, response, next) => {
    try {
      const name = String(request.body?.name || "").trim();
      const email = String(request.body?.email || "").trim().toLowerCase();
      const company = String(request.body?.company || "").trim();
      const password = String(request.body?.password || "");

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
        return response.status(400).json({ message: "Tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự là bắt buộc." });
      }

      const existing = await db.prepare("SELECT id FROM users WHERE email=?").get(email);
      if (existing) {
        return response.status(409).json({ message: "Email này đã tồn tại trong hệ thống." });
      }

      const stamp = new Date().toISOString();
      const userId = crypto.randomUUID();
      const workspaceId = crypto.randomUUID();
      const passwordHash = bcrypt.hashSync(password, 12);

      await db
        .prepare(
          `INSERT INTO users (id, name, email, company, password_hash, created_at, updated_at, email_verified_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(userId, name, email, company, passwordHash, stamp, stamp, stamp);
      await db
        .prepare(`INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`)
        .run(workspaceId, company || `${name}'s workspace`, stamp, stamp);
      await db
        .prepare(`INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'OWNER', ?)`)
        .run(workspaceId, userId, stamp);

      response.status(201).json({ created: true, userId });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/users/:userId/verify", async (request, response, next) => {
    try {
      const stamp = new Date().toISOString();
      await db
        .prepare("UPDATE users SET email_verified_at=?, updated_at=? WHERE id=?")
        .run(stamp, stamp, request.params.userId);
      response.json({ verified: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/grant-plan", async (request, response, next) => {
    try {
      const member = await db
        .prepare("SELECT workspace_id FROM workspace_members WHERE user_id=? LIMIT 1")
        .get(request.params.userId);
      if (!member) return response.status(404).json({ message: "Không tìm thấy workspace của người dùng." });

      const stamp = new Date().toISOString();
      await db
        .prepare(
          "UPDATE payment_orders SET status='CANCELLED', updated_at=? WHERE workspace_id=? AND status IN ('CREATING','PENDING','UNKNOWN')"
        )
        .run(stamp, member.workspace_id);

      const orderId = crypto.randomUUID();
      const orderCode = Date.now() * 1000 + crypto.randomInt(1000);
      await db
        .prepare(
          `INSERT INTO payment_orders (id, workspace_id, created_by, idempotency_key, order_code, product_id, product_name, amount, currency, status, created_at, updated_at, paid_at)
           VALUES (?, ?, ?, ?, ?, 'assessment', 'AI App Assessment', 2490000, 'VND', 'PAID', ?, ?, ?)`
        )
        .run(orderId, member.workspace_id, request.params.userId, `admin-grant-${orderId}`, orderCode, stamp, stamp, stamp);
      await db
        .prepare(
          `INSERT INTO payment_receipts (order_id, provider_reference, amount, paid_at)
           VALUES (?, ?, 2490000, ?)`
        )
        .run(orderId, `admin-grant-${orderCode}`, stamp);

      response.json({ granted: true, orderId });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/clear-orders", async (request, response, next) => {
    try {
      const member = await db
        .prepare("SELECT workspace_id FROM workspace_members WHERE user_id=? LIMIT 1")
        .get(request.params.userId);
      if (!member) return response.status(404).json({ message: "Không tìm thấy workspace." });
      await db
        .prepare(
          "DELETE FROM payment_orders WHERE workspace_id=? AND status IN ('CREATING','PENDING','UNKNOWN','CANCELLED','EXPIRED')"
        )
        .run(member.workspace_id);
      response.json({ cleared: true });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/payments/:orderId", async (request, response, next) => {
    try {
      const nextStatus = String(request.body?.status || "").toUpperCase();
      if (!["PAID", "CANCELLED", "PENDING"].includes(nextStatus)) {
        return response.status(400).json({ message: "Trạng thái không hợp lệ." });
      }
      const stamp = new Date().toISOString();
      if (nextStatus === "PAID") {
        await db
          .prepare("UPDATE payment_orders SET status='PAID', paid_at=?, updated_at=? WHERE id=?")
          .run(stamp, stamp, request.params.orderId);
      } else {
        await db
          .prepare("UPDATE payment_orders SET status=?, updated_at=? WHERE id=?")
          .run(nextStatus, stamp, request.params.orderId);
      }
      response.json({ updated: true, status: nextStatus });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/payments/:orderId", async (request, response, next) => {
    try {
      await db.prepare("DELETE FROM payment_orders WHERE id=?").run(request.params.orderId);
      response.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/users/:userId", async (request, response, next) => {
    try {
      const targetUser = await db.prepare("SELECT email FROM users WHERE id=?").get(request.params.userId);
      if (!targetUser) return response.status(404).json({ message: "Không tìm thấy người dùng." });
      if (isAdminEmail(targetUser.email)) {
        return response.status(400).json({ message: "Không thể xóa tài khoản Admin hệ thống." });
      }
      const memberships = await db
        .prepare("SELECT workspace_id FROM workspace_members WHERE user_id=?")
        .all(request.params.userId);
      await db.prepare("DELETE FROM users WHERE id=?").run(request.params.userId);
      for (const m of memberships) {
        await db.prepare("DELETE FROM workspaces WHERE id=?").run(m.workspace_id);
      }
      response.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/contacts/:contactId", async (request, response, next) => {
    try {
      await db.prepare("DELETE FROM contact_requests WHERE id=?").run(request.params.contactId);
      response.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
