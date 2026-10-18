import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

const labels = { CREATING: 'Đang tạo', PENDING: 'Chờ thanh toán', UNKNOWN: 'Cần kiểm tra lại', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn' };
const money = value => value == null ? 'Chưa có báo giá' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const openStates = ['CREATING', 'PENDING', 'UNKNOWN'];

export default function BillingPage() {
  const [config, setConfig] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const selectedId = params.get('order');
  const key = useRef(null);
  const load = useCallback(async () => {
    const [settings, history] = await Promise.all([api('/api/payments/config'), api('/api/payments/orders')]);
    setConfig(settings);
    setOrders(history.orders);
  }, []);
  useEffect(() => { load().catch(err => setError(err.message)); }, [load]);
  // Redirect parameters are only navigation hints, never proof of payment.
  useEffect(() => {
    if (!selectedId || !config?.enabled) return;
    api(`/api/payments/orders/${encodeURIComponent(selectedId)}/refresh`, { method: 'POST', body: '{}' })
      .then(load).catch(err => setError(err.message));
  }, [selectedId, config?.enabled, load]);
  async function action(operation) {
    setBusy(true);
    setError('');
    try { await operation(); } catch (err) { setError(err.message); }
    finally { await load().catch(err => setError(err.message)); setBusy(false); }
  }
  function create() {
    key.current ||= crypto.randomUUID();
    return api('/api/payments/orders', {
      method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({ productId: 'assessment' }),
    }).then(({ order }) => {
      if (!openStates.includes(order.status)) key.current = null;
    });
  }
  const hasOpen = orders.some(order => openStates.includes(order.status));
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Thanh toán</h1>
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
      {!config && !error && <p role="status" className="mt-4 text-slate-400">Đang tải thanh toán…</p>}
      {config && <>
        {!config.enabled && <p role="status" className="mt-4 border-l-2 border-amber-300 pl-3 text-sm text-amber-100">Thanh toán chưa được bật. Chưa thể tạo giao dịch.</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-5">
          <div><h2 className="font-bold">{config.product.name}</h2><p className="mt-1 text-lg font-semibold text-emerald-200">{money(config.product.amount)}</p></div>
          <Button disabled={!config.enabled || busy || hasOpen} onClick={() => action(create)}><CreditCard size={16} /> Tạo đơn thanh toán</Button>
        </div>
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
                  <Button variant="ghost" disabled={busy || !config.enabled} onClick={() => action(() => api(`/api/payments/orders/${order.id}/refresh`, { method: 'POST', body: '{}' }))} title="Kiểm tra trạng thái" aria-label={`Kiểm tra đơn ${order.order_code}`}><RefreshCw size={15} /></Button>
                  <Button variant="ghost" disabled={busy || !config.enabled} onClick={() => { if (window.confirm('Hủy đơn thanh toán này trên PayOS?')) action(() => api(`/api/payments/orders/${order.id}/cancel`, { method: 'POST', body: '{}' })); }} title="Hủy đơn" aria-label={`Hủy đơn ${order.order_code}`}><X size={15} /></Button>
                </>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </>}
    </section>
  );
}
