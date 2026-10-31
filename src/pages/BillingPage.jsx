import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { EmailVerification } from "../components/payments/EmailVerification";

const labels = {
  CREATING: "Đang khởi tạo",
  PENDING: "Chờ thanh toán",
  UNKNOWN: "Cần kiểm tra lại",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const statusBadgeClasses = {
  PAID: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
  PENDING: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  CREATING: "border-sky-300/30 bg-sky-300/15 text-sky-100",
  UNKNOWN: "border-orange-300/30 bg-orange-300/15 text-orange-100",
  CANCELLED: "border-white/10 bg-white/[0.04] text-slate-400",
  EXPIRED: "border-rose-300/25 bg-rose-400/10 text-rose-200",
};

const money = (value) =>
  value == null
    ? "Chưa có báo giá"
    : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const openStates = ["CREATING", "PENDING", "UNKNOWN"];

const planFeatures = [
  "Kết nối Target AI thật (LLM Chatbot, RAG Pipeline, AI Agent & API)",
  "Chạy toàn bộ bộ kiểm thử bảo mật có bằng chứng tấn công (Evidence)",
  "Báo cáo kỹ thuật 4 chỉ số cốt lõi & hướng dẫn vá lỗi chi tiết",
  "Quy trình Kiểm thử lại (Retest) không giới hạn trong phạm vi đánh giá",
  "Hỗ trợ xuất báo cáo PDF & đối chiếu lịch sử giảm điểm rủi ro",
];

const checkoutSteps = [
  {
    step: "01",
    title: "Tạo đơn hàng định danh",
    body: "Hệ thống khóa đơn hàng theo Workspace chống trùng lặp (Idempotency) và lấy giá chuẩn từ máy chủ.",
  },
  {
    step: "02",
    title: "Quét mã VietQR qua PayOS",
    body: "Mở trang thanh toán PayOS chính thức (pay.payos.vn) và quét mã QR bằng ứng dụng ngân hàng 24/7.",
  },
  {
    step: "03",
    title: "Xác thực Webhook & Cấp biên lai",
    body: "Chữ ký HMAC từ PayOS được xác minh tự động, cập nhật trạng thái Đã thanh toán và xuất biên lai điện tử.",
  },
];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso).slice(0, 16).replace("T", " ");
  }
}

export default function BillingPage() {
  const { user } = useAuth();
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(user?.workspace?.role);
  const mayBuy = Boolean(user?.emailVerified && isOwnerOrAdmin);

  const [config, setConfig] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [params] = useSearchParams();
  const selectedId = params.get("order");
  const key = useRef(null);

  const load = useCallback(async () => {
    const [settings, history] = await Promise.all([
      api("/api/payments/config"),
      api("/api/payments/orders"),
    ]);
    setConfig(settings);
    setOrders(history.orders || []);
    return { settings, orders: history.orders || [] };
  }, []);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  // Redirect parameters are only navigation hints, never proof of payment.
  useEffect(() => {
    if (!selectedId || !config?.enabled) return;
    api(`/api/payments/orders/${encodeURIComponent(selectedId)}/refresh`, {
      method: "POST",
      body: "{}",
    })
      .then(async (res) => {
        await load();
        if (res?.order?.status === "PAID") {
          setNotice(`Đơn hàng #${res.order.order_code} đã được xác nhận thanh toán thành công!`);
          setReceiptOrder(res.order);
        } else if (res?.order?.status === "CANCELLED") {
          setNotice(`Đơn hàng #${res.order.order_code} đã được hủy.`);
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedId, config?.enabled, load]);

  async function action(operation) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (err) {
      setError(err.message);
    } finally {
      await load().catch((err) => setError(err.message));
      setBusy(false);
    }
  }

  async function cancelOrder(orderId) {
    try {
      await api(`/api/payments/orders/${orderId}/cancel`, {
        method: "POST",
        body: "{}",
      });
    } catch {
      // Fallback if PayOS link already expired upstream (>30m) so user is never stuck
      await api(`/api/admin/orders/${orderId}/force-cancel`, {
        method: "POST",
        body: "{}",
      });
    }
    setNotice("Đã hủy đơn thanh toán đang chờ. Bạn có thể tạo đơn mới bất cứ lúc nào.");
  }

  async function createOrder() {
    key.current ||= crypto.randomUUID();
    const { order } = await api("/api/payments/orders", {
      method: "POST",
      headers: { "Idempotency-Key": key.current },
      body: JSON.stringify({ productId: "assessment" }),
    });
    if (!openStates.includes(order.status)) {
      key.current = null;
    }
    setNotice(
      `Đã khởi tạo đơn hàng #${order.order_code}. Bạn có thể bấm "Thanh toán qua PayOS" bên dưới để quét mã VietQR.`
    );
  }

  const activeOrder = useMemo(
    () => orders.find((order) => openStates.includes(order.status)) || null,
    [orders]
  );
  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "PAID"),
    [orders]
  );
  const totalPaidAmount = useMemo(
    () => paidOrders.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [paidOrders]
  );
  const hasOpen = Boolean(activeOrder);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>BILLING & SUBSCRIPTION</span>
          </div>
          <h1 className="mt-2 text-3xl font-black text-white">
            Thanh toán & Quản lý Gói dịch vụ
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý gói kiểm thử bảo mật AI của Workspace{" "}
            <span className="font-bold text-slate-200">{user?.workspace?.name}</span>, thanh toán an toàn qua cổng PayOS (VietQR 24/7) và tra cứu biên lai.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            aria-label="Tải lại lịch sử"
            disabled={busy}
            onClick={() => action(load)}
            title="Tải lại lịch sử"
            variant="secondary"
          >
            <RefreshCw size={15} aria-hidden="true" /> Làm mới trạng thái
          </Button>
          <Button to="/app/plans" variant="ghost">
            <Sparkles size={15} aria-hidden="true" /> Bảng chọn gói & So sánh
          </Button>
        </div>
      </div>

      {/* Error & Notice Banners */}
      {error ? (
        <div
          className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm font-semibold text-rose-200"
          role="alert"
        >
          <AlertCircle className="shrink-0 text-rose-300" size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100"
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="shrink-0 text-emerald-300" size={18} aria-hidden="true" />
            <span>{notice}</span>
          </div>
          <button className="text-xs underline" onClick={() => setNotice("")} type="button">
            Đóng
          </button>
        </div>
      ) : null}

      {!config && !error ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-400" role="status">
          Đang tải thông tin cấu hình thanh toán và lịch sử đơn hàng…
        </div>
      ) : null}

      {config ? (
        <>
          {/* Summary KPI Row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gói hiện tại của Workspace
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xl font-black text-white">
                  {paidOrders.length > 0 ? "AI App Assessment" : "Product Preview (Pilot)"}
                </p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black ${
                    paidOrders.length > 0
                      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                      : "border-white/10 bg-white/[0.05] text-slate-300"
                  }`}
                >
                  {paidOrders.length > 0 ? "ĐÃ KÍCH HOẠT" : "DÙNG THỬ"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {paidOrders.length > 0
                  ? `Đã hoàn tất ${paidOrders.length} giao dịch đánh giá`
                  : "Nâng cấp để mở khóa đầy đủ quyền lợi Assessment"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Điều kiện thanh toán
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                    user?.emailVerified
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                      : "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  }`}
                >
                  {user?.emailVerified ? "Email đã xác minh" : "Chưa xác minh email"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-bold text-slate-200">
                  Quyền: {user?.workspace?.role || "MEMBER"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                {mayBuy
                  ? "Tài khoản đủ điều kiện khởi tạo giao dịch."
                  : "Cần xác minh email và quyền OWNER/ADMIN để thanh toán."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tổng giá trị đã thanh toán
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-300">
                {money(totalPaidAmount)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {orders.length} đơn hàng trong lịch sử ({paidOrders.length} đơn thành công)
              </p>
            </div>
          </div>

          {/* Email verification prompt if unverified */}
          {!user?.emailVerified ? <EmailVerification /> : null}

          {/* Disabled payment gateway notice */}
          {!config.enabled ? (
            <div
              className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-4 text-sm text-amber-100"
              role="status"
            >
              <AlertCircle className="mt-0.5 shrink-0 text-amber-300" size={18} aria-hidden="true" />
              <div>
                <p className="font-bold">Thanh toán chưa được bật. Chưa thể tạo giao dịch.</p>
                <p className="mt-1 text-xs text-slate-300">
                  Cổng PayOS hiện đang ở chế độ bảo trì hoặc tắt trên môi trường này. Bạn vẫn có thể xem bảng giá hoặc gửi yêu cầu qua trang{" "}
                  <Link className="font-bold text-emerald-300 underline" to="/contact">
                    Liên hệ
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : null}

          {/* Active Pending Order Callout Banner */}
          {activeOrder ? (
            <div className="mt-6 rounded-3xl border border-emerald-300/40 bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-slate-950/90 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.10)]">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-xs font-black text-amber-100">
                      <Clock size={13} aria-hidden="true" />
                      {labels[activeOrder.status]}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Mã đơn: <strong className="text-white">#{activeOrder.order_code}</strong>
                    </span>
                    <span className="text-xs text-slate-500">
                      Tạo lúc: {formatDateTime(activeOrder.created_at)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-white">
                    Đơn thanh toán gói {activeOrder.product_name} đang chờ hoàn tất
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Số tiền thanh toán:{" "}
                    <span className="font-black text-emerald-300">{money(activeOrder.amount)}</span>.
                    Bấm vào nút mở cổng PayOS bên phải để quét mã VietQR hoặc kiểm tra trạng thái nếu bạn đã chuyển khoản.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {activeOrder.status === "PENDING" && activeOrder.checkout_url && config.enabled ? (
                    <a
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
                      href={activeOrder.checkout_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <QrCode size={17} aria-hidden="true" />
                      Mở PayOS & Quét mã QR
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ) : null}

                  <Button
                    disabled={busy || !mayBuy || !config.enabled}
                    onClick={() =>
                      action(() =>
                        api(`/api/payments/orders/${activeOrder.id}/refresh`, {
                          method: "POST",
                          body: "{}",
                        })
                      )
                    }
                    variant="secondary"
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    Kiểm tra thanh toán
                  </Button>

                  {confirmCancelId === activeOrder.id ? (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-950/40 px-3 py-1.5">
                      <span className="text-xs font-bold text-rose-200">Xác nhận hủy đơn?</span>
                      <button
                        className="rounded-lg bg-rose-400 px-2.5 py-1 text-xs font-black text-slate-950 hover:bg-rose-300"
                        disabled={busy}
                        onClick={() => {
                          setConfirmCancelId(null);
                          action(() => cancelOrder(activeOrder.id));
                        }}
                        type="button"
                      >
                        Đồng ý hủy
                      </button>
                      <button
                        className="text-xs text-slate-300 underline"
                        onClick={() => setConfirmCancelId(null)}
                        type="button"
                      >
                        Không
                      </button>
                    </div>
                  ) : (
                    <Button
                      disabled={busy || !mayBuy || !config.enabled}
                      onClick={() => setConfirmCancelId(activeOrder.id)}
                      variant="ghost"
                    >
                      <X size={15} aria-hidden="true" />
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Main Product Checkout Card + 3-Step Guide */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <div className="glass-panel flex flex-col justify-between rounded-3xl p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    <Sparkles size={13} aria-hidden="true" />
                    Gói Khuyến nghị cho Startup & Đội phát triển AI
                  </span>
                  {config.product.priceIsSample ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">
                      Giá mẫu để kiểm thử
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <h2 className="text-2xl font-black text-white sm:text-3xl">
                      {config.product.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Thanh toán một lần theo đợt đánh giá · Kích hoạt tức thì qua PayOS Webhook
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-black text-emerald-300">
                      {money(config.product.amount)}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      Đã bao gồm phí cổng thanh toán
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3 text-sm text-slate-200">
                  {planFeatures.map((feature) => (
                    <li className="flex items-start gap-2.5" key={feature}>
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 border-t border-white/10 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    className="w-full py-3 sm:w-auto sm:px-6"
                    data-testid="create-payment-order"
                    disabled={!config.enabled || !mayBuy || busy || hasOpen}
                    onClick={() => action(createOrder)}
                  >
                    <CreditCard size={17} aria-hidden="true" />
                    {busy
                      ? "Đang xử lý..."
                      : hasOpen
                      ? "Đang có đơn chờ thanh toán"
                      : "Tạo đơn thanh toán"}
                  </Button>
                  <p className="text-xs text-slate-400">
                    {hasOpen
                      ? "Vui lòng hoàn tất hoặc hủy đơn hiện tại trước khi tạo đơn mới."
                      : "Chuyển hướng an toàn tới cổng VietQR của PayOS."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: How PayOS checkout works */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-6 sm:p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                  Quy trình thanh toán an toàn
                </p>
                <h3 className="mt-2 text-xl font-black text-white">
                  Tích hợp chuẩn xác thực PayOS & VietQR
                </h3>
                <div className="mt-5 space-y-4">
                  {checkoutSteps.map((item) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                      key={item.step}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-300/15 text-xs font-black text-emerald-200">
                          {item.step}
                        </span>
                        <h4 className="text-sm font-black text-white">{item.title}</h4>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-400">
                <p className="font-bold text-slate-200">Cần xuất hóa đơn doanh nghiệp hoặc gói Red Team tùy chỉnh?</p>
                <p className="mt-1 leading-5">
                  Với các gói <strong className="text-white">Red Team Sprint</strong> hoặc{" "}
                  <strong className="text-white">Custom Program</strong> theo hợp đồng riêng, vui lòng{" "}
                  <Link className="font-bold text-emerald-300 underline" to="/contact">
                    liên hệ đội ngũ tư vấn
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Order History Table */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-white">Lịch sử thanh toán</h2>
                <p className="text-xs text-slate-400">
                  Danh sách toàn bộ giao dịch của Workspace (chỉ hiển thị trong phạm vi Workspace của bạn).
                </p>
              </div>
              <Button
                aria-label="Tải lại lịch sử"
                disabled={busy}
                onClick={() => action(load)}
                title="Tải lại lịch sử"
                variant="ghost"
              >
                <RefreshCw size={16} aria-hidden="true" />
              </Button>
            </div>

            {!orders.length ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-400">Chưa có đơn thanh toán.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Khi bạn tạo đơn hàng mới, mã đơn và trạng thái đối soát PayOS sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      {["Đơn hàng", "Thời gian", "Số tiền", "Trạng thái", "Thao tác"].map((label) => (
                        <th className="px-5 py-3.5 font-black" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map((order) => (
                      <tr
                        className={`transition hover:bg-white/[0.02] ${
                          selectedId === order.id ? "bg-emerald-300/[0.06]" : ""
                        }`}
                        key={order.id}
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-white">{order.product_name}</p>
                          <p className="mt-0.5 text-xs font-mono text-slate-400">
                            #{order.order_code}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                          <p>Tạo: {formatDateTime(order.created_at)}</p>
                          {order.paid_at ? (
                            <p className="mt-0.5 text-emerald-300">
                              Thanh toán: {formatDateTime(order.paid_at)}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-black text-white">
                          {money(order.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              statusBadgeClasses[order.status] || statusBadgeClasses.CANCELLED
                            }`}
                          >
                            {labels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {order.status === "PENDING" && order.checkout_url && config.enabled ? (
                              <a
                                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-300/20"
                                href={order.checkout_url}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                Mở PayOS <ExternalLink size={13} aria-hidden="true" />
                              </a>
                            ) : null}

                            {order.status === "PAID" ? (
                              <button
                                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-emerald-300/30 hover:text-white"
                                onClick={() => setReceiptOrder(order)}
                                type="button"
                              >
                                <FileText size={13} aria-hidden="true" />
                                Xem biên lai
                              </button>
                            ) : null}

                            {openStates.includes(order.status) ? (
                              <>
                                <Button
                                  aria-label={`Kiểm tra đơn ${order.order_code}`}
                                  disabled={busy || !mayBuy || !config.enabled}
                                  onClick={() =>
                                    action(() =>
                                      api(`/api/payments/orders/${order.id}/refresh`, {
                                        method: "POST",
                                        body: "{}",
                                      })
                                    )
                                  }
                                  title="Kiểm tra trạng thái"
                                  variant="ghost"
                                >
                                  <RefreshCw size={15} aria-hidden="true" />
                                </Button>
                                <Button
                                  aria-label={`Hủy đơn ${order.order_code}`}
                                  disabled={busy || !mayBuy || !config.enabled}
                                  onClick={() => setConfirmCancelId(order.id)}
                                  title="Hủy đơn"
                                  variant="ghost"
                                >
                                  <X size={15} aria-hidden="true" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Electronic Receipt Modal / Card */}
          {receiptOrder ? (
            <div className="mt-6 rounded-3xl border border-emerald-300/35 bg-[#071118] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    BIÊN LAI XÁC NHẬN THANH TOÁN
                  </span>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Đơn hàng #{receiptOrder.order_code}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Xác thực tự động qua cổng thanh toán PayOS
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => window.print()} variant="secondary">
                    <Printer size={15} aria-hidden="true" /> In / Lưu PDF
                  </Button>
                  <Button onClick={() => setReceiptOrder(null)} variant="ghost">
                    <X size={16} aria-hidden="true" /> Đóng
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400">Workspace thụ hưởng</p>
                  <p className="mt-1 font-bold text-white">{user?.workspace?.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400">Dịch vụ kích hoạt</p>
                  <p className="mt-1 font-bold text-white">{receiptOrder.product_name}</p>
                  <p className="mt-0.5 text-xs text-emerald-300">Trạng thái: Đã thanh toán (PAID)</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400">Số tiền thanh toán</p>
                  <p className="mt-1 text-lg font-black text-emerald-300">
                    {money(receiptOrder.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Phương thức: VietQR / PayOS</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400">Thời gian hoàn tất</p>
                  <p className="mt-1 font-bold text-white">
                    {formatDateTime(receiptOrder.paid_at || receiptOrder.updated_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mã tham chiếu: {receiptOrder.payment_link_id || "PayOS Verified"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
