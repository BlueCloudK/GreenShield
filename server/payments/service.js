import crypto from 'node:crypto';
import express from 'express';
import { createPayOS } from './payos.js';
import { transactionLock } from '../db/locks.js';
import { plans } from './plans.js';

const now = () => new Date().toISOString();
const fail = (status, message) => Object.assign(new Error(message), { status });
const pending = new Set(['CREATING', 'PENDING', 'UNKNOWN']);

export function paymentConfig(env = process.env) {
  const enabled = env.PAYOS_ENABLED === 'true';
  if (!enabled) return { enabled: false };
  if (env.NODE_ENV === 'production' && env.PAYOS_PRODUCTION_APPROVED !== 'true') {
    throw new Error('PayOS production activation is not authorized.');
  }
  if (!['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY', 'PAYOS_PUBLIC_ORIGIN'].every(key => env[key])) {
    throw new Error('Configure PayOS server keys, public origin and an approved VND amount before enabling payments.');
  }
  const origin = new URL(env.PAYOS_PUBLIC_ORIGIN);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
      (origin.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) {
    throw new Error('PAYOS_PUBLIC_ORIGIN must be an HTTPS origin (localhost HTTP is development-only).');
  }
  return { enabled: true, origin: origin.origin };
}

export function createPayments({ db, requireAuth, credits, env = process.env, client }) {
  const config = paymentConfig(env);
  const payos = config.enabled ? (client || createPayOS(env)) : null;
  const router = express.Router();
  const checkoutReady = config.enabled;
  const catalog = () => ({ enabled: config.enabled, checkoutReady, plans });
  const get = code => db.prepare('SELECT * FROM payment_orders WHERE order_code=?').get(code);
  const safeOrder = order => {
    const { idempotency_key, created_by, workspace_id, ...safe } = order;
    return safe;
  };
  const owned = async (request) => {
    const order = await db.prepare('SELECT * FROM payment_orders WHERE id=? AND workspace_id=?').get(request.params.id, request.auth.workspace.id);
    if (!order) throw fail(404, 'Không tìm thấy đơn thanh toán.');
    return order;
  };
  function enabled(_request, _response, next) {
    if (!config.enabled) return next(fail(503, 'Thanh toán PayOS chưa được bật.'));
    next();
  }
  async function buyer(request, _response, next) {
    if (!['OWNER', 'ADMIN'].includes(request.auth.workspace.role)) return next(fail(403, 'Chỉ chủ workspace hoặc quản trị viên được thanh toán.'));
    if (!(await db.prepare('SELECT email_verified_at FROM users WHERE id=?').get(request.auth.id))?.email_verified_at) {
      return next(fail(403, 'Vui lòng xác minh email trước khi thanh toán.'));
    }
    const origin = request.headers.origin;
    if (origin && origin !== config.origin) return next(fail(403, 'Nguồn yêu cầu thanh toán không hợp lệ.'));
    next();
  }
  function checkoutUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn' || url.username || url.password || url.port) {
      throw fail(502, 'PayOS trả về địa chỉ thanh toán không hợp lệ.');
    }
    return url.href;
  }
  function validateProvider(order, data) {
    if (!data || data.orderCode !== order.order_code || data.amount !== order.amount ||
        data.id !== order.payment_link_id || (data.currency && data.currency !== 'VND')) {
      throw fail(409, 'Thông tin thanh toán không khớp đơn hàng.');
    }
  }
  const settle = db.transaction(async (order, data) => {
    await transactionLock(db, `payment:${order.id}`);
    validateProvider(order, data);
    const latest = await get(order.order_code);
    if (latest.status === 'PAID') { await credits.grant(latest); return latest; }
    if (data.status === 'PAID') {
      if (!Number.isSafeInteger(data.amountPaid) || data.amountPaid < order.amount) throw fail(409, 'Số tiền nhận chưa đủ.');
      const paidAt = now();
      await db.prepare("UPDATE payment_orders SET status='PAID', paid_at=?, updated_at=? WHERE id=?").run(paidAt, paidAt, order.id);
      await db.prepare('INSERT INTO payment_receipts (order_id,provider_reference,amount,paid_at) VALUES (?,?,?,?)')
        .run(order.id, data.id, order.amount, paidAt);
      await credits.grant(latest);
    } else if (['PENDING', 'CANCELLED', 'EXPIRED'].includes(data.status) && pending.has(latest.status)) {
      await db.prepare('UPDATE payment_orders SET status=?,updated_at=? WHERE id=?').run(data.status, now(), order.id);
    }
    return get(order.order_code);
  });
  async function refresh(order) {
    let data;
    try { data = await payos.paymentRequests.get(order.order_code); }
    catch { throw fail(502, 'Chưa kiểm tra được PayOS. Vui lòng thử lại, không tạo đơn mới.'); }
    // A create timeout may leave a valid provider order without a local link ID.
    if (!order.payment_link_id && pending.has(order.status)) {
      if (data.orderCode !== order.order_code || data.amount !== order.amount || typeof data.id !== 'string' || !data.id) {
        throw fail(409, 'Thông tin thanh toán không khớp đơn hàng.');
      }
      await db.prepare('UPDATE payment_orders SET payment_link_id=?,updated_at=? WHERE id=? AND payment_link_id IS NULL').run(data.id, now(), order.id);
      order = await get(order.order_code);
    }
    return settle(order, data);
  }

  router.post('/webhook', enabled, async (request, response, next) => {
    let data;
    try { data = await payos.webhooks.verify(request.body); }
    catch { return next(fail(400, 'Chữ ký webhook không hợp lệ.')); }
    try {
      if (data.code !== '00') return response.json({ received: true });
      const order = await get(data.orderCode);
      // payOS sends a sample event when confirming a webhook URL.
      if (!order) return response.json({ received: true });
      if (data.amount !== order.amount || (order.payment_link_id && data.paymentLinkId !== order.payment_link_id)) {
        throw fail(409, 'Webhook không khớp đơn hàng.');
      }
      await refresh(order);
      response.json({ received: true });
    } catch (error) { next(error); }
  });

  router.get('/catalog', (_request, response) => response.json(catalog()));
  router.use(requireAuth);
  router.get('/config', async (request, response) => response.json({
    ...catalog(), usage: await credits.summary(request.auth.workspace.id),
  }));
  router.get('/orders', async (request, response) => response.json({
    orders: (await db.prepare('SELECT * FROM payment_orders WHERE workspace_id=? ORDER BY created_at DESC LIMIT 50').all(request.auth.workspace.id)).map(safeOrder),
  }));
  router.get('/orders/:id', async (request, response, next) => {
    try { response.json({ order: safeOrder(await owned(request)) }); } catch (error) { next(error); }
  });
  router.post('/orders', enabled, buyer, async (request, response, next) => {
    try {
      if (!checkoutReady) throw fail(503, 'Gói sử dụng chưa mở bán. Vui lòng liên hệ GreenShield.');
      const product = plans.find(plan => plan.id === request.body?.productId && plan.amount != null);
      if (!product || Object.keys(request.body).some(key => key !== 'productId')) throw fail(400, 'Chỉ gửi mã gói hợp lệ, không gửi giá từ trình duyệt.');
      const key = request.headers['idempotency-key'];
      if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(key)) throw fail(400, 'Thiếu mã chống tạo đơn trùng.');
      const reservation = await db.transaction(async () => {
        await transactionLock(db, `checkout:${request.auth.workspace.id}`);
        const existing = await db.prepare('SELECT * FROM payment_orders WHERE workspace_id=? AND idempotency_key=?').get(request.auth.workspace.id, key);
        if (existing) {
          if (existing.product_id !== product.id) throw fail(409, 'Mã yêu cầu đã được dùng cho gói khác.');
          return { order: existing, created: false };
        }
        const inFlight = await db.prepare("SELECT * FROM payment_orders WHERE workspace_id=? AND status IN ('CREATING','PENDING','UNKNOWN') LIMIT 1").get(request.auth.workspace.id);
        if (inFlight) {
          if (inFlight.product_id !== product.id) throw fail(409, 'Hãy xử lý đơn đang chờ trước khi chọn gói khác.');
          return { order: inFlight, created: false };
        }
        const id = crypto.randomUUID();
        const code = Date.now() * 1000 + crypto.randomInt(1000);
        const stamp = now();
        await db.prepare(`INSERT INTO payment_orders (id,workspace_id,created_by,idempotency_key,order_code,product_id,product_name,amount,status,created_at,updated_at,
          plan_key,test_allowance,project_allowance,member_allowance,processing_priority)
          VALUES (?,?,?,?,?,?,?,?,'CREATING',?,?,?,?,?,?,?)`)
          .run(id, request.auth.workspace.id, request.auth.id, key, code, product.id, product.name, product.amount, stamp, stamp,
            product.id, product.tests, product.projects, product.members, product.priority);
        return { order: await get(code), created: true };
      })();
      if (!reservation.created) return response.json({ order: safeOrder(reservation.order) });
      const { id, order_code: code } = reservation.order;
      try {
        const data = await payos.paymentRequests.create({
          orderCode: code, amount: product.amount, description: `GS ${code}`,
          items: [{ name: product.name, quantity: 1, price: product.amount }],
          returnUrl: `${config.origin}/app/billing?order=${id}`,
          cancelUrl: `${config.origin}/app/billing?order=${id}`,
          expiredAt: Math.floor(Date.now() / 1000) + 1800,
        });
        if (data.orderCode !== code || data.amount !== product.amount || data.currency !== 'VND' || !data.paymentLinkId) throw new Error('Mismatched provider response');
        const url = checkoutUrl(data.checkoutUrl);
        await db.prepare("UPDATE payment_orders SET payment_link_id=?,checkout_url=?,status=CASE WHEN status='CREATING' THEN 'PENDING' ELSE status END,updated_at=? WHERE id=?")
          .run(data.paymentLinkId, url, now(), id);
      } catch {
        await db.prepare("UPDATE payment_orders SET status='UNKNOWN',updated_at=? WHERE id=? AND status='CREATING'").run(now(), id);
        throw fail(502, 'Chưa xác nhận được link thanh toán. Đơn đã được lưu; hãy kiểm tra lại trạng thái, không tạo đơn mới.');
      }
      response.status(201).json({ order: safeOrder(await get(code)) });
    } catch (error) { next(error); }
  });
  router.post('/orders/:id/refresh', enabled, buyer, async (request, response, next) => {
    try { response.json({ order: safeOrder(await refresh(await owned(request))) }); } catch (error) { next(error); }
  });
  router.post('/orders/:id/cancel', enabled, buyer, async (request, response, next) => {
    try {
      const order = await owned(request);
      if (order.status !== 'PAID') {
        try { await payos.paymentRequests.cancel(order.order_code, 'Cancelled by workspace owner'); }
        catch { throw fail(502, 'Chưa hủy được đơn trên PayOS. Hãy kiểm tra lại trạng thái.'); }
      }
      response.json({ order: safeOrder(await refresh(order)) });
    } catch (error) { next(error); }
  });
  return router;
}
