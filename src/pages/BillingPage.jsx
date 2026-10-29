import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { EmailVerification } from '../components/payments/EmailVerification';

const labels = { CREATING: 'Đang tạo', PENDING: 'Chờ thanh toán', UNKNOWN: 'Cần kiểm tra lại', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn' };
const money = value => value == null ? 'Chưa có báo giá' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const openStates = ['CREATING', 'PENDING', 'UNKNOWN'];

export default function BillingPage() {
  const { user } = useAuth();
  const mayBuy = user?.emailVerified && ['OWNER', 'ADMIN'].includes(user?.workspace?.role);
  const [config, setConfig] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const selectedId = params.get('order');
  const [planId, setPlanId] = useState(params.get('plan') === 'team' ? 'team' : 'builder_pro');
  const product = config?.plans.find(plan => plan.id === planId);
  const key = useRef(null);
  const load = useCallback(async () => {
    const [settings, history] = await Promise.all([api('/api/payments/config'), api('/api/payments/orders')]);
    if (!Array.isArray(settings.plans)) throw new Error('Cấu hình gói đang được cập nhật. Vui lòng tải lại sau.');
    setConfig(settings);
    setOrders(history.orders);
    return history.orders;
  }, []);
  useEffect(() => { load().catch(err => setError(err.message)); }, [load]);
  // Redirect parameters are only navigation hints, never proof of payment.
  useEffect(() => {
    if (!selectedId || !config?.enabled || !mayBuy) return;
    let active = true, timer, attempts = 0;
    async function reconcile() {
      try {
        const { order } = await api(`/api/payments/orders/${encodeURIComponent(selectedId)}/refresh`, { method: 'POST', body: '{}' });
        if (!active) return;
        await load();
        if (openStates.includes(order.status) && ++attempts < 15) timer = setTimeout(reconcile, 4000);
      } catch (err) { if (active) setError(err.message); }
    }
    reconcile();
    return () => { active = false; clearTimeout(timer); };
  }, [selectedId, config?.enabled, mayBuy, load]);
  async function action(operation) {
    setBusy(true);
    setError('');
    try { await operation(); } catch (err) { setError(err.message); }
    finally { await load().catch(err => setError(err.message)); setBusy(false); }
  }
  function create() {
    key.current ||= crypto.randomUUID();
    return api('/api/payments/orders', {
      method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({ productId: planId }),
    }).then(({ order }) => {
      if (!openStates.includes(order.status)) key.current = null;
      if (order.status === 'PENDING' && order.checkout_url) window.location.assign(order.checkout_url);
    });
  }
  const hasOpen = orders.some(order => openStates.includes(order.status));
  const selected = orders.find(order => order.id === selectedId);
  useEffect(() => {
    if (['builder_pro', 'team'].includes(selected?.product_id)) setPlanId(selected.product_id);
  }, [selected?.product_id]);
  const usage = config?.usage;
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Gói sử dụng và thanh toán</h1>
      <p className="mt-2 text-sm text-slate-400">Đăng ký theo tháng cho workspace. Thanh toán qua payOS, không tự động trừ tiền.</p>
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
      {!config && !error && <p role="status" className="mt-4 text-slate-400">Đang tải thanh toán…</p>}
      {config && <>
        {!user?.emailVerified && <EmailVerification />}
        {user?.emailVerified && !mayBuy && <p role="status" className="mt-4 text-sm text-amber-200">Chỉ chủ workspace hoặc quản trị viên có thể mua gói.</p>}
        {usage && <div className="mt-6 grid grid-cols-2 gap-4 border-y border-white/10 py-4">
          <div><p className="text-sm text-slate-400">{usage.active ? `Gói ${usage.active.plan_key === 'team' ? 'Team' : 'Builder Pro'}` : 'Chưa có gói còn hiệu lực'}</p><p className="mt-1 text-2xl font-bold">{usage.testsRemaining} <span className="text-sm font-normal text-slate-400">bài kiểm thử còn lại</span></p></div>
          <div><p className="text-sm text-slate-400">{usage.active ? 'Ngày hết hạn' : 'Kỳ tiếp theo'}</p><p className="mt-2 font-semibold">{usage.active ? new Date(usage.active.ends_at).toLocaleDateString('vi-VN') : usage.next ? new Date(usage.next.starts_at).toLocaleDateString('vi-VN') : 'Chưa đăng ký'}</p></div>
        </div>}
        {usage?.next && <p className="mt-3 text-sm text-emerald-200">Kỳ {usage.next.plan_key === 'team' ? 'Team' : 'Builder Pro'} tiếp theo bắt đầu {new Date(usage.next.starts_at).toLocaleDateString('vi-VN')}. Hạn mức không cộng dồn giữa các kỳ.</p>}
        {selected?.status === 'PAID' && <p role="status" className="mt-4 flex items-start gap-2 text-sm text-emerald-200"><CheckCircle2 size={18} className="shrink-0" />{usage?.periods?.some(period => period.order_id === selectedId) ? 'Thanh toán thành công. Kỳ sử dụng đã được ghi nhận trong workspace.' : 'Đã ghi nhận thanh toán. Liên hệ GreenShield để xác nhận quyền lợi đơn hàng này.'}</p>}
        {!config.enabled && <p role="status" className="mt-4 border-l-2 border-amber-300 pl-3 text-sm text-amber-100">Thanh toán chưa được bật. Chưa thể tạo giao dịch.</p>}
        <fieldset disabled={busy || hasOpen} className="mt-6 grid gap-3 sm:grid-cols-2">
          <legend className="mb-3 font-semibold">Chọn gói theo tháng</legend>
          {config.plans.filter(plan => plan.amount != null).map(plan => <label key={plan.id} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${planId === plan.id ? 'border-emerald-300/50 bg-emerald-300/5' : 'border-white/10'}`}>
            <input type="radio" name="subscription-plan" value={plan.id} checked={planId === plan.id} onChange={() => { setPlanId(plan.id); key.current = null; }} className="mt-1 accent-emerald-300" />
            <span className="min-w-0"><span className="block font-semibold">{plan.name}</span><span className="mt-1 block text-lg font-bold text-emerald-200">{money(plan.amount)}<span className="text-sm font-normal text-slate-400"> / tháng</span></span><span className="mt-2 block text-sm text-slate-300">{plan.projects} ứng dụng · {plan.tests.toLocaleString('vi-VN')} bài kiểm thử / tháng</span></span>
          </label>)}
        </fieldset>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-5">
          <div className="min-w-0"><h2 className="font-bold">{usage?.active ? 'Gia hạn / Đăng ký kỳ tiếp theo' : 'Đăng ký'} {product?.name}</h2><p className="mt-1 text-xl font-semibold text-emerald-200">{money(product?.amount)} / tháng</p>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Scan và retest cùng tính vào hạn mức bài kiểm thử. Khi gia hạn hoặc đổi gói, kỳ mới bắt đầu sau kỳ đã thanh toán.</p>
            {!config.checkoutReady && <p className="mt-2 text-sm text-slate-400">Gói chưa mở bán trực tuyến.</p>}
          </div>
          <Button data-testid="purchase-package" disabled={!config.checkoutReady || !mayBuy || busy || hasOpen} onClick={() => action(create)}><CreditCard size={16} /> {busy ? 'Đang xử lý…' : 'Thanh toán qua payOS'}</Button>
        </div>
        <p className="mt-4 text-sm text-slate-400">Ứng dụng lớn hoặc phạm vi phức tạp? <a href="/contact" className="text-emerald-200 underline underline-offset-4">Liên hệ tư vấn</a></p>
        {hasOpen && <p role="status" className="mt-3 text-sm text-amber-200">Có đơn đang chờ xử lý. Tiếp tục thanh toán hoặc kiểm tra trạng thái trong lịch sử bên dưới.</p>}
        <div className="mt-8 flex items-center justify-between gap-3"><h2 className="font-semibold">Lịch sử thanh toán</h2><Button variant="ghost" disabled={busy} onClick={() => action(load)} aria-label="Tải lại lịch sử" title="Tải lại lịch sử"><RefreshCw size={16} /></Button></div>
        {!orders.length ? <p className="mt-4 text-sm text-slate-400">Chưa có đơn thanh toán.</p> : <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-white/10 text-slate-400"><tr>{['Đơn hàng', 'Số tiền', 'Trạng thái', 'Thao tác'].map(label => <th className="px-3 py-3 font-medium" key={label}>{label}</th>)}</tr></thead>
            <tbody>{orders.map(order => <tr key={order.id} className={`border-b border-white/10 ${selectedId === order.id ? 'bg-emerald-300/5' : ''}`}>
              <td className="px-3 py-3"><p>{order.product_name}</p><p className="mt-1 text-xs text-slate-400">#{order.order_code}</p></td>
              <td className="whitespace-nowrap px-3 py-3">{money(order.amount)}</td>
              <td className="px-3 py-3"><span className={order.status === 'PAID' ? 'text-emerald-200' : 'text-slate-300'}>{labels[order.status]}</span></td>
              <td className="px-3 py-3"><div className="flex flex-wrap items-center gap-2">
                {order.status === 'PENDING' && order.checkout_url && config.enabled && <a href={order.checkout_url} className="focus-ring inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-emerald-200" target="_blank" rel="noopener noreferrer">Mở PayOS <ExternalLink size={14} /></a>}
                {openStates.includes(order.status) && <>
                  <Button variant="ghost" disabled={busy || !mayBuy || !config.enabled} onClick={() => action(() => api(`/api/payments/orders/${order.id}/refresh`, { method: 'POST', body: '{}' }))} title="Kiểm tra trạng thái" aria-label={`Kiểm tra đơn ${order.order_code}`}><RefreshCw size={15} /></Button>
                  <Button variant="ghost" disabled={busy || !mayBuy || !config.enabled} onClick={() => { if (window.confirm('Hủy đơn thanh toán này trên PayOS?')) action(() => api(`/api/payments/orders/${order.id}/cancel`, { method: 'POST', body: '{}' })); }} title="Hủy đơn" aria-label={`Hủy đơn ${order.order_code}`}><X size={15} /></Button>
                </>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </>}
    </section>
  );
}
