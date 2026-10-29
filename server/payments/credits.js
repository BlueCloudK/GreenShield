import { transactionLock } from '../db/locks.js';
import { nextMonth } from './plans.js';

const denied = message => Object.assign(new Error(message), { status: 402, code: 'PLAN_REQUIRED' });

export function createCredits(db, { required = false, clock = () => new Date().toISOString() } = {}) {
  async function summary(workspaceId) {
    const stamp = clock();
    const periods = await db.prepare(`SELECT p.*,
      (SELECT COALESCE(SUM(u.quantity),0) FROM package_usage u WHERE u.order_id=p.order_id AND u.refunded_at IS NULL) AS tests_used
      FROM subscription_periods p WHERE p.workspace_id=? ORDER BY p.starts_at,p.order_id`).all(workspaceId);
    const active = periods.find(p => p.starts_at <= stamp && p.ends_at > stamp) || null;
    return { required, active, periods, next: periods.find(p => p.starts_at > stamp) || null,
      testsRemaining: active ? Math.max(0, active.test_allowance - Number(active.tests_used)) : 0 };
  }
  async function grant(order) {
    if (!order.plan_key || order.test_allowance == null) return;
    await transactionLock(db, `credits:${order.workspace_id}`);
    if (await db.prepare('SELECT order_id FROM subscription_periods WHERE order_id=?').get(order.id)) return;
    const stamp = clock();
    const last = await db.prepare('SELECT ends_at FROM subscription_periods WHERE workspace_id=? ORDER BY ends_at DESC LIMIT 1').get(order.workspace_id);
    const start = last?.ends_at > stamp ? last.ends_at : stamp;
    await db.prepare(`INSERT INTO subscription_periods
      (order_id,workspace_id,plan_key,test_allowance,project_allowance,member_allowance,processing_priority,starts_at,ends_at,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(order.id, order.workspace_id, order.plan_key, order.test_allowance,
      order.project_allowance, order.member_allowance, order.processing_priority, start, nextMonth(start), stamp);
  }
  // Reserve tests with the operation; duplicate webhooks never refill an active period.
  async function consume(workspaceId, kind, resourceId, quantity = 1) {
    if (!required) return;
    if (!['scan', 'retest'].includes(kind) || !Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Invalid test reservation');
    await transactionLock(db, `credits:${workspaceId}`);
    if (await db.prepare('SELECT resource_id FROM package_usage WHERE resource_id=?').get(resourceId)) return;
    const state = await summary(workspaceId);
    if (!state.active) throw denied('Chưa có gói còn hiệu lực. Chọn gói sử dụng để bắt đầu kiểm thử.');
    const projects = await db.prepare("SELECT COUNT(*) AS count FROM projects WHERE workspace_id=? AND archived_at IS NULL AND target_type<>'DEMO'").get(workspaceId);
    if (projects.count > state.active.project_allowance) throw denied('Số ứng dụng đang hoạt động vượt gói hiện tại. Lưu trữ ứng dụng không còn dùng hoặc chọn gói phù hợp.');
    if (state.testsRemaining < quantity) throw denied(`Còn ${state.testsRemaining} bài kiểm thử trong kỳ này; phiên cần ${quantity} bài.`);
    await db.prepare('INSERT INTO package_usage (resource_id,order_id,kind,quantity,created_at) VALUES (?,?,?,?,?)')
      .run(resourceId, state.active.order_id, kind, quantity, clock());
  }
  async function refund(resourceId) {
    await db.prepare('UPDATE package_usage SET refunded_at=? WHERE resource_id=? AND refunded_at IS NULL').run(clock(), resourceId);
  }
  async function finalize(resourceId, used) {
    if (!Number.isSafeInteger(used) || used < 0) throw new Error('Invalid completed test count');
    if (!used) return refund(resourceId);
    await db.prepare('UPDATE package_usage SET quantity=? WHERE resource_id=? AND quantity>=? AND refunded_at IS NULL').run(used, resourceId, used);
  }
  async function checkProject(workspaceId) {
    if (!required) return;
    await transactionLock(db, `credits:${workspaceId}`);
    const state = await summary(workspaceId);
    if (!state.active) throw denied('Chọn gói sử dụng trước khi tạo ứng dụng.');
    const count = await db.prepare("SELECT COUNT(*) AS count FROM projects WHERE workspace_id=? AND archived_at IS NULL AND target_type<>'DEMO'").get(workspaceId);
    if (count.count >= state.active.project_allowance) throw denied(`Gói hiện tại cho phép ${state.active.project_allowance} ứng dụng đang hoạt động.`);
  }
  return { required, summary, grant, consume, refund, finalize, checkProject };
}
