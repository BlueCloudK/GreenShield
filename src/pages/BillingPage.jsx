import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";

const labels = { CREATING: "Đang tạo", PENDING: "Chờ thanh toán", UNKNOWN: "Cần kiểm tra", PAID: "Đã thanh toán", CANCELLED: "Đã hủy", EXPIRED: "Hết hạn" };
const openStates = ["CREATING", "PENDING", "UNKNOWN"];
const money = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [params] = useSearchParams();
  const selectedId = params.get("order");

  const load = useCallback(async () => {
    const result = await api("/api/payments/orders");
    setOrders(result.orders || []);
  }, []);

  useEffect(() => {
    async function initialize() {
      if (selectedId) {
        try {
          await api(`/api/payments/orders/${encodeURIComponent(selectedId)}/refresh`, { method: "POST", body: "{}" });
        } catch (err) {
          setError(err.message);
        }
      }
      await load();
    }
    initialize().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [load, selectedId]);

  async function updateOrder(order, action) {
    setBusyId(order.id);
    setError("");
    try {
      await api(`/api/payments/orders/${encodeURIComponent(order.id)}/${action}`, { method: "POST", body: "{}" });
      await load();
      setConfirmId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Tài khoản</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Thanh toán</h1>
          <p className="mt-2 text-sm text-slate-400">Xem lịch sử và kiểm tra trạng thái các đơn thanh toán của workspace.</p>
        </div>
        <Button to="/app/plans" variant="secondary">Xem các gói dịch vụ</Button>
      </div>
      <div className="mt-6 border-l-2 border-emerald-300 bg-emerald-300/5 px-4 py-3 text-sm text-slate-200" role="status">
        Các gói Builder, Team và Scale đang được hoàn thiện, chưa hỗ trợ thanh toán trực tuyến. <Link className="font-semibold text-emerald-300 underline" to="/contact">Liên hệ tư vấn</Link> để đăng ký.
      </div>
      {error ? <p className="mt-4 text-sm text-rose-300" role="alert">{error}</p> : null}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Lịch sử thanh toán</h2>
        <Button aria-label="Làm mới lịch sử" title="Làm mới lịch sử" variant="ghost" onClick={() => load().catch((err) => setError(err.message))}><RefreshCw size={16} /></Button>
      </div>
      {loading ? <p className="mt-4 text-sm text-slate-400">Đang tải lịch sử thanh toán...</p> : null}
      {!loading && !orders.length && !error ? <p className="mt-4 text-sm text-slate-400">Chưa có giao dịch nào.</p> : null}
      {orders.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Đơn hàng</th><th className="p-4">Sản phẩm</th><th className="p-4">Số tiền</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr></thead>
          <tbody>{orders.map((order) => <tr className="border-t border-white/10" key={order.id}>
            <td className="p-4 text-white">#{order.order_code}<div className="mt-1 text-xs text-slate-400">{order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : ""}</div></td>
            <td className="p-4 text-slate-300">{order.product_name}</td><td className="p-4 text-slate-300">{money(order.amount)}</td><td className="p-4 text-slate-300">{labels[order.status] || order.status}</td>
            <td className="p-4"><div className="flex flex-wrap gap-2">
              {openStates.includes(order.status) ? <>
                {order.status === "PENDING" && order.checkout_url ? <a className="inline-flex items-center gap-1 text-emerald-300 underline" href={order.checkout_url} target="_blank" rel="noopener noreferrer">Mở đơn cũ <ExternalLink size={13} /></a> : null}
                <button className="text-emerald-300 underline disabled:opacity-50" disabled={busyId === order.id} onClick={() => updateOrder(order, "refresh")} type="button">Kiểm tra</button>
                {confirmId === order.id ? <><button className="text-rose-300 underline" disabled={busyId === order.id} onClick={() => updateOrder(order, "cancel")} type="button">Xác nhận hủy</button><button className="text-slate-400 underline" onClick={() => setConfirmId(null)} type="button">Không</button></> : <button className="text-slate-400 underline" onClick={() => setConfirmId(order.id)} type="button">Hủy đơn</button>}
              </> : order.status === "PAID" ? <button className="text-emerald-300 underline" onClick={() => setReceipt(order)} type="button">Xem xác nhận</button> : <span className="text-slate-500">—</span>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div> : null}
      {receipt ? <section className="mt-6 rounded-lg border border-white/10 p-5" aria-label="Xác nhận thanh toán">
        <h2 className="text-lg font-bold text-white">Xác nhận thanh toán #{receipt.order_code}</h2>
        <p className="mt-2 text-sm text-slate-300">{receipt.product_name} · {money(receipt.amount)} · Đã thanh toán</p>
        <p className="mt-1 text-sm text-slate-400">Thời gian: {receipt.paid_at || receipt.updated_at ? new Date(receipt.paid_at || receipt.updated_at).toLocaleString("vi-VN") : "Không có"}</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => window.print()} variant="secondary">In / Lưu PDF</Button><Button onClick={() => setReceipt(null)} variant="ghost">Đóng</Button></div>
      </section> : null}
    </section>
  );
}
