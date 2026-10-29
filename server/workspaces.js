import { Router } from 'express';
import { transactionLock } from './db/locks.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

export function workspaceRoutes({ db, requireAuth, credits, getUserContext }) {
  const router = Router();
  router.use(requireAuth);
  async function manager(request, ownerOnly = false) {
    const member = await db.prepare('SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?').get(request.auth.workspace.id, request.auth.id);
    if (!member || !(ownerOnly ? ['OWNER'] : ['OWNER', 'ADMIN']).includes(member.role)) throw fail(403, 'Bạn không có quyền quản lý thành viên.');
    return member.role;
  }
  router.get('/', async (request, response) => response.json({ workspaces: await db.prepare(`SELECT w.id,w.name,m.role FROM workspaces w
    JOIN workspace_members m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.name`).all(request.auth.id) }));
  router.post('/switch', async (request, response) => {
    const member = await db.prepare('SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?').get(String(request.body?.workspaceId || ''), request.auth.id);
    if (!member) throw fail(404, 'Không tìm thấy workspace.');
    await db.prepare('UPDATE users SET active_workspace_id=? WHERE id=?').run(request.body.workspaceId, request.auth.id);
    response.json({ user: await getUserContext(db, request.auth.id) });
  });
  router.get('/members', async (request, response) => response.json({ members: await db.prepare(`SELECT u.id,u.name,u.email,m.role
    FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=? ORDER BY m.created_at,u.id`).all(request.auth.workspace.id) }));
  router.post('/members', async (request, response) => {
    await db.transaction(async () => {
      const workspace = request.auth.workspace.id;
      await transactionLock(db, `members:${workspace}`);
      const role = await manager(request);
      const active = (await credits.summary(workspace)).active;
      if (active?.plan_key !== 'team') throw fail(402, 'Gói Team còn hiệu lực mới có thể thêm thành viên.');
      const selectedRole = request.body?.role || 'MEMBER';
      if (!['ADMIN', 'MEMBER'].includes(selectedRole) || (selectedRole === 'ADMIN' && role !== 'OWNER')) throw fail(403, 'Chỉ chủ workspace được cấp quyền quản trị.');
      const user = await db.prepare('SELECT id FROM users WHERE email=? AND email_verified_at IS NOT NULL').get(String(request.body?.email || '').trim().toLowerCase());
      if (!user) throw fail(400, 'Thành viên cần đăng ký và xác minh email GreenShield trước.');
      if (await db.prepare('SELECT user_id FROM workspace_members WHERE workspace_id=? AND user_id=?').get(workspace, user.id)) throw fail(409, 'Tài khoản đã là thành viên workspace.');
      await db.prepare('INSERT INTO workspace_members (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)').run(workspace, user.id, selectedRole, new Date().toISOString());
    })();
    response.status(201).json({ added: true });
  });
  router.patch('/members/:id', async (request, response) => {
    await db.transaction(async () => {
      await transactionLock(db, `members:${request.auth.workspace.id}`);
      await manager(request, true);
      const member = await db.prepare('SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?').get(request.auth.workspace.id, request.params.id);
      if (!member) throw fail(404, 'Không tìm thấy thành viên.');
      if (member.role === 'OWNER' || !['ADMIN', 'MEMBER'].includes(request.body?.role)) throw fail(400, 'Không thể thay đổi vai trò này.');
      await db.prepare('UPDATE workspace_members SET role=? WHERE workspace_id=? AND user_id=?').run(request.body.role, request.auth.workspace.id, request.params.id);
    })();
    response.json({ updated: true });
  });
  router.delete('/members/:id', async (request, response) => {
    await db.transaction(async () => {
      await transactionLock(db, `members:${request.auth.workspace.id}`);
      const role = await manager(request);
      const member = await db.prepare('SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?').get(request.auth.workspace.id, request.params.id);
      if (!member) throw fail(404, 'Không tìm thấy thành viên.');
      if (member.role === 'OWNER' || (role === 'ADMIN' && member.role === 'ADMIN')) throw fail(403, 'Không thể gỡ thành viên có vai trò này.');
      await db.prepare('DELETE FROM workspace_members WHERE workspace_id=? AND user_id=?').run(request.auth.workspace.id, request.params.id);
    })();
    response.status(204).end();
  });
  return router;
}
